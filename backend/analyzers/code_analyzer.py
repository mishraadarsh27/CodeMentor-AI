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
        # Write code to a temp file
        temp_file = "temp_code.py"
        with open(temp_file, "w", encoding="utf-8") as f:
            f.write(code)
        
        pylint_output = io.StringIO()
        reporter = TextReporter(pylint_output)
        try:
            # disable some overly strict rules for beginners
            Run([temp_file, "--disable=C0114,C0116,C0103", "--output-format=text"], reporter=reporter, exit=False)
        except Exception:
            pass
        
        output = pylint_output.getvalue()
        
        import os
        if os.path.exists(temp_file):
            os.remove(temp_file)
            
        issues = []
        for line in output.split('\n'):
            if line and not line.startswith('----') and not line.startswith('Your code'):
                issues.append(line)
        
        return issues[:5] # Limit to top 5 issues to not overwhelm beginner
