import uuid
from functools import lru_cache

import jwt
from jwt import PyJWKClient

from app.core.config import settings
from app.core.exceptions import InvalidTokenError


@lru_cache(maxsize=1)
def _get_jwk_client() -> PyJWKClient:
    jwks_url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"
    return PyJWKClient(jwks_url, cache_jwk_set=True, lifespan=3600)


def decode_jwt(token: str) -> dict:
    try:
        signing_key = _get_jwk_client().get_signing_key_from_jwt(token)
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256"],
            audience="authenticated",
        )
    except (jwt.PyJWTError, jwt.exceptions.PyJWKClientError) as e:
        raise InvalidTokenError(str(e)) from e


def extract_user_id(payload: dict) -> uuid.UUID:
    sub = payload.get("sub")
    if not sub:
        raise InvalidTokenError("Token missing 'sub' claim")
    try:
        return uuid.UUID(sub)
    except ValueError as e:
        raise InvalidTokenError("Token 'sub' claim is not a valid UUID") from e
