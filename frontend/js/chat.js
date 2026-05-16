// Chat functionality
const chatMessages = document.getElementById('mentorChat');
const chatInput = document.getElementById('mentorInput');
const sendChatBtn = document.getElementById('sendChatBtn');

function addMessage(content, isUser = false) {
    if (!chatMessages) return;
    
    const msgDiv = document.createElement('div');
    msgDiv.className = 'flex gap-3 fade-in mb-4';
    
    if (isUser) {
        msgDiv.innerHTML = `
            <div class="flex-1"></div>
            <div class="bg-blue-600 text-white p-3 rounded-2xl rounded-tr-none text-xs max-w-[85%] shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                ${content}
            </div>
        `;
    } else {
        const parsedContent = typeof marked !== 'undefined' ? marked.parse(content) : content;
        msgDiv.innerHTML = `
            <div class="w-7 h-7 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-blue-400 shrink-0 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                <i class="fa-solid fa-robot text-[10px]"></i>
            </div>
            <div class="bg-white/5 p-3 rounded-2xl rounded-tl-none text-xs max-w-[85%] text-gray-300 border border-white/5 markdown-body">
                ${parsedContent}
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
    msgDiv.className = 'flex gap-3 fade-in mb-4';
    msgDiv.innerHTML = `
        <div class="w-7 h-7 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-blue-400 shrink-0">
            <i class="fa-solid fa-robot text-[10px]"></i>
        </div>
        <div class="bg-white/5 p-3 rounded-2xl rounded-tl-none flex items-center gap-1.5 h-8 px-4 border border-white/5">
            <div class="w-1 h-1 rounded-full bg-blue-400 animate-bounce"></div>
            <div class="w-1 h-1 rounded-full bg-blue-400 animate-bounce [animation-delay:0.2s]"></div>
            <div class="w-1 h-1 rounded-full bg-blue-400 animate-bounce [animation-delay:0.4s]"></div>
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
    chatInput.style.height = 'auto';
    addMessage(text, true);
    
    const typingId = addTypingIndicator();
    
    try {
        const contextCode = typeof editor !== 'undefined' ? editor.getValue() : null;
        const res = await window.api.chat(text, contextCode);
        removeTypingIndicator(typingId);
        addMessage(res.response, false);
    } catch (e) {
        removeTypingIndicator(typingId);
        addMessage("⚠️ AI Mentor is currently resting. Please try again later.", false);
    }
}

if(sendChatBtn) sendChatBtn.onclick = handleSend;

if(chatInput) {
    chatInput.onkeydown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    chatInput.oninput = function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    };
}
