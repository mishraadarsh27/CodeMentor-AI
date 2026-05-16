/**
 * CodeMentor Cloud IDE Core Engine
 */

let editor;
let currentProject = null;
let activeFile = null;
let openFiles = [];
let fileTreeData = [];

// Initialize IDE
document.addEventListener('DOMContentLoaded', async () => {
    initMonaco();
    initActivityBar();
    initEventListeners();
    loadProject(); // Load default or saved project
});

// --- Monaco Editor Initialization ---
function initMonaco() {
    require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.43.0/min/vs' } });
    require(['vs/editor/editor.main'], function () {
        editor = monaco.editor.create(document.getElementById('editorContainer'), {
            value: '# Welcome to CodeMentor AI IDE\n\ndef hello():\n    print("Hello, AI Mentor!")\n\nhello()',
            language: 'python',
            theme: 'vs-dark',
            automaticLayout: true,
            fontFamily: "'Fira Code', monospace",
            fontSize: 13,
            lineHeight: 20,
            minimap: { enabled: false },
            scrollbar: {
                vertical: 'hidden',
                horizontal: 'auto'
            },
            padding: { top: 10 },
            roundedSelection: true,
            cursorSmoothCaretAnimation: "on",
            smoothScrolling: true
        });

        // Add change listener for autosave or unsaved indicator
        editor.onDidChangeModelContent(() => {
            if (activeFile) {
                // Potential autosave logic here
            }
        });
    });
}

// --- Activity Bar Logic ---
function initActivityBar() {
    const btns = document.querySelectorAll('.activity-btn');
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const tab = btn.dataset.tab;
            showSidebarView(tab);
        });
    });
}

function showSidebarView(view) {
    const explorer = document.getElementById('explorerView');
    const mentor = document.getElementById('mentorView');
    
    explorer.classList.add('hidden');
    mentor.classList.add('hidden');
    
    if (view === 'explorer') explorer.classList.remove('hidden');
    if (view === 'mentor') mentor.classList.remove('hidden');
}

// --- Project & File Management ---
async function loadProject() {
    try {
        const projects = await api.getProjects();
        if (projects.length > 0) {
            currentProject = projects[0];
            renderFileTree(currentProject.files);
            document.getElementById('currentProjectName').innerText = currentProject.name;
        } else {
            showModal('newProjectModal');
        }
    } catch (e) {
        showToast('Error loading projects', 'error');
    }
}

function renderFileTree(files) {
    const tree = document.getElementById('fileTree');
    tree.innerHTML = '';
    
    if (files.length === 0) {
        tree.innerHTML = '<div class="text-[10px] text-gray-600 p-4 text-center">Empty Project</div>';
        return;
    }

    files.forEach(file => {
        const item = document.createElement('div');
        item.className = `file-item ${activeFile && activeFile.id === file.id ? 'active' : ''}`;
        item.innerHTML = `
            <i class="${getIconForLanguage(file.language)}"></i>
            <span>${file.name}</span>
        `;
        item.onclick = () => openFile(file);
        tree.appendChild(item);
    });
}

function openFile(file) {
    activeFile = file;
    if (editor) {
        editor.setValue(file.content);
        monaco.editor.setModelLanguage(editor.getModel(), file.language);
    }
    renderFileTree(currentProject.files);
    updateTabs(file);
}

function updateTabs(file) {
    const container = document.getElementById('editorTabs');
    container.innerHTML = `
        <div class="tab active flex items-center gap-2 px-4 h-full border-r border-white/5 cursor-pointer relative group">
            <i class="${getIconForLanguage(file.language)}"></i>
            <span class="text-xs">${file.name}</span>
            <div class="absolute bottom-0 left-0 w-full h-[2px] bg-blue-500"></div>
        </div>
    `;
}

// --- Execution & Analysis ---
async function runCode() {
    if (!editor) return;
    
    const code = editor.getValue();
    const language = activeFile ? activeFile.language : 'python';
    
    appendToTerminal(`\n> Running ${language} code...\n`, 'info');
    
    try {
        const result = await api.executeCode(code, language);
        if (result.stdout) appendToTerminal(result.stdout);
        if (result.stderr) appendToTerminal(result.stderr, 'error');
        if (result.exit_code !== 0) appendToTerminal(`\nProcess exited with code ${result.exit_code}`, 'error');
    } catch (e) {
        appendToTerminal(`Execution failed: ${e.message}`, 'error');
    }
}

async function analyzeCode() {
    const code = editor.getValue();
    const language = activeFile ? activeFile.language : 'python';
    
    document.getElementById('analysisPanel').classList.remove('hidden');
    document.getElementById('analysisContent').innerHTML = '<div class="flex flex-col items-center py-20 text-blue-500 animate-pulse"><i class="fas fa-brain text-4xl mb-4"></i><span class="text-xs uppercase tracking-widest font-bold">AI Analyzing...</span></div>';
    
    try {
        const result = await api.analyzeCode(code, language);
        renderAnalysis(result);
    } catch (e) {
        showToast('Analysis failed', 'error');
    }
}

function renderAnalysis(data) {
    const content = document.getElementById('analysisContent');
    content.innerHTML = `
        <div class="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
            <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Quality Score</span>
                <span class="text-xl font-bold text-white">${data.score}/100</span>
            </div>
            <div class="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                <div class="bg-blue-500 h-full" style="width: ${data.score}%"></div>
            </div>
        </div>

        <div>
            <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Mentor's Insight</span>
            <p class="text-sm text-gray-300 leading-relaxed">${data.explanation}</p>
        </div>

        <div>
            <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Complexity</span>
            <div class="grid grid-cols-2 gap-2">
                <div class="bg-white/5 p-2 rounded border border-white/5">
                    <span class="text-[9px] text-gray-500 uppercase block">Time</span>
                    <span class="text-xs font-bold text-green-400">${data.complexity.time}</span>
                </div>
                <div class="bg-white/5 p-2 rounded border border-white/5">
                    <span class="text-[9px] text-gray-500 uppercase block">Space</span>
                    <span class="text-xs font-bold text-green-400">${data.complexity.space}</span>
                </div>
            </div>
        </div>

        <div>
            <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Roadmap</span>
            <div class="space-y-2">
                ${data.learning_recommendations.map(rec => `
                    <div class="flex items-start gap-2 text-xs text-gray-400">
                        <i class="fas fa-check-circle text-blue-500 mt-0.5"></i>
                        <span>${rec}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// --- Utils ---
function appendToTerminal(text, type = '') {
    const term = document.getElementById('terminalOutput');
    const line = document.createElement('div');
    line.className = `terminal-line ${type === 'error' ? 'terminal-error' : (type === 'info' ? 'terminal-info' : '')}`;
    line.innerText = text;
    term.appendChild(line);
    term.scrollTop = term.scrollHeight;
}

function getIconForLanguage(lang) {
    const icons = {
        'python': 'fab fa-python text-blue-400',
        'javascript': 'fab fa-js text-yellow-400',
        'java': 'fab fa-java text-red-400',
        'cpp': 'fas fa-c text-indigo-400',
        'c': 'fas fa-c text-blue-500',
        'go': 'fab fa-golang text-cyan-400',
        'html': 'fab fa-html5 text-orange-400'
    };
    return icons[lang] || 'far fa-file-code text-gray-400';
}

function initEventListeners() {
    document.getElementById('runBtn').onclick = runCode;
    document.getElementById('analyzeBtn').onclick = analyzeCode;
    
    document.getElementById('confirmNewProject').onclick = async () => {
        const name = document.getElementById('projectNameInput').value;
        const desc = document.getElementById('projectDescInput').value;
        if (!name) return;
        
        try {
            const project = await api.createProject(name, desc);
            currentProject = project;
            hideModal('newProjectModal');
            document.getElementById('currentProjectName').innerText = project.name;
            renderFileTree(project.files);
        } catch (e) {
            showToast('Failed to create project', 'error');
        }
    };
}

function toggleAnalysisPanel() {
    document.getElementById('analysisPanel').classList.toggle('hidden');
}

function clearTerminal() {
    document.getElementById('terminalOutput').innerHTML = '';
}

function showModal(id) { document.getElementById(id).classList.remove('hidden'); }
function hideModal(id) { document.getElementById(id).classList.add('hidden'); }
function showToast(msg, type) { console.log(`[${type}] ${msg}`); } // Replace with actual toast system
