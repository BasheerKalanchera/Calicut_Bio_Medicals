class AppError(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


class NotFoundError(AppError):
    pass


class BusinessRuleViolation(AppError):
    pass


class AuthenticationError(AppError):
    pass


class InvalidTokenError(AuthenticationError):
    pass


class UserNotFoundError(AuthenticationError):
    pass


class AuthorizationError(AppError):
    pass


class ConflictError(AppError):
    pass


class PossibleDuplicateError(AppError):
    """Raised when a near-duplicate exists but hasn't been confirmed as intentional.

    Distinct from ConflictError (an exact-name clash, which always blocks) --
    this is a soft block: the caller can retry with force=True to proceed.
    """

    def __init__(self, message: str, candidates: list[dict]):
        self.candidates = candidates
        super().__init__(message)


class ValidationError(AppError):
    pass
