class ErrorMapper:
    @staticmethod
    def map_to_user_friendly(error: Exception) -> str:
        error_str = str(error).lower()
        
        if "api_key" in error_str or "401" in error_str:
            return "AI configuration error. Please check the system settings."
        if "rate_limit" in error_str or "429" in error_str:
            return "AI is currently busy. Please try again in a few seconds."
        if "timeout" in error_str:
            return "AI took too long to respond. Please try a shorter code snippet."
        if "decommissioned" in error_str or "model_not_found" in error_str:
            return "AI model is being updated. We'll be back shortly."
        
        return "The AI mentor is having a quick break. Please try again."
