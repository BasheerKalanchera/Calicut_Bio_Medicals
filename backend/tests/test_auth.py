import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import MagicMock

import pytest
from jose import jwt

from app.core.exceptions import AuthenticationError, InvalidTokenError, UserNotFoundError
from app.core.security import decode_jwt, extract_user_id

TEST_SECRET = "test-jwt-secret"
TEST_USER_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")


def _create_token(
    user_id: uuid.UUID = TEST_USER_ID,
    *,
    expired: bool = False,
    audience: str = "authenticated",
    secret: str = TEST_SECRET,
) -> str:
    now = datetime.now(UTC)
    exp = now + (timedelta(hours=-1) if expired else timedelta(hours=1))
    return jwt.encode(
        {"sub": str(user_id), "aud": audience, "exp": exp, "iat": now, "role": "authenticated"},
        secret,
        algorithm="HS256",
    )


class TestDecodeJWT:
    def test_valid_token(self):
        token = _create_token()
        payload = decode_jwt(token)
        assert payload["sub"] == str(TEST_USER_ID)
        assert payload["aud"] == "authenticated"

    def test_invalid_signature_raises(self):
        token = _create_token(secret="wrong-secret")
        with pytest.raises(InvalidTokenError):
            decode_jwt(token)

    def test_expired_token_raises(self):
        token = _create_token(expired=True)
        with pytest.raises(InvalidTokenError):
            decode_jwt(token)

    def test_invalid_audience_raises(self):
        token = _create_token(audience="anon")
        with pytest.raises(InvalidTokenError):
            decode_jwt(token)


class TestExtractUserId:
    def test_valid_sub(self):
        result = extract_user_id({"sub": str(TEST_USER_ID)})
        assert result == TEST_USER_ID

    def test_missing_sub_raises(self):
        with pytest.raises(InvalidTokenError, match="missing 'sub'"):
            extract_user_id({})

    def test_invalid_uuid_raises(self):
        with pytest.raises(InvalidTokenError, match="not a valid UUID"):
            extract_user_id({"sub": "not-a-uuid"})


class TestGetCurrentUser:
    @pytest.mark.asyncio
    async def test_valid_authentication(self):
        from app.api.dependencies import get_current_user

        mock_user = MagicMock()
        mock_user.id = TEST_USER_ID
        mock_user.is_active = True

        mock_db = MagicMock()
        mock_db.get.return_value = mock_user

        token = _create_token()
        result = await get_current_user(authorization=f"Bearer {token}", db=mock_db)

        assert result is mock_user
        mock_db.get.assert_called_once()

    @pytest.mark.asyncio
    async def test_missing_header_raises(self):
        from app.api.dependencies import get_current_user

        with pytest.raises(AuthenticationError, match="Authorization header required"):
            await get_current_user(authorization=None, db=MagicMock())

    @pytest.mark.asyncio
    async def test_empty_header_raises(self):
        from app.api.dependencies import get_current_user

        with pytest.raises(AuthenticationError, match="Authorization header required"):
            await get_current_user(authorization="", db=MagicMock())

    @pytest.mark.asyncio
    async def test_wrong_scheme_raises(self):
        from app.api.dependencies import get_current_user

        with pytest.raises(AuthenticationError, match="Invalid authentication scheme"):
            await get_current_user(authorization="Basic abc123", db=MagicMock())

    @pytest.mark.asyncio
    async def test_bearer_without_token_raises(self):
        from app.api.dependencies import get_current_user

        with pytest.raises(AuthenticationError, match="Invalid authentication scheme"):
            await get_current_user(authorization="Bearer", db=MagicMock())

    @pytest.mark.asyncio
    async def test_user_not_found_raises(self):
        from app.api.dependencies import get_current_user

        mock_db = MagicMock()
        mock_db.get.return_value = None

        token = _create_token()
        with pytest.raises(UserNotFoundError, match="not found"):
            await get_current_user(authorization=f"Bearer {token}", db=mock_db)

    @pytest.mark.asyncio
    async def test_inactive_user_raises(self):
        from app.api.dependencies import get_current_user

        mock_user = MagicMock()
        mock_user.is_active = False
        mock_db = MagicMock()
        mock_db.get.return_value = mock_user

        token = _create_token()
        with pytest.raises(UserNotFoundError, match="inactive"):
            await get_current_user(authorization=f"Bearer {token}", db=mock_db)

    @pytest.mark.asyncio
    async def test_invalid_token_raises(self):
        from app.api.dependencies import get_current_user

        with pytest.raises(InvalidTokenError):
            await get_current_user(authorization="Bearer garbage.token.here", db=MagicMock())


class TestExceptionHierarchy:
    def test_invalid_token_is_authentication_error(self):
        assert issubclass(InvalidTokenError, AuthenticationError)

    def test_user_not_found_is_authentication_error(self):
        assert issubclass(UserNotFoundError, AuthenticationError)

    def test_rls_context_importable(self):
        from app.db.session import set_rls_context

        assert callable(set_rls_context)
