class PromptBuilder:
    @staticmethod
    def build_analysis_prompt(code: str, syntax_errors: list, linting_issues: list) -> str:
        return f"""
        You are an expert AI Coding Mentor. Analyze this Python code for beginners.
        
        CODE:
        ```python
        {code}
        ```
        
        KNOWN ERRORS:
        - Syntax: {syntax_errors}
        - Linting: {linting_issues}
        
        RETURN ONLY A VALID JSON OBJECT. NO MARKDOWN. NO EXPLANATION OUTSIDE JSON.
        JSON STRUCTURE:
        {{
            "score": <int 0-100>,
            "explanation": "<friendly explanation>",
            "corrected_code": "<improved code>",
            "complexity": {{
                "time": "<O(...)>",
                "space": "<O(...)>",
                "explanation": "<why>"
            }},
            "optimization_suggestions": ["<suggestion1>", "<suggestion2>"],
            "learning_recommendations": ["<topic1>", "<topic2>"]
        }}
        """

    @staticmethod
    def build_chat_prompt(message: str, context_code: str = None) -> str:
        context = f"CONTEXT CODE:\n```python\n{context_code}\n```\n" if context_code else ""
        return f"{context}USER QUESTION: {message}\n\nProvide a friendly, educational response."
