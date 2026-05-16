/**
 * CodeMentor Cloud IDE Core Engine - v2.1
 */

let editor;
let currentProject = null;
let activeFile = null;
let openFiles = [];
let fileHandle = null; // Track local file handle

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
            scrollbar: { vertical: 'hidden', horizontal: 'auto' },
            padding: { top: 10 },
            roundedSelection: true,
            cursorSmoothCaretAnimation: "on",
            smoothScrolling: true
        });

        editor.onDidChangeModelContent(() => {
            if (activeFile) {
                // Future autosave logic
            }
        });
    });
}

// --- Activity Bar Logic ---
function initActivityBar() {
    const btns = document.querySelectorAll('.activity-btn');
    btns.forEach(btn => {
        btn.onclick = () => {
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            showSidebarView(btn.dataset.tab);
        };
    });
}

function showSidebarView(view) {
    const views = ['explorerView', 'mentorView']; // add more as needed
    views.forEach(v => {
        const el = document.getElementById(v);
        if (el) el.classList.add('hidden');
    });
    
    const target = document.getElementById(`${view}View`);
    if (target) target.classList.remove('hidden');
}

// --- Project & File Management ---
async function loadProject() {
    console.log("Fetching projects...");
    try {
        const projects = await api.getProjects();
        if (projects && projects.length > 0) {
            currentProject = projects[0];
            document.getElementById('currentProjectName').innerText = currentProject.name;
            renderFileTree(currentProject.files);
            if (currentProject.files.length > 0) {
                openFile(currentProject.files[0]);
            }
        } else {
            showModal('newProjectModal');
        }
    } catch (e) {
        console.error("LoadProject Error:", e);
        showToast('Error loading projects', 'error');
    }
}

function renderFileTree(files) {
    const tree = document.getElementById('fileTree');
    if (!tree) return;
    tree.innerHTML = '';
    
    if (!files || files.length === 0) {
        tree.innerHTML = '<div class="text-[10px] text-gray-600 p-4 text-center">Empty Project</div>';
        return;
    }

    files.forEach(file => {
        const item = document.createElement('div');
        item.className = `file-item group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-white/5 transition-all text-xs ${activeFile && activeFile.id === file.id ? 'bg-white/10 text-blue-400' : 'text-gray-400'}`;
        item.innerHTML = `
            <i class="${getIconForLanguage(file.language)}"></i>
            <span class="truncate flex-1">${file.name}</span>
        `;
        item.onclick = () => openFile(file);
        tree.appendChild(item);
    });
}

function openFile(file) {
    activeFile = file;
    fileHandle = null; // Reset local file handle when opening project files
    if (editor) {
        editor.setValue(file.content || '');
        monaco.editor.setModelLanguage(editor.getModel(), file.language);
        document.getElementById('languageSelect').value = file.language;
    }
    renderFileTree(currentProject.files);
    updateTabs(file);
}

function updateTabs(file) {
    const container = document.getElementById('editorTabs');
    if (!container) return;
    container.innerHTML = `
        <div class="tab active flex items-center gap-2 px-4 h-full border-r border-white/5 cursor-pointer relative group bg-[#111]">
            <i class="${getIconForLanguage(file.language)}"></i>
            <span class="text-xs font-medium">${file.name}</span>
            <div class="absolute bottom-0 left-0 w-full h-[2px] bg-blue-500"></div>
        </div>
    `;
}

// --- Local File System Access ---
async function openLocalFile() {
    try {
        [fileHandle] = await window.showOpenFilePicker({
            types: [{
                description: 'Code Files',
                accept: { 'text/*': ['.py', '.js', '.cpp', '.java', '.c', '.go', '.html', '.css'] }
            }]
        });
        const file = await fileHandle.getFile();
        const content = await file.text();
        
        if (editor) {
            editor.setValue(content);
            const ext = file.name.split('.').pop();
            const langMap = { 'py': 'python', 'js': 'javascript', 'cpp': 'cpp', 'java': 'java', 'c': 'c', 'go': 'go', 'html': 'html', 'css': 'css' };
            const lang = langMap[ext] || 'python';
            monaco.editor.setModelLanguage(editor.getModel(), lang);
            document.getElementById('languageSelect').value = lang;
            
            // Update UI
            activeFile = { name: file.name, language: lang, content: content, isLocal: true };
            updateTabs(activeFile);
            showToast(`Opened local file: ${file.name}`, 'success');
        }
    } catch (e) {
        if (e.name !== 'AbortError') {
            console.error("OpenLocal Error:", e);
            showToast('Failed to open local file', 'error');
        }
    }
}

async function saveLocalFile() {
    if (!editor) return;
    try {
        if (!fileHandle) {
            fileHandle = await window.showSaveFilePicker({
                suggestedName: activeFile ? activeFile.name : 'script.py',
                types: [{
                    description: 'Code Files',
                    accept: { 'text/*': ['.py', '.js', '.cpp', '.java', '.c', '.go', '.html', '.css'] }
                }]
            });
        }
        const writable = await fileHandle.createWritable();
        await writable.write(editor.getValue());
        await writable.close();
        showToast('File saved to local storage', 'success');
    } catch (e) {
        if (e.name !== 'AbortError') {
            console.error("SaveLocal Error:", e);
            showToast('Failed to save local file', 'error');
        }
    }
}

// --- Execution & Analysis ---
let executionWs = null;
let terminalInputHandler = null;
let currentInputLine = "";

async function runCode() {
    if (!editor) return;
    const code = editor.getValue();
    const language = document.getElementById('languageSelect').value || 'python';
    
    clearTerminal();
    appendToTerminal(`> Running ${language} code...\n`, 'info');
    
    if (executionWs) {
        executionWs.close();
    }
    
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/api/ws/execute`;
    
    executionWs = new WebSocket(wsUrl);
    
    executionWs.onopen = () => {
        executionWs.send(JSON.stringify({ code, language }));
        initTerminalInput();
    };
    
    executionWs.onmessage = (event) => {
        appendToTerminal(event.data, '', true);
    };
    
    executionWs.onclose = () => {
        appendToTerminal(`\n[Process finished]\n`, 'info', true);
        executionWs = null;
        removeTerminalInput();
    };
    
    executionWs.onerror = (error) => {
        appendToTerminal(`\nExecution failed: Connection Error\n`, 'error', true);
    };
}

function initTerminalInput() {
    const term = document.getElementById('terminalOutput');
    if (!term) return;
    
    term.focus();
    if (!terminalInputHandler) {
        terminalInputHandler = (e) => {
            if (!executionWs || executionWs.readyState !== WebSocket.OPEN) return;
            
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            
            if (e.key === 'Enter') {
                e.preventDefault();
                appendToTerminal('\n', '', true);
                executionWs.send(currentInputLine + '\n');
                currentInputLine = '';
            } else if (e.key === 'Backspace') {
                e.preventDefault();
                if (currentInputLine.length > 0) {
                    currentInputLine = currentInputLine.slice(0, -1);
                    removeLastTerminalChar();
                }
            } else if (e.key.length === 1) {
                e.preventDefault();
                currentInputLine += e.key;
                appendToTerminal(e.key, '', true);
            }
        };
        term.addEventListener('keydown', terminalInputHandler);
    }
}

function removeTerminalInput() {
    const term = document.getElementById('terminalOutput');
    if (term && terminalInputHandler) {
        term.removeEventListener('keydown', terminalInputHandler);
        terminalInputHandler = null;
    }
}

function removeLastTerminalChar() {
    const term = document.getElementById('terminalOutput');
    if (!term) return;
    let lastNode = term.lastElementChild;
    if (lastNode && lastNode.tagName === 'SPAN') {
        if (lastNode.innerText.length > 0) {
            lastNode.innerText = lastNode.innerText.slice(0, -1);
        }
    }
}

async function analyzeCode() {
    if (!editor) return;
    const code = editor.getValue();
    const language = document.getElementById('languageSelect').value || 'python';
    
    toggleAnalysisPanel(true);
    document.getElementById('analysisContent').innerHTML = `
        <div class="flex flex-col items-center py-20 text-blue-500 animate-pulse">
            <i class="fas fa-brain text-4xl mb-4"></i>
            <span class="text-[10px] uppercase tracking-widest font-bold">AI Analyzing...</span>
        </div>
    `;
    
    try {
        const result = await api.analyzeCode(code, language);
        renderAnalysis(result);
    } catch (e) {
        showToast('Analysis failed: ' + e.message, 'error');
    }
}

function renderAnalysis(data) {
    const content = document.getElementById('analysisContent');
    content.innerHTML = `
        <div class="space-y-6">
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
                        <div class="flex items-start gap-2 text-xs text-gray-400 bg-white/5 p-2 rounded">
                            <i class="fas fa-check-circle text-blue-500 mt-0.5"></i>
                            <span>${rec}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

// --- Event Listeners ---
function initEventListeners() {
    // Nav Buttons
    const runBtn = document.getElementById('runBtn');
    if (runBtn) runBtn.onclick = runCode;
    
    const analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn) analyzeBtn.onclick = analyzeCode;

    // Local File Buttons
    const openLocalBtn = document.getElementById('openLocalBtn');
    if (openLocalBtn) openLocalBtn.onclick = openLocalFile;

    const saveLocalBtn = document.getElementById('saveLocalBtn');
    if (saveLocalBtn) saveLocalBtn.onclick = saveLocalFile;

    // Language Selector
    const langSelect = document.getElementById('languageSelect');
    if (langSelect) {
        langSelect.onchange = () => {
            const lang = langSelect.value;
            if (editor) {
                monaco.editor.setModelLanguage(editor.getModel(), lang);
                showToast(`Language switched to ${lang}`, 'info');
            }
        };
    }

    // Modal Triggers
    const newFileBtn = document.getElementById('newFileBtn');
    if (newFileBtn) newFileBtn.onclick = () => showModal('newFileModal');

    const confirmNewProject = document.getElementById('confirmNewProject');
    if (confirmNewProject) {
        confirmNewProject.onclick = async () => {
            const name = document.getElementById('projectNameInput').value;
            const desc = document.getElementById('projectDescInput').value;
            if (!name) return showToast('Project name required', 'error');
            
            try {
                const project = await api.createProject(name, desc);
                currentProject = project;
                document.getElementById('currentProjectName').innerText = project.name;
                hideModal('newProjectModal');
                renderFileTree(project.files);
                showToast('Project created successfully', 'success');
            } catch (e) {
                showToast('Failed to create project', 'error');
            }
        };
    }

    const confirmNewFile = document.getElementById('confirmNewFile');
    if (confirmNewFile) {
        confirmNewFile.onclick = async () => {
            const name = document.getElementById('fileNameInput').value;
            const lang = document.getElementById('fileLanguageInput').value;
            if (!name) return showToast('File name required', 'error');
            if (!currentProject) return showToast('No active project', 'error');

            try {
                const file = await api.createFile(currentProject.id, name, lang);
                currentProject.files.push(file);
                renderFileTree(currentProject.files);
                openFile(file);
                hideModal('newFileModal');
                showToast(`File ${name} created`, 'success');
            } catch (e) {
                showToast('Failed to create file', 'error');
            }
        };
    }
}

// --- UI Utilities ---
function appendToTerminal(text, type = '', inline = false) {
    const term = document.getElementById('terminalOutput');
    if (!term) return;
    
    if (!inline) {
        const line = document.createElement('div');
        line.className = `py-0.5 ${type === 'error' ? 'text-red-400' : (type === 'info' ? 'text-blue-400' : 'text-gray-300')}`;
        line.innerText = text;
        term.appendChild(line);
    } else {
        let lastNode = term.lastElementChild;
        if (!lastNode || lastNode.tagName !== 'SPAN' || type !== '') {
            lastNode = document.createElement('span');
            lastNode.className = type === 'error' ? 'text-red-400' : (type === 'info' ? 'text-blue-400' : 'text-gray-300');
            term.appendChild(lastNode);
        }
        lastNode.innerText += text;
    }
    term.scrollTop = term.scrollHeight;
}

function clearTerminal() {
    const term = document.getElementById('terminalOutput');
    if (term) term.innerHTML = '';
}

function showModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
}

function hideModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
}

function toggleAnalysisPanel(show) {
    const panel = document.getElementById('analysisPanel');
    if (panel) {
        if (show === undefined) panel.classList.toggle('hidden');
        else show ? panel.classList.remove('hidden') : panel.classList.add('hidden');
    }
}

function showToast(msg, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    const colors = {
        success: 'bg-green-500/20 border-green-500/50 text-green-400',
        error: 'bg-red-500/20 border-red-500/50 text-red-400',
        info: 'bg-blue-500/20 border-blue-500/50 text-blue-400'
    };

    toast.className = `px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl flex items-center gap-3 animate-slide-up ${colors[type]}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : (type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info')}"></i>
        <span class="text-xs font-bold">${msg}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
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
