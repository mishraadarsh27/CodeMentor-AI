import ast
from pylint.lint import Run
from pylint.reporters.text import TextReporter
import io

class CodeAnalyzer:
    @staticmethod
    def check_syntax(code: str) -> list:
        errors = []
        try:
            ast.parse(code)
        except SyntaxError as e:
            errors.append(f"Line {e.lineno}: {e.msg}")
        except Exception as e:
            errors.append(str(e))
        return errors

    @staticmethod
    def check_linting(code: str) -> list:
        import os
        import tempfile
        
        # Create a unique temporary file
        fd, path = tempfile.mkstemp(suffix=".py")
        try:
            with os.fdopen(fd, 'w', encoding="utf-8") as tmp:
                tmp.write(code)
            
            pylint_output = io.StringIO()
            reporter = TextReporter(pylint_output)
            try:
                # disable some overly strict rules for beginners
                Run([path, "--disable=C0114,C0116,C0103", "--output-format=text"], reporter=reporter, exit=False)
            except Exception:
                pass
            
            output = pylint_output.getvalue()
        finally:
            # Ensure the file is removed even if pylint fails
            try:
                if os.path.exists(path):
                    os.remove(path)
            except Exception:
                pass
            
        issues = []
        for line in output.split('\n'):
            if line and not line.startswith('----') and not line.startswith('Your code'):
                issues.append(line)
        
        return issues[:5] # Limit to top 5 issues to not overwhelm beginner
