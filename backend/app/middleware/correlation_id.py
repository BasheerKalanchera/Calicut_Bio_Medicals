import uuid
from typing import Callable

import structlog


class CorrelationIdMiddleware:
    """
    Pure ASGI middleware that injects a correlation ID into each request.

    Uses the pure ASGI interface instead of BaseHTTPMiddleware to avoid the
    known Starlette deadlock bug where BaseHTTPMiddleware buffers the full
    response body and can block the asyncio event loop under concurrent load.
    """

    def __init__(self, app: Callable) -> None:
        self.app = app

    async def __call__(self, scope, receive, send) -> None:
        if scope["type"] not in ("http", "websocket"):
            await self.app(scope, receive, send)
            return

        # Extract or generate correlation ID
        headers = dict(scope.get("headers", []))
        correlation_id = headers.get(b"x-correlation-id", b"").decode() or str(uuid.uuid4())

        structlog.contextvars.bind_contextvars(correlation_id=correlation_id)
        try:
            async def send_with_header(message):
                if message["type"] == "http.response.start":
                    # Inject correlation ID into response headers
                    existing = list(message.get("headers", []))
                    existing.append((b"x-correlation-id", correlation_id.encode()))
                    message = {**message, "headers": existing}
                await send(message)

            await self.app(scope, receive, send_with_header)
        finally:
            structlog.contextvars.unbind_contextvars("correlation_id")
