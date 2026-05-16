import time
import logging
from typing import Callable, Any

logger = logging.getLogger(__name__)

class RetryHandler:
    @staticmethod
    def execute_with_retry(func: Callable, *args, max_retries: int = 3, initial_delay: float = 1.0, **kwargs) -> Any:
        retries = 0
        delay = initial_delay
        
        while retries < max_retries:
            try:
                return func(*args, **kwargs)
            except Exception as e:
                retries += 1
                if retries == max_retries:
                    logger.error(f"Max retries reached. Final error: {str(e)}")
                    raise e
                
                logger.warning(f"Attempt {retries} failed: {str(e)}. Retrying in {delay}s...")
                time.sleep(delay)
                delay *= 2 # Exponential backoff
