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


class AuthorizationError(AppError):
    pass


class ConflictError(AppError):
    pass


class ValidationError(AppError):
    pass
