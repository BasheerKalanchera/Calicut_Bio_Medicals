import uuid

from jose import JWTError, jwt

from app.core.config import settings
from app.core.exceptions import InvalidTokenError


def decode_jwt(token: str) -> dict:
    try:
        return jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET.get_secret_value(),
            algorithms=["HS256"],
            audience="authenticated",
        )
    except JWTError as e:
        raise InvalidTokenError(str(e)) from e


def extract_user_id(payload: dict) -> uuid.UUID:
    sub = payload.get("sub")
    if not sub:
        raise InvalidTokenError("Token missing 'sub' claim")
    try:
        return uuid.UUID(sub)
    except ValueError as e:
        raise InvalidTokenError("Token 'sub' claim is not a valid UUID") from e
