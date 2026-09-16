"""
Request/response shapes for the (not-yet-implemented) analyze endpoint.
"""
from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    url: str = Field(..., min_length=1, max_length=2048, description="Website address to analyze.")


class AnalyzeAcceptedResponse(BaseModel):
    status: str
    normalized_url: str
    message: str
