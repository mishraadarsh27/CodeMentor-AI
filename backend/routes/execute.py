import subprocess
import tempfile
import os
import asyncio
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from ..schemas.schemas import ExecutionRequest, ExecutionResponse

LANG_CONFIG = {
    "python": {
        "command": ["python", "-u"], # unbuffered
        "extension": ".py",
        "timeout": 5
    },
    "javascript": {
        "command": ["node"],
        "extension": ".js",
        "timeout": 5
    },
    "cpp": {
        "command": ["g++", "{file}", "-o", "{out}"],
        "run_command": ["{out}"],
        "extension": ".cpp",
        "timeout": 10
    },
    "c": {
        "command": ["gcc", "{file}", "-o", "{out}"],
        "run_command": ["{out}"],
        "extension": ".c",
        "timeout": 10
    },
    "java": {
        "command": ["javac", "{file}"],
        "run_command": ["java", "Main"],
        "extension": ".java",
        "timeout": 10
    },
    "go": {
        "command": ["go", "run", "{file}"],
        "extension": ".go",
        "timeout": 10
    },
    "html": {
        "command": ["echo"],
        "extension": ".html",
        "timeout": 1
    }
}

router = APIRouter(tags=["execution"])

@router.post("/execute", response_model=ExecutionResponse)
async def execute_code(request: ExecutionRequest):
    lang = request.language.lower()
    if lang not in LANG_CONFIG:
        raise HTTPException(status_code=400, detail=f"Unsupported language: {lang}")

    config = LANG_CONFIG[lang]
    stdout, stderr, exit_code = "", "", 0

    # Create a temporary directory for execution
    with tempfile.TemporaryDirectory() as tmpdir:
        file_name = "Main" if lang == "java" else "script"
        file_path = os.path.join(tmpdir, f"{file_name}{config['extension']}")
        output_path = os.path.join(tmpdir, "out.exe") if os.name == 'nt' else os.path.join(tmpdir, "out")
        
        # Write code to file
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(request.code)

        try:
            # Handle compiled languages (C/C++)
            if "run_command" in config:
                # Compilation step
                compile_cmd = [arg.replace("{file}", file_path).replace("{out}", output_path) for arg in config["command"]]
                compile_proc = subprocess.run(compile_cmd, capture_output=True, text=True, timeout=config["timeout"])
                
                if compile_proc.returncode != 0:
                    return ExecutionResponse(
                        stdout="",
                        stderr=f"Compilation Error:\n{compile_proc.stderr}",
                        output=compile_proc.stderr,
                        exit_code=compile_proc.returncode,
                        language=lang,
                        version="local"
                    )
                
                # Execution step
                run_cmd = [arg.replace("{out}", output_path) for arg in config["run_command"]]
                proc = subprocess.run(run_cmd, input=request.stdin, capture_output=True, text=True, timeout=config["timeout"])
            else:
                # Interpreted languages (Python/JS)
                cmd = config["command"] + [file_path]
                proc = subprocess.run(cmd, input=request.stdin, capture_output=True, text=True, timeout=config["timeout"])

            stdout = proc.stdout
            stderr = proc.stderr
            exit_code = proc.returncode

        except subprocess.TimeoutExpired:
            stderr = "Execution Timeout: The process took too long."
            exit_code = 124
        except Exception as e:
            stderr = f"Execution Error: {str(e)}"
            exit_code = 1

    return ExecutionResponse(
        stdout=stdout,
        stderr=stderr,
        output=stdout if stdout else stderr,
        exit_code=exit_code,
        signal=None,
        language=lang,
        version="local"
    )

@router.websocket("/ws/execute")
async def websocket_execute(websocket: WebSocket):
    await websocket.accept()
    try:
        data = await websocket.receive_json()
        code = data.get("code", "")
        lang = data.get("language", "python").lower()

        if lang not in LANG_CONFIG:
            await websocket.send_text(f"Error: Unsupported language {lang}\\n")
            await websocket.close()
            return

        config = LANG_CONFIG[lang]

        with tempfile.TemporaryDirectory() as tmpdir:
            file_name = "Main" if lang == "java" else "script"
            file_path = os.path.join(tmpdir, f"{file_name}{config['extension']}")
            output_path = os.path.join(tmpdir, "out.exe") if os.name == 'nt' else os.path.join(tmpdir, "out")
            
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(code)

            if "run_command" in config:
                compile_cmd = [arg.replace("{file}", file_path).replace("{out}", output_path) for arg in config["command"]]
                compile_proc = await asyncio.create_subprocess_exec(
                    *compile_cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                c_stdout, c_stderr = await compile_proc.communicate()
                if compile_proc.returncode != 0:
                    await websocket.send_text(c_stderr.decode())
                    await websocket.close()
                    return
                run_cmd = [arg.replace("{out}", output_path) for arg in config["run_command"]]
            else:
                run_cmd = config["command"] + [file_path]

            process = await asyncio.create_subprocess_exec(
                *run_cmd,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT
            )

            async def read_output():
                try:
                    while True:
                        chunk = await process.stdout.read(1024)
                        if not chunk:
                            break
                        await websocket.send_text(chunk.decode(errors='replace'))
                except Exception:
                    pass

            async def read_input():
                try:
                    while True:
                        user_input = await websocket.receive_text()
                        if user_input and process.returncode is None:
                            process.stdin.write(user_input.encode())
                            await process.stdin.drain()
                except Exception:
                    pass

            output_task = asyncio.create_task(read_output())
            input_task = asyncio.create_task(read_input())

            async def wait_process():
                try:
                    await asyncio.wait_for(process.wait(), timeout=config.get("timeout", 10))
                except asyncio.TimeoutError:
                    if process.returncode is None:
                        process.terminate()
                    await websocket.send_text("\n\n[Execution Timeout: Process terminated]\n")

            process_task = asyncio.create_task(wait_process())
            
            done, pending = await asyncio.wait(
                [process_task, input_task],
                return_when=asyncio.FIRST_COMPLETED
            )
            
            if process.returncode is None:
                process.terminate()

            await output_task
            input_task.cancel()
            try:
                await websocket.close()
            except Exception:
                pass

    except WebSocketDisconnect:
        pass
    except Exception as e:
        import traceback
        traceback.print_exc()
        try:
            await websocket.send_text(f"\\nError: {repr(e)}")
            await websocket.close()
        except:
            pass

