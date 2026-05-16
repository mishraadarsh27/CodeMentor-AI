class FallbackHandler:
    @staticmethod
    def get_analysis_fallback(code: str, error_msg: str) -> dict:
        return {
            "score": 0,
            "explanation": f"AI analysis temporarily unavailable. {error_msg}",
            "corrected_code": code,
            "complexity": {
                "time": "Unknown",
                "space": "Unknown",
                "explanation": "Could not calculate complexity without AI."
            },
            "optimization_suggestions": ["Ensure code follows PEP 8 standards.", "Add comments for clarity."],
            "learning_recommendations": ["Python Basics", "Clean Code Practices"]
        }

    @staticmethod
    def get_chat_fallback(error_msg: str) -> str:
        return f"I'm sorry, I'm having trouble connecting to my brain right now. {error_msg} Please try again in a moment."
