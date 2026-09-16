"""
Central error handling.

Goal: every error the API can produce reaches the client as a small,
predictable JSON shape with a safe message - never a raw stack trace, never
an internal exception string. Full details are still logged server-side.
"""
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.core.logging import get_logger
from app.core.security import UnsafeURLError

logger = get_logger(__name__)


class NotImplementedFeatureError(Exception):
    """Raised by an endpoint whose feature has not been built yet."""

    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


def _error_body(message: str, *, code: str) -> dict:
    return {"error": {"code": code, "message": message}}


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(UnsafeURLError)
    async def handle_unsafe_url(_: Request, exc: UnsafeURLError) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=_error_body(str(exc), code="invalid_url"),
        )

    @app.exception_handler(NotImplementedFeatureError)
    async def handle_not_implemented(_: Request, exc: NotImplementedFeatureError) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            content=_error_body(exc.message, code="not_implemented"),
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            content=_error_body("That request wasn't in the expected format.", code="invalid_request"),
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
        logger.error(
            "unhandled_exception",
            path=request.url.path,
            method=request.method,
            exc_info=exc,
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=_error_body(
                "Something went wrong on our end. Please try again in a moment.",
                code="internal_error",
            ),
        )
