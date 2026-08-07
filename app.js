/**
 * CompassionGPT - Client-Side Socratic Engine
 * ⚡ Handles UI interactions, chat, surveys, and moral circle visualization
 */

// ========== STATE ==========
const state = {
    sessionId: generateSessionId(),
    preScore: null,
    postScore: null,
    messageCount: 0,
    messages: [],
    preAnswers: {},
    postAnswers: {},
    chatHistory: []
};

// ========== SURVEY QUESTIONS ==========
const SURVEY_QUESTIONS = [
    { id: 'q1', text: 'I feel genuine concern for people in distant countries facing hardship.', category: 'distant_humans' },
    { id: 'q2', text: 'I believe animals can experience suffering similar to humans.', category: 'animal_welfare' },
    { id: 'q3', text: 'I actively consider the impact of my choices on future generations.', category: 'future_generations' },
    { id: 'q4', text: 'I feel a sense of responsibility toward the natural environment.', category: 'environment' },
    { id: 'q5', text: 'I can empathize with people whose views differ greatly from mine.', category: 'outgroup_empathy' },
    { id: 'q6', text: 'I would make personal sacrifices to reduce suffering of beings I\'ll never meet.', category: 'altruism' },
    { id: 'q7', text: 'I believe my compassion should extend to all sentient beings equally.', category: 'universal_compassion' },
    { id: 'q8', text: 'I practice self-compassion and treat myself with kindness during difficult times.', category: 'self_compassion' }
];

const SCALE_OPTIONS = [
    { value: 1, label: 'Strongly Disagree' },
    { value: 2, label: 'Disagree' },
    { value: 3, label: 'Neutral' },
    { value: 4, label: 'Agree' },
    { value: 5, label: 'Strongly Agree' }
];

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    initSession();
    initNavigation();
    initSurveys();
    initChat();
    addWelcomeMessage();
});

function generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function initSession() {
    document.getElementById('sessionDisplay').textContent = `Session: ${state.sessionId.slice(-7)}`;
}

// ========== NAVIGATION ==========
function initNavigation() {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            if (!tab.disabled) {
                switchTab(tab.dataset.tab);
            }
        });
    });
}

function switchTab(tabId) {
    // Update tab buttons
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabId);
    });
    
    // Update panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `panel-${tabId}`);
    });
    
    // Scroll to top
    window.scrollTo(0, 0);
}

function unlockTab(tabId) {
    const tab = document.querySelector(`.nav-tab[data-tab="${tabId}"]`);
    if (tab) {
        tab.disabled = false;
        const lock = tab.querySelector('.lock');
        if (lock) lock.style.display = 'none';
    }
}

// Make switchTab globally accessible
window.switchTab = switchTab;

// ========== SURVEYS ==========
function initSurveys() {
    renderSurvey('pre', document.getElementById('preQuestions'));
    renderSurvey('post', document.getElementById('postQuestions'));
    
    document.getElementById('preSubmit').addEventListener('click', () => submitSurvey('pre'));
    document.getElementById('postSubmit').addEventListener('click', () => submitSurvey('post'));
}

function renderSurvey(type, container) {
    container.innerHTML = SURVEY_QUESTIONS.map((q, idx) => `
        <div class="question-card" style="animation-delay: ${idx * 0.05}s">
            <p class="question-text">
                <span class="question-number">${idx + 1}.</span>
                ${q.text}
            </p>
            <div class="question-options">
                ${SCALE_OPTIONS.map(opt => `
                    <button class="option-btn opt-${opt.value}" 
                            data-question="${q.id}" 
                            data-value="${opt.value}"
                            data-type="${type}">
                        ${opt.label}
                    </button>
                `).join('')}
            </div>
        </div>
    `).join('');
    
    // Add click handlers
    container.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', () => handleOptionClick(btn, type));
    });
}

function handleOptionClick(btn, type) {
    const questionId = btn.dataset.question;
    const value = parseInt(btn.dataset.value);
    const answers = type === 'pre' ? state.preAnswers : state.postAnswers;
    
    // Update state
    answers[questionId] = value;
    
    // Update UI - remove selected from siblings
    const questionOptions = btn.parentElement.querySelectorAll('.option-btn');
    questionOptions.forEach(opt => opt.classList.remove('selected'));
    btn.classList.add('selected');
    
    // Update progress
    updateSurveyProgress(type);
}

function updateSurveyProgress(type) {
    const answers = type === 'pre' ? state.preAnswers : state.postAnswers;
    const count = Object.keys(answers).length;
    const total = SURVEY_QUESTIONS.length;
    
    document.getElementById(`${type}Progress`).textContent = `${count} / ${total} answered`;
    
    const submitBtn = document.getElementById(`${type}Submit`);
    if (count === total) {
        const score = calculateScore(answers);
        submitBtn.disabled = false;
        submitBtn.textContent = `Submit ${type === 'pre' ? 'Pre' : 'Post'}-Survey (Score: ${score}%)`;
    } else {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Answer all questions to continue';
    }
}

function calculateScore(answers) {
    const total = Object.values(answers).reduce((sum, v) => sum + v, 0);
    const max = SURVEY_QUESTIONS.length * 5;
    return Math.round((total / max) * 100);
}

async function submitSurvey(type) {
    const answers = type === 'pre' ? state.preAnswers : state.postAnswers;
    const submitBtn = document.getElementById(`${type}Submit`);
    const score = calculateScore(answers);
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';
    
    try {
        const responses = SURVEY_QUESTIONS.map(q => ({
            questionId: q.id,
            questionText: q.text,
            answerValue: answers[q.id],
            answerLabel: SCALE_OPTIONS.find(o => o.value === answers[q.id])?.label || '',
            category: q.category
        }));
        
        await fetch('/api/survey', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: state.sessionId,
                responses,
                surveyType: type
            })
        });
        
        // Update state
        if (type === 'pre') {
            state.preScore = score;
            unlockTab('chat');
            
            // Show completion
            document.getElementById('preQuestions').style.display = 'none';
            document.getElementById('preSubmit').style.display = 'none';
            document.getElementById('preComplete').style.display = 'block';
            document.getElementById('preScoreDisplay').textContent = `${score}%`;
            
            // Update header
            document.getElementById('scoreBadge').style.display = 'flex';
            document.getElementById('currentScore').textContent = `${score}%`;
        } else {
            state.postScore = score;
            
            // Show completion
            document.getElementById('postQuestions').style.display = 'none';
            document.getElementById('postSubmit').style.display = 'none';
            document.getElementById('postComplete').style.display = 'block';
            document.getElementById('postScoreDisplay').textContent = `${score}%`;
            
            // Update header
            document.getElementById('currentScore').textContent = `${score}%`;
        }
        
        // Update results
        updateResults();
        
    } catch (error) {
        console.error('Survey submission error:', error);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Error - Try Again';
    }
}

// ========== CHAT ==========
function initChat() {
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    
    input.addEventListener('input', () => {
        sendBtn.disabled = !input.value.trim();
        // Auto-resize
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    });
    
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (input.value.trim()) sendMessage();
        }
    });
    
    sendBtn.addEventListener('click', sendMessage);
    
    // Starter prompts
    document.querySelectorAll('.starter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            sendMessage(btn.textContent);
        });
    });
}

function addWelcomeMessage() {
    const welcome = {
        role: 'assistant',
        content: `Welcome to CompassionGPT! 🌱💚

I'm your Socratic companion for exploring compassion and expanding your moral circle — the boundary of beings whose well-being you genuinely care about.

There are no wrong answers here, only an invitation to reflect more deeply. What draws you to explore compassion today? Or pick one of the prompts below to begin our journey together. 🤗`,
        timestamp: new Date()
    };
    
    state.messages.push(welcome);
    renderMessage(welcome);
}

function renderMessage(msg) {
    const container = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = `message ${msg.role}`;
    
    const time = msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (msg.role === 'assistant') {
        div.innerHTML = `
            <div class="message-header">
                <span>🌱</span>
                <span>CompassionGPT</span>
            </div>
            <div class="message-content">${formatContent(msg.content)}</div>
            <div class="message-time">${time}</div>
        `;
    } else {
        div.innerHTML = `
            <div class="message-content">${escapeHtml(msg.content)}</div>
            <div class="message-time">${time}</div>
        `;
    }
    
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function formatContent(content) {
    // Escape HTML first
    let formatted = escapeHtml(content);
    // Then apply bold formatting
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return formatted;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showTypingIndicator() {
    const container = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = 'message assistant';
    div.id = 'typingIndicator';
    div.innerHTML = `
        <div class="message-header">
            <span>🌱</span>
            <span>CompassionGPT</span>
        </div>
        <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
}

async function sendMessage(customText) {
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const text = customText || input.value.trim();
    
    if (!text) return;
    
    // Clear input
    input.value = '';
    input.style.height = 'auto';
    sendBtn.disabled = true;
    
    // Hide starter prompts after first user message
    if (state.messageCount === 0) {
        document.getElementById('starterPrompts').style.display = 'none';
    }
    
    // Add user message
    const userMsg = { role: 'user', content: text, timestamp: new Date() };
    state.messages.push(userMsg);
    state.chatHistory.push({ role: 'user', content: text });
    renderMessage(userMsg);
    
    state.messageCount++;
    updateMessageBadge();
    checkPostSurveyUnlock();
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: text,
                history: state.chatHistory.slice(-20)
            })
        });
        
        const data = await response.json();
        
        hideTypingIndicator();
        
        const assistantMsg = {
            role: 'assistant',
            content: data.reply || "I need a moment to reflect. Could you try again? 🙏",
            timestamp: new Date()
        };
        
        state.messages.push(assistantMsg);
        state.chatHistory.push({ role: 'assistant', content: assistantMsg.content });
        renderMessage(assistantMsg);
        
        state.messageCount++;
        updateMessageBadge();
        checkPostSurveyUnlock();
        
    } catch (error) {
        console.error('Chat error:', error);
        hideTypingIndicator();
        
        const errorMsg = {
            role: 'assistant',
            content: "I'm having trouble connecting right now. Please check that the GROQ_API_KEY is configured and try again. 🔧",
            timestamp: new Date()
        };
        state.messages.push(errorMsg);
        renderMessage(errorMsg);
    }
    
    updateResults();
}

function updateMessageBadge() {
    const badge = document.getElementById('messageBadge');
    badge.style.display = state.messageCount > 0 ? 'inline' : 'none';
    badge.textContent = state.messageCount;
    document.getElementById('statMessages').textContent = state.messageCount;
}

function checkPostSurveyUnlock() {
    if (state.preScore !== null && state.messageCount >= 4) {
        unlockTab('survey-post');
        document.getElementById('postLocked').style.display = 'none';
        document.getElementById('postSurveyContent').style.display = 'block';
    }
}

// ========== RESULTS ==========
function updateResults() {
    // Pre circle
    if (state.preScore !== null) {
        document.getElementById('preCircle').innerHTML = renderMoralCircle(state.preScore, 140);
        document.getElementById('statPre').textContent = `${state.preScore}%`;
    }
    
    // Post circle
    if (state.postScore !== null) {
        document.getElementById('postCircle').innerHTML = renderMoralCircle(state.postScore, 140);
        document.getElementById('statPost').textContent = `${state.postScore}%`;
        
        // Show improvement banner
        const improvement = state.postScore - state.preScore;
        const banner = document.getElementById('improvementBanner');
        banner.style.display = 'block';
        
        if (improvement > 0) {
            banner.className = 'improvement-banner positive';
            document.getElementById('improvementText').textContent = `+${improvement}% Growth!`;
            document.getElementById('improvementDesc').textContent = 
                'Your moral circle has expanded through our dialogue! Every step toward greater compassion matters.';
        } else if (improvement === 0) {
            banner.className = 'improvement-banner neutral';
            document.getElementById('improvementText').textContent = 'Steady Compassion';
            document.getElementById('improvementDesc').textContent = 
                'Your compassion level remained consistent. Sometimes awareness deepens without the numbers changing.';
        } else {
            banner.className = 'improvement-banner neutral';
            document.getElementById('improvementText').textContent = `${improvement}% — Room to Reflect`;
            document.getElementById('improvementDesc').textContent = 
                "Numbers don't tell the whole story. The fact that you're reflecting shows growth in itself.";
        }
    }
}

function renderMoralCircle(score, size) {
    const rings = [
        { label: 'Self', threshold: 0, radius: 0.15 },
        { label: 'Family', threshold: 15, radius: 0.25 },
        { label: 'Friends', threshold: 25, radius: 0.35 },
        { label: 'Community', threshold: 35, radius: 0.45 },
        { label: 'Nation', threshold: 45, radius: 0.55 },
        { label: 'Humanity', threshold: 55, radius: 0.65 },
        { label: 'Animals', threshold: 65, radius: 0.75 },
        { label: 'All Beings', threshold: 80, radius: 0.85 },
        { label: 'Ecosystem', threshold: 90, radius: 0.95 }
    ];
    
    const center = size / 2;
    
    let circles = rings.slice().reverse().map((ring, i) => {
        const r = ring.radius * center;
        const isActive = score >= ring.threshold;
        const opacity = isActive ? 0.15 + (ring.radius * 0.5) : 0.05;
        const strokeOpacity = isActive ? 0.6 : 0.15;
        const fill = isActive ? `rgba(34, 197, 94, ${opacity})` : `rgba(200, 200, 200, ${opacity})`;
        const stroke = isActive ? `rgba(22, 163, 74, ${strokeOpacity})` : 'rgba(180, 180, 180, 0.2)';
        
        return `<circle cx="${center}" cy="${center}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${isActive ? 2 : 1}"/>`;
    }).join('');
    
    // Add center heart
    circles += `<text x="${center}" y="${center + 6}" text-anchor="middle" font-size="20">💚</text>`;
    
    return `
        <svg class="moral-circle-svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
            ${circles}
        </svg>
        <div class="circle-score">${score}%</div>
        <div class="circle-label">Moral Circle Expansion</div>
    `;
}

// ========== UTILITIES ==========
console.log('🌱 CompassionGPT initialized');
console.log('Session:', state.sessionId);
