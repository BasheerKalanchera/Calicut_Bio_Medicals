import httpx

from app.core.config import settings

_BUCKET = "documents"
_TIMEOUT_SECONDS = 30.0


def _base_url() -> str:
    return f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1"


def _headers(*, content_type: str | None = None) -> dict[str, str]:
    if settings.SUPABASE_SERVICE_ROLE_KEY is None:
        raise RuntimeError(
            "SUPABASE_SERVICE_ROLE_KEY is not configured -- Storage operations "
            "are unavailable in this environment."
        )
    key = settings.SUPABASE_SERVICE_ROLE_KEY.get_secret_value()
    headers = {"apikey": key, "Authorization": f"Bearer {key}"}
    if content_type is not None:
        headers["Content-Type"] = content_type
    return headers


def upload(path: str, file_bytes: bytes, content_type: str) -> None:
    response = httpx.post(
        f"{_base_url()}/object/{_BUCKET}/{path}",
        headers=_headers(content_type=content_type),
        content=file_bytes,
        timeout=_TIMEOUT_SECONDS,
    )
    response.raise_for_status()


def delete(path: str) -> None:
    response = httpx.request(
        "DELETE",
        f"{_base_url()}/object/{_BUCKET}/{path}",
        headers=_headers(),
        timeout=_TIMEOUT_SECONDS,
    )
    response.raise_for_status()


def create_signed_url(path: str, expires_in_seconds: int) -> str:
    response = httpx.post(
        f"{_base_url()}/object/sign/{_BUCKET}/{path}",
        headers=_headers(),
        json={"expiresIn": expires_in_seconds},
        timeout=_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    # signedURL comes back as a path relative to /storage/v1 (e.g.
    # "/object/sign/documents/opportunity/.../file.pdf?token=..."), not a full URL.
    signed_path = response.json()["signedURL"]
    return f"{_base_url()}{signed_path}"
