import os
import logging
from groq import Groq
from dotenv import load_dotenv

from .prompt_builder import PromptBuilder
from .response_parser import ResponseParser
from .error_mapper import ErrorMapper
from .fallback_handler import FallbackHandler
from .retry_handler import RetryHandler

load_dotenv()

logger = logging.getLogger(__name__)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

class GroqClient:
    def __init__(self):
        self.client = None
        if GROQ_API_KEY:
            self.client = Groq(api_key=GROQ_API_KEY)
        self.model = GROQ_MODEL

    def analyze_code(self, code: str, syntax_errors: list, linting_issues: list) -> dict:
        if not self.client:
            logger.error("Groq API Key is missing.")
            return FallbackHandler.get_analysis_fallback(code, "AI configuration missing (API Key).")

        prompt = PromptBuilder.build_analysis_prompt(code, syntax_errors, linting_issues)
        
        try:
            def _make_call():
                return self.client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": "You are a strict JSON-only AI mentor."},
                        {"role": "user", "content": prompt}
                    ],
                    model=self.model,
                    temperature=0.1,
                    response_format={"type": "json_object"}
                )

            response = RetryHandler.execute_with_retry(_make_call)
            raw_content = response.choices[0].message.content
            
            parsed_data = ResponseParser.parse_analysis_response(raw_content)
            if not parsed_data:
                return FallbackHandler.get_analysis_fallback(code, "AI returned an unparseable response.")
            
            return parsed_data

        except Exception as e:
            error_str = str(e).lower()
            logger.error(f"AI Analysis Error: {str(e)}")
            
            # Specific handling for auth errors
            if "401" in error_str or "unauthorized" in error_str or "invalid api key" in error_str:
                friendly_msg = "Invalid AI API Key. Please update your environment variables."
            else:
                friendly_msg = ErrorMapper.map_to_user_friendly(e)
                
            return FallbackHandler.get_analysis_fallback(code, friendly_msg)

    def chat(self, message: str, context_code: str = None) -> str:
        if not self.client:
            return FallbackHandler.get_chat_fallback("AI configuration missing (API Key).")

        prompt = PromptBuilder.build_chat_prompt(message, context_code)
        
        try:
            def _make_call():
                return self.client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": "You are a helpful coding mentor."},
                        {"role": "user", "content": prompt}
                    ],
                    model=self.model,
                    temperature=0.7,
                )

            response = RetryHandler.execute_with_retry(_make_call)
            return response.choices[0].message.content

        except Exception as e:
            error_str = str(e).lower()
            logger.error(f"AI Chat Error: {str(e)}")
            
            if "401" in error_str or "unauthorized" in error_str or "invalid api key" in error_str:
                friendly_msg = "Invalid AI API Key configuration."
            else:
                friendly_msg = ErrorMapper.map_to_user_friendly(e)
                
            return FallbackHandler.get_chat_fallback(friendly_msg)

groq_client = GroqClient()
