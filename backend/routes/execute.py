import httpx
from fastapi import APIRouter, HTTPException
from ..schemas.schemas import ExecutionRequest, ExecutionResponse

router = APIRouter(prefix="/execute", tags=["execution"])

PISTON_URL = "https://emkc.org/api/v2/piston/execute"

LANGUAGE_MAP = {
    "python": "python",
    "javascript": "javascript",
    "java": "java",
    "cpp": "cpp",
    "c": "c",
    "go": "go",
    "html": "html" # Note: Piston doesn't run HTML directly, usually we handle it in iframe
}

VERSION_MAP = {
    "python": "3.10.0",
    "javascript": "18.15.0",
    "java": "15.0.2",
    "cpp": "10.2.0",
    "c": "10.2.0",
    "go": "1.16.2"
}

@router.post("/", response_model=ExecutionResponse)
async def execute_code(request: ExecutionRequest):
    if request.language not in LANGUAGE_MAP:
        raise HTTPException(status_code=400, detail="Unsupported language")

    payload = {
        "language": LANGUAGE_MAP[request.language],
        "version": VERSION_MAP.get(request.language, "*"),
        "files": [
            {
                "content": request.code
            }
        ],
        "stdin": request.stdin
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(PISTON_URL, json=payload, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            
            run_data = data.get("run", {})
            return ExecutionResponse(
                stdout=run_data.get("stdout", ""),
                stderr=run_data.get("stderr", ""),
                output=run_data.get("output", ""),
                exit_code=run_data.get("code", 0),
                signal=run_data.get("signal"),
                language=data.get("language", request.language),
                version=data.get("version", "unknown")
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Code execution failed: {str(e)}")
