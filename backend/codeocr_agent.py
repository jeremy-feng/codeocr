"""CodeOCR agent for processing code images."""

import asyncio
import logging
from collections.abc import AsyncGenerator
from typing import TypedDict

from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph

from prompts import CODEOCR_SYSTEM_PROMPT
from schemas import CodeOCRRequest, StreamMessage, StreamMessageType, StreamResponse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


class CodeOCRState(TypedDict):
    """State for the CodeOCR workflow."""

    request: CodeOCRRequest
    stream_generator: AsyncGenerator[str, None] | None


class CodeOCRAgent:
    """CodeOCR agent for extracting code from images using LangGraph."""

    def __init__(self):
        """Initialize the CodeOCR agent with LangGraph workflow."""
        self.graph = self._build_graph()

    def _build_graph(self) -> StateGraph:
        """Build the LangGraph workflow."""
        workflow = StateGraph(CodeOCRState)

        # Add nodes
        workflow.add_node("extract_code", self._extract_code_node)

        # Define the flow
        workflow.set_entry_point("extract_code")
        workflow.add_edge("extract_code", END)

        return workflow.compile()

    async def run(self, request: CodeOCRRequest) -> AsyncGenerator[str, None]:
        """Run LangGraph workflow.

        Args:
            request: CodeOCR request containing image and API configuration.

        Returns:
            AsyncGenerator yielding streaming response data.
        """
        state: CodeOCRState = {
            "request": request,
            "stream_generator": None,
        }

        try:
            state = await self.graph.ainvoke(state)

            # Get the stream generator from the state
            stream_generator = state.get("stream_generator")
            if stream_generator:
                async for chunk in stream_generator:
                    yield chunk
            else:
                # Fallback if no stream generator was created
                error_message = StreamMessage(
                    type=StreamMessageType.ERROR,
                    content="Error: Could not extract code from image",
                )
                error_response = StreamResponse(data=error_message)
                yield error_response.to_sse_format()

        except Exception as e:
            logger.error(f"Error in CodeOCR processing: {e}")
            error_message = StreamMessage(
                type=StreamMessageType.ERROR,
                content=f"Error: Could not extract code from image. Details: {str(e)}",
            )
            error_response = StreamResponse(data=error_message)
            yield error_response.to_sse_format()

    async def _extract_code_node(self, state: CodeOCRState) -> CodeOCRState:
        """LangGraph node for extracting code from the image."""

        async def stream_generator():
            try:
                request = state["request"]
                llm = ChatOpenAI(
                    model=request.model_name,
                    api_key=request.api_key,
                    base_url=request.api_base,
                    streaming=True,
                )

                messages = [
                    SystemMessage(content=CODEOCR_SYSTEM_PROMPT),
                    HumanMessage(
                        content=[
                            {
                                "type": "image_url",
                                "image_url": {"url": request.image_source},
                            },
                        ]
                    ),
                ]

                async for chunk in llm.astream(messages):
                    if chunk.content:
                        message = StreamMessage(
                            type=StreamMessageType.CONTENT, content=chunk.content
                        )
                        response = StreamResponse(data=message)
                        yield response.to_sse_format()
                        await asyncio.sleep(0.01)  # Small delay for better UX

                # Send completion signal
                completion_message = StreamMessage(
                    type=StreamMessageType.COMPLETE, content=""
                )
                completion_response = StreamResponse(data=completion_message)
                yield completion_response.to_sse_format()
                logger.info("Code extraction completed")

            except Exception as e:
                logger.error(f"Error in code extraction: {e}")
                error_message = StreamMessage(
                    type=StreamMessageType.ERROR,
                    content=f"Error: Could not extract code from image. "
                    f"Details: {str(e)}",
                )
                error_response = StreamResponse(data=error_message)
                yield error_response.to_sse_format()

        # Store the stream generator in state
        state["stream_generator"] = stream_generator()
        return state


def create_codeocr_endpoint(app: FastAPI):
    """Add CodeOCR endpoint to FastAPI app."""
    codeocr_agent = CodeOCRAgent()

    @app.post("/api/codeocr")
    async def codeocr(request: CodeOCRRequest) -> StreamingResponse:
        """Extract code from an image using CodeOCRAgent.

        Args:
            request: CodeOCR request containing image and API configuration.

        Returns:
            StreamingResponse: A streaming response with the extracted code.
        """
        return StreamingResponse(
            codeocr_agent.run(request),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
            },
        )
