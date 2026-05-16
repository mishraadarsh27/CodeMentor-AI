// Theme toggle (if still needed, though dark is default now)
const html = document.documentElement;
const themeToggleBtn = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
if(themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        html.classList.toggle('dark');
        if (html.classList.contains('dark')) {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        } else {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
    });
}

// Panel Tabs
const tabs = document.querySelectorAll('.panel-tab');
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Reset all
        tabs.forEach(t => {
            t.classList.remove('border-blue-500', 'text-blue-400');
            t.classList.add('border-transparent', 'text-gray-500');
            const target = document.getElementById(t.dataset.target);
            if(target) {
                target.classList.add('hidden');
                target.classList.remove('flex');
            }
        });
        
        // Activate current
        tab.classList.remove('border-transparent', 'text-gray-500');
        tab.classList.add('border-blue-500', 'text-blue-400');
        const target = document.getElementById(tab.dataset.target);
        if(target) {
            target.classList.remove('hidden');
            target.classList.add('flex');
        }
    });
});

// AI Status Management
const aiStatusDot = document.getElementById('aiStatusDot');
const aiStatusText = document.getElementById('aiStatusText');

function setAIStatus(status) {
    const statuses = {
        'online': { color: 'bg-green-500', text: 'AI Online', glow: 'pulse-glow-online' },
        'processing': { color: 'bg-blue-500', text: 'Analyzing...', glow: 'pulse-glow-processing' },
        'error': { color: 'bg-red-500', text: 'AI Error', glow: 'pulse-glow-error' },
        'retry': { color: 'bg-yellow-500', text: 'Retrying...', glow: 'pulse-glow-retry' }
    };
    
    const config = statuses[status] || statuses['online'];
    aiStatusDot.className = `w-2 h-2 rounded-full animate-pulse-glow ${config.color} ${config.glow}`;
    aiStatusText.textContent = config.text;
}

// Rotating Tips
const tips = [
    "Refactoring reduces technical debt and improves maintainability.",
    "Variable names should reveal intent, not implementation.",
    "Functions should do one thing and do it well.",
    "Don't repeat yourself (DRY) to avoid logic duplication.",
    "Write code for humans first, computers second.",
    "Small commits are easier to review and debug.",
    "AI analysis is most effective with clear, scoped code snippets."
];

let tipInterval;
function startTips() {
    const tipEl = document.getElementById('loaderTip');
    const statusEl = document.getElementById('loaderStatus');
    const statuses = ["Architecting Analysis...", "Decoding Logic...", "Checking Complexity...", "Optimizing Flow..."];
    
    let i = 0;
    tipInterval = setInterval(() => {
        tipEl.textContent = `"${tips[Math.floor(Math.random() * tips.length)]}"`;
        statusEl.textContent = statuses[i % statuses.length];
        i++;
    }, 2500);
}

function stopTips() {
    clearInterval(tipInterval);
}

// Toast System
function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'error' ? 'fa-circle-xmark' : (type === 'success' ? 'fa-circle-check' : 'fa-circle-info');
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Analysis UI State
const analysisSkeleton = document.getElementById('analysisSkeleton');

function showAnalysisLoading() {
    loader.classList.remove('hidden');
    analysisSkeleton.classList.remove('hidden');
    analysisSkeleton.classList.add('flex');
    analysisEmpty.classList.add('hidden');
    analysisResults.classList.add('hidden');
    analysisResults.classList.remove('flex');
    setAIStatus('processing');
    startTips();
}

function hideAnalysisLoading(success = true) {
    loader.classList.add('hidden');
    analysisSkeleton.classList.add('hidden');
    analysisSkeleton.classList.remove('flex');
    stopTips();
    if (success) {
        analysisResults.classList.remove('hidden');
        analysisResults.classList.add('flex');
        setAIStatus('online');
    } else {
        analysisEmpty.classList.remove('hidden');
        setAIStatus('error');
    }
}

// Analysis logic
const analyzeBtn = document.getElementById('analyzeBtn');
const loader = document.getElementById('editorLoader');
const analysisEmpty = document.getElementById('analysisEmpty');
const analysisResults = document.getElementById('analysisResults');

let currentCorrectedCode = '';

if(analyzeBtn) {
    analyzeBtn.addEventListener('click', async () => {
        const code = window.getEditorCode();
        const language = document.getElementById('languageSelect').value;
        
        if (!code.trim()) {
            showToast("Please enter some code first.", "info");
            return;
        }

        // Add loading state to button
        const originalBtnHTML = analyzeBtn.innerHTML;
        analyzeBtn.innerHTML = '<i class="fa-solid fa-circle-notch animate-spin"></i> ANALYZING...';
        analyzeBtn.disabled = true;

        showAnalysisLoading();
        
        // Switch to analysis tab
        if(tabs.length > 0) tabs[0].click();
        
        try {
            const result = await window.api.analyzeCode(code, language);
            
            // Populate results
            // Animate score counter
            const scoreEl = document.getElementById('scoreValue');
            let currentScore = 0;
            const targetScore = result.score || 0;
            const scoreInterval = setInterval(() => {
                if(currentScore >= targetScore) {
                    clearInterval(scoreInterval);
                    scoreEl.textContent = targetScore;
                } else {
                    currentScore += 1;
                    scoreEl.textContent = currentScore;
                }
            }, 10);

            document.getElementById('scoreCircle').style.strokeDasharray = `${targetScore}, 100`;
            
            // Colors based on score
            const scoreCircle = document.getElementById('scoreCircle');
            if (targetScore >= 80) scoreCircle.className = "text-green-500 transition-all duration-1500 ease-out drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]";
            else if (targetScore >= 60) scoreCircle.className = "text-yellow-500 transition-all duration-1500 ease-out drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]";
            else scoreCircle.className = "text-red-500 transition-all duration-1500 ease-out drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]";
            
            document.getElementById('mentorExplanation').textContent = result.explanation;
            
            // Issues
            const issuesContainer = document.getElementById('issuesContainer');
            const issuesList = document.getElementById('issuesList');
            issuesList.innerHTML = '';
            
            const allIssues = [...(result.syntax_errors || []), ...(result.linting_issues || [])];
            if (allIssues.length > 0) {
                issuesContainer.classList.remove('hidden');
                allIssues.forEach((issue, idx) => {
                    const li = document.createElement('li');
                    li.className = "text-gray-300 bg-red-500/10 p-3 rounded-lg border border-red-500/20 flex gap-3 fade-in";
                    li.style.animationDelay = `${idx * 100}ms`;
                    li.innerHTML = `<i class="fa-solid fa-circle-exclamation text-red-400 mt-0.5"></i> <span>${issue}</span>`;
                    issuesList.appendChild(li);
                });
            } else {
                issuesContainer.classList.add('hidden');
            }

            // Complexity
            document.getElementById('timeComplexity').textContent = result.complexity?.time || "Unknown";
            document.getElementById('spaceComplexity').textContent = result.complexity?.space || "Unknown";

            // Tags
            const tagsContainer = document.getElementById('learningTags');
            tagsContainer.innerHTML = '';
            (result.learning_recommendations || []).forEach((tag, idx) => {
                const span = document.createElement('span');
                span.className = "px-3 py-1.5 bg-green-500/10 text-green-400 text-[10px] font-bold uppercase tracking-wider rounded-md border border-green-500/20 fade-in";
                span.style.animationDelay = `${idx * 100}ms`;
                span.textContent = tag;
                tagsContainer.appendChild(span);
            });

            currentCorrectedCode = result.corrected_code || code;
            
            hideAnalysisLoading(true);
            if (targetScore === 0) {
                showToast("AI returned a fallback response. Basic analysis complete.", "info");
            } else {
                showToast("Code analysis completed successfully!", "success");
            }
            
        } catch (e) {
            console.error(e);
            hideAnalysisLoading(false);
            showToast("Connection failure. AI mentor is temporarily offline.", "error");
        } finally {
            analyzeBtn.innerHTML = originalBtnHTML;
            analyzeBtn.disabled = false;
        }
    });
}

// Modal Logic
const viewCorrectedBtn = document.getElementById('viewCorrectedBtn');
const codeModal = document.getElementById('codeModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const applyCodeBtn = document.getElementById('applyCodeBtn');

if(viewCorrectedBtn) {
    viewCorrectedBtn.addEventListener('click', () => {
        codeModal.classList.remove('hidden');
        setTimeout(() => {
            codeModal.classList.remove('opacity-0');
            codeModal.querySelector('div').classList.remove('scale-95');
        }, 10);
        
        window.showDiff(window.getEditorCode(), currentCorrectedCode, document.getElementById('languageSelect').value);
    });
}

function closeModal() {
    if(!codeModal) return;
    codeModal.classList.add('opacity-0');
    codeModal.querySelector('div').classList.add('scale-95');
    setTimeout(() => {
        codeModal.classList.add('hidden');
    }, 300);
}

if(closeModalBtn) closeModalBtn.addEventListener('click', closeModal);

if(codeModal) {
    codeModal.addEventListener('click', (e) => {
        if (e.target === codeModal) closeModal();
    });
}

if(applyCodeBtn) {
    applyCodeBtn.addEventListener('click', () => {
        window.setEditorCode(currentCorrectedCode);
        closeModal();
    });
}
