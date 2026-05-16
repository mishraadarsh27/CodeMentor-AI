let editor;
let diffEditor;

// Default code snippet for beginners
const defaultCode = `def fibonacci(n):
    if n <= 0:
        return []
    elif n == 1:
        return [0]
    result = [0, 1]
    for i in range(2, n):
        result.append(result[i-1] + result[i-2])
    return result

# Print first 5 fibonacci numbers
print(fibonacci(5))
`;

function initEditor() {
    require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs' }});

    require(['vs/editor/editor.main'], function() {
        // Main Editor
        editor = monaco.editor.create(document.getElementById('editorContainer'), {
            value: defaultCode,
            language: 'python',
            theme: document.documentElement.classList.contains('dark') ? 'vs-dark' : 'vs',
            automaticLayout: true,
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'Fira Code', Consolas, monospace",
            fontLigatures: true,
            scrollBeyondLastLine: false,
            roundedSelection: false,
            padding: { top: 16 }
        });

        // Initialize empty Diff Editor but don't show it yet
        diffEditor = monaco.editor.createDiffEditor(document.getElementById('diffEditorContainer'), {
            theme: document.documentElement.classList.contains('dark') ? 'vs-dark' : 'vs',
            automaticLayout: true,
            renderSideBySide: true,
            fontSize: 14,
            fontFamily: "'Fira Code', Consolas, monospace"
        });
        
        // Listen to theme changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    const isDark = document.documentElement.classList.contains('dark');
                    monaco.editor.setTheme(isDark ? 'vs-dark' : 'vs');
                }
            });
        });
        observer.observe(document.documentElement, { attributes: true });
        
        // Language Select event
        document.getElementById('languageSelect').addEventListener('change', (e) => {
            monaco.editor.setModelLanguage(editor.getModel(), e.target.value);
        });
    });
}

window.getEditorCode = () => {
    return editor ? editor.getValue() : '';
};

window.setEditorCode = (code) => {
    if (editor) {
        editor.setValue(code);
    }
};

window.showDiff = (originalCode, modifiedCode, language) => {
    if(!diffEditor) return;
    const originalModel = monaco.editor.createModel(originalCode, language);
    const modifiedModel = monaco.editor.createModel(modifiedCode, language);
    diffEditor.setModel({
        original: originalModel,
        modified: modifiedModel
    });
};

// Initialize after DOM load
document.addEventListener('DOMContentLoaded', initEditor);
