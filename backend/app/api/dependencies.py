from fastapi import Depends, Header
from sqlalchemy.orm import Session

from app.core.exceptions import AuthenticationError, UserNotFoundError
from app.core.security import decode_jwt, extract_user_id
from app.db.session import get_db, set_rls_context
from app.domains.organization.models import UserProfile


def get_current_user(
    authorization: str | None = Header(None),
    db: Session = Depends(get_db),  # noqa: B008
) -> UserProfile:
    if not authorization:
        raise AuthenticationError("Authorization header required")

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise AuthenticationError("Invalid authentication scheme")

    payload = decode_jwt(token)
    user_id = extract_user_id(payload)

    user = db.get(UserProfile, user_id)
    if not user:
        raise UserNotFoundError(f"User {user_id} not found")
    if not user.is_active:
        raise UserNotFoundError("User account is inactive")

    set_rls_context(db, user)
    return user
