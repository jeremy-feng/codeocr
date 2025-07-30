"""Pydantic models for the CodeOCR API."""

import json
from enum import Enum

from pydantic import BaseModel, Field


class CodeOCRRequest(BaseModel):
    """Defines the structure for a request to the CodeOCR API."""

    image_source: str = Field(..., description="Base64 encoded image data or image URL")
    api_key: str = Field(..., description="API key for the vision model provider")
    api_base: str = Field(..., description="API base URL")
    model_name: str = Field(..., description="Model name to use for OCR")


class StreamMessageType(str, Enum):
    """Enum for stream message types."""

    CONTENT = "content"
    COMPLETE = "complete"
    ERROR = "error"


class StreamMessage(BaseModel):
    """Defines the structure for a streaming message."""

    type: StreamMessageType = Field(..., description="Type of the streaming message")
    content: str = Field(..., description="Content of the streaming message")

    class Config:
        """Pydantic configuration."""

        use_enum_values = True


class StreamResponse(BaseModel):
    """Defines the structure for streaming response data."""

    data: StreamMessage = Field(..., description="The streaming message data")

    def to_sse_format(self) -> str:
        """Convert to Server-Sent Events format."""
        return f"data: {json.dumps(self.data.dict(), ensure_ascii=False)}\n\n"
