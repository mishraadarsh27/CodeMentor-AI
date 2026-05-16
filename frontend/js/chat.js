// Chat functionality
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChatBtn');

function addMessage(content, isUser = false) {
    if (!chatMessages) return;
    
    const msgDiv = document.createElement('div');
    msgDiv.className = 'flex gap-3 fade-in';
    
    if (isUser) {
        msgDiv.innerHTML = `
            <div class="flex-1"></div>
            <div class="bg-blue-600 text-white p-3 rounded-2xl rounded-tr-none text-sm max-w-[85%] shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                ${content}
            </div>
        `;
    } else {
        msgDiv.innerHTML = `
            <div class="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-blue-400 shrink-0 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                <i class="fa-solid fa-robot text-xs"></i>
            </div>
            <div class="glass-panel p-3 rounded-2xl rounded-tl-none text-sm max-w-[85%] text-gray-300 border-blue-500/20 markdown-body">
                ${marked.parse(content)}
            </div>
        `;
    }
    
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addTypingIndicator() {
    if (!chatMessages) return null;
    
    const indicatorId = 'typing-' + Date.now();
    const msgDiv = document.createElement('div');
    msgDiv.id = indicatorId;
    msgDiv.className = 'flex gap-3 fade-in';
    msgDiv.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-blue-400 shrink-0">
            <i class="fa-solid fa-robot text-xs"></i>
        </div>
        <div class="glass-panel p-3 rounded-2xl rounded-tl-none flex items-center gap-1.5 h-10 px-4 border-blue-500/20">
            <div class="w-1.5 h-1.5 rounded-full bg-blue-400 typing-dot"></div>
            <div class="w-1.5 h-1.5 rounded-full bg-blue-400 typing-dot"></div>
            <div class="w-1.5 h-1.5 rounded-full bg-blue-400 typing-dot"></div>
        </div>
    `;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return indicatorId;
}

function removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

async function handleSend() {
    if(!chatInput) return;
    const text = chatInput.value.trim();
    if (!text) return;
    
    chatInput.value = '';
    chatInput.style.height = 'auto'; // reset height
    addMessage(text, true);
    
    const typingId = addTypingIndicator();
    
    try {
        const contextCode = window.getEditorCode ? window.getEditorCode() : null;
        const res = await window.api.chat(text, contextCode);
        removeTypingIndicator(typingId);
        addMessage(res.response, false);
    } catch (e) {
        removeTypingIndicator(typingId);
        addMessage("⚠️ System offline. Connection to AI Core failed.", false);
    }
}

if(sendChatBtn) sendChatBtn.addEventListener('click', handleSend);

if(chatInput) {
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    // Auto-resize textarea
    chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        if(this.scrollHeight > 120) {
            this.style.overflowY = 'auto';
        } else {
            this.style.overflowY = 'hidden';
        }
    });
}
