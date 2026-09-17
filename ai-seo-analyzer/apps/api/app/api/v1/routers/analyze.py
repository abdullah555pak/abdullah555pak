"""
The analyze endpoint.

Today this endpoint only validates that a submitted URL is safe to
eventually scan. It deliberately does not crawl anything, does not run any
SEO checks, and does not return any score, finding, or report - none of
that exists yet. It responds with a clear 501 so the frontend (and anyone
calling this API) gets an honest "not built yet" instead of fake data.
"""
from fastapi import APIRouter

from app.core.errors import NotImplementedFeatureError
from app.core.security import validate_public_url
from app.schemas.analyze import AnalyzeAcceptedResponse, AnalyzeRequest

router = APIRouter(tags=["analyze"])


@router.post("/analyze", response_model=AnalyzeAcceptedResponse)
async def analyze_website(payload: AnalyzeRequest) -> AnalyzeAcceptedResponse:
    # Raises UnsafeURLError (-> HTTP 400) for anything invalid or unsafe.
    validate_public_url(payload.url)

    raise NotImplementedFeatureError(
        "Website analysis isn't built yet. We checked that this address is "
        "safe to scan, but the crawler and SEO engine are coming in a "
        "later development step."
    )
