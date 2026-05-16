import json
import re
import logging

logger = logging.getLogger(__name__)

class ResponseParser:
    @staticmethod
    def sanitize_json(text: str) -> str:
        # Remove markdown code blocks if present
        text = re.sub(r'```json\s*', '', text)
        text = re.sub(r'```\s*', '', text)
        return text.strip()

    @classmethod
    def parse_analysis_response(cls, raw_response: str) -> dict:
        try:
            sanitized = cls.sanitize_json(raw_response)
            data = json.loads(sanitized)
            
            # Basic validation of required keys
            required_keys = ["score", "explanation", "corrected_code", "complexity"]
            for key in required_keys:
                if key not in data:
                    logger.warning(f"Missing key in AI response: {key}")
                    data[key] = cls._get_default_for_key(key)
            
            return data
        except (json.JSONDecodeError, Exception) as e:
            logger.error(f"Failed to parse AI response: {str(e)} | Raw: {raw_response[:200]}...")
            return None

    @staticmethod
    def _get_default_for_key(key: str):
        defaults = {
            "score": 0,
            "explanation": "Analysis partially failed.",
            "corrected_code": "",
            "complexity": {"time": "Unknown", "space": "Unknown", "explanation": ""}
        }
        return defaults.get(key)
