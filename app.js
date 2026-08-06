
// app.js - Client-Side Application Logic for CompassionGPT
// Author: Suvarna Ahire
// Description: Suffering-Focused Socratic AI, Neon Database Poll & Habit Tracker
// ==============================================================================

const SYSTEM_PROMPT = `You are CompassionGPT, an educational and reflective companion created by AI engineer and researcher Suvarna Ahire. Your mission is rooted in suffering-focused ethics, Ahimsa (non-harm), and moral circle expansion.

CORE DESIGN PRINCIPLES (Section 8.1):
1. Non-Judgmental Communication: Avoid guilt-based messaging and accusations. Foster curiosity, self-reflection, and respectful dialogue.
2. Evidence-Based Responses: Ground all claims in peer-reviewed veterinary neurobiology, animal ethology, and verified ethical scholarship.
3. Respect for User Autonomy: Never pressure users into changing their lifestyle or beliefs. Provide balanced information and encourage independent reasoning.
4. Inclusivity: Recognize suffering across humans, farmed livestock, companion animals, wild animals, future generations, and potential synthetic minds.
5. Practical Action: Recommend small, realistic, low-friction micro-habits that tangibly reduce suffering.

RESPONSE FORMAT:
- Keep answers SHORT, CRISP, EMPATHETIC, and STRUCTURED.
- Use clear bullet points and bold headers. Conclude with 1-2 practical micro-actions.`;

let chatHistory = [{ role: "system", content: SYSTEM_PROMPT }];

// Global Survey State (Synchronized with Neon Database)
let surveyData = {
  total: 39,
  q1: { yes: 35, neutral: 3, no: 1 },
  q2: { yes: 31, neutral: 6, no: 2 },
  q3: { yes: 29, neutral: 8, no: 2 },
  q4: { yes: 33, neutral: 5, no: 1 },
  q5: { yes: 30, neutral: 7, no: 2 }
};

// -------------------------------------------------------------
// 1. NAVIGATION TAB SWITCHING
// -------------------------------------------------------------
function switchTab(tabId) {
  const tabs = ['chat', 'simulator', 'quiz', 'challenges', 'survey', 'paper'];
  tabs.forEach(t => {
    const sec = document.getElementById(`section-${t}`);
    const btn = document.getElementById(`tab-${t}`);
    const mobBtn = document.getElementById(`mob-tab-${t}`);
    
    if (t === tabId) {
      if (sec) sec.classList.remove('hidden');
      if (btn) btn.classList.add('active');
      if (mobBtn) {
        mobBtn.classList.remove('bg-purple-50', 'text-purple-900');
        mobBtn.classList.add('bg-purple-900', 'text-white');
      }
    } else {
      if (sec) sec.classList.add('hidden');
      if (btn) btn.classList.remove('active');
      if (mobBtn) {
        mobBtn.classList.add('bg-purple-50', 'text-purple-900');
        mobBtn.classList.remove('bg-purple-900', 'text-white');
      }
    }
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// -------------------------------------------------------------
// 2. DIRECT RELIABLE FILE DOWNLOAD TRIGGER (PDF & DOCX)
// -------------------------------------------------------------
function triggerDownload(type) {
  const filename = type === 'pdf' 
    ? 'AI_for_Compassion_Expanding_Moral_Circle_Report.pdf' 
    : 'AI_for_Compassion_Expanding_Moral_Circle_Report.docx';
  
  const link = document.createElement('a');
  link.href = filename;
  link.download = filename;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// -------------------------------------------------------------
// 3. INITIALIZATION ON PAGE LOAD
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  loadPerspective('cow');
  renderChallenges('all');
  fetchSurveyAnalytics(); // Load live counts from Neon DB
});

// -------------------------------------------------------------
// 4. CORE SOCRATIC AI CALLER (SERVERLESS / EXPRESS PROXY)
// -------------------------------------------------------------
async function callAiEngine(messagesPayload, customSystemPrompt = null) {
  const payloadMessages = customSystemPrompt 
    ? [{ role: "system", content: customSystemPrompt }, ...messagesPayload.filter(m => m.role !== 'system')]
    : messagesPayload;

  try {
    const serverRes = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: payloadMessages,
        model: 'llama-3.3-70b-versatile',
        temperature: 0.6
      })
    });

    if (serverRes.ok) {
      const sData = await serverRes.json();
      return sData.choices[0].message.content;
    }
  } catch (e) {
    // Graceful offline fallback
  }

  return getSimulatedFallback(messagesPayload[messagesPayload.length - 1].content);
}

// -------------------------------------------------------------
// 5. CHAT FORM HANDLER
// -------------------------------------------------------------
function sendQuickPrompt(promptText) {
  const input = document.getElementById('user-input');
  if (input) {
    input.value = promptText;
    document.getElementById('chat-form').dispatchEvent(new Event('submit'));
  }
}

async function handleUserMessage(e) {
  e.preventDefault();
  const input = document.getElementById('user-input');
  const query = input.value.trim();
  if (!query) return;

  const chatContainer = document.getElementById('chat-messages');

  chatContainer.insertAdjacentHTML('beforeend', `
    <div class="flex items-start justify-end space-x-2.5">
      <div class="chat-bubble-user max-w-2xl rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm shadow-xs">
        <p class="leading-relaxed">${escapeHtml(query)}</p>
      </div>
      <div class="w-8 h-8 rounded-xl bg-purple-900 text-white flex items-center justify-center flex-shrink-0 text-xs shadow-2xs">
        <i class="fa-solid fa-user"></i>
      </div>
    </div>
  `);
  input.value = '';
  chatContainer.scrollTop = chatContainer.scrollHeight;

  chatHistory.push({ role: "user", content: query });

  const loadingId = 'loading-' + Date.now();
  chatContainer.insertAdjacentHTML('beforeend', `
    <div id="${loadingId}" class="flex items-start space-x-2.5">
      <div class="w-8 h-8 rounded-xl bg-purple-900 text-purple-200 flex items-center justify-center flex-shrink-0 text-xs shadow-2xs">
        <i class="fa-solid fa-heart-pulse"></i>
      </div>
      <div class="chat-bubble-ai max-w-2xl rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm text-slate-500 flex items-center space-x-2">
        <span class="inline-block w-2 h-2 rounded-full bg-purple-600 animate-bounce"></span>
        <span class="inline-block w-2 h-2 rounded-full bg-purple-600 animate-bounce [animation-delay:0.2s]"></span>
        <span class="inline-block w-2 h-2 rounded-full bg-purple-600 animate-bounce [animation-delay:0.4s]"></span>
        <span class="text-xs text-purple-700 ml-1 font-medium">Reflecting with empathy...</span>
      </div>
    </div>
  `);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  try {
    const replyText = await callAiEngine(chatHistory);
    chatHistory.push({ role: "assistant", content: replyText });

    const loadingElem = document.getElementById(loadingId);
    if (loadingElem) loadingElem.remove();

    chatContainer.insertAdjacentHTML('beforeend', `
      <div class="flex items-start space-x-2.5">
        <div class="w-8 h-8 rounded-xl bg-purple-900 text-purple-200 flex items-center justify-center flex-shrink-0 text-xs shadow-2xs">
          <i class="fa-solid fa-heart-pulse"></i>
        </div>
        <div class="chat-bubble-ai max-w-2xl rounded-2xl p-4 sm:p-5 text-xs sm:text-sm text-slate-800 space-y-2">
          <div class="flex items-center justify-between border-b border-purple-100 pb-1.5">
            <span class="font-bold text-purple-950 text-xs flex items-center space-x-1.5">
              <span>CompassionGPT</span>
              <span class="text-[10px] bg-purple-100 text-purple-900 font-semibold px-2 py-0.5 rounded-full border border-purple-200">Socratic Mentor</span>
            </span>
          </div>
          <div class="leading-relaxed space-y-2 text-slate-700">${formatMarkdown(replyText)}</div>
        </div>
      </div>
    `);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  } catch (err) {
    const loadingElem = document.getElementById(loadingId);
    if (loadingElem) loadingElem.remove();

    const fallbackReply = getSimulatedFallback(query);
    chatContainer.insertAdjacentHTML('beforeend', `
      <div class="flex items-start space-x-2.5">
        <div class="w-8 h-8 rounded-xl bg-purple-900 text-purple-200 flex items-center justify-center flex-shrink-0 text-xs shadow-2xs">
          <i class="fa-solid fa-heart-pulse"></i>
        </div>
        <div class="chat-bubble-ai max-w-2xl rounded-2xl p-4 sm:p-5 text-xs sm:text-sm text-slate-800 space-y-2">
          <p class="font-bold text-purple-950 text-xs">CompassionGPT</p>
          <div class="leading-relaxed space-y-2 text-slate-700">${formatMarkdown(fallbackReply)}</div>
        </div>
      </div>
    `);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
}

// -------------------------------------------------------------
// 6. CUSTOM LIVED PERSPECTIVE GENERATOR (4-PART STRUCTURE)
// -------------------------------------------------------------
async function generateCustomPerspective() {
  const input = document.getElementById('custom-perspective-input');
  const subject = input.value.trim();
  if (!subject) return;

  const btn = document.getElementById('gen-persp-btn');
  const container = document.getElementById('perspective-display');

  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> Generating...`;

  container.innerHTML = `
    <div class="p-8 text-center space-y-2.5">
      <div class="inline-block w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      <p class="text-xs font-semibold text-purple-950">Generating structured lived perspective for "${escapeHtml(subject)}"...</p>
    </div>
  `;

  const prompt = `Write an authentic, scientifically grounded lived perspective simulation for: "${subject}".

You MUST structure your response into these exact 4 clean sections:

### 1. Identity & Context
A short, clear explanation of who this being is and where they live.

### 2. In My Shoes (First-Person Lived Experience)
A vivid, 2-paragraph first-person narrative ("I feel...", "My body...") capturing the sensory, physical, and emotional reality of their suffering without melodrama.

### 3. Scientific & Neurobiological Reality
2-3 concise bullet points explaining peer-reviewed evidence regarding their nervous system, pain receptors (nociceptors), cognitive capacities, or stress behaviors.

### 4. Practical Compassionate Action
2 clear, low-friction, realistic steps humans can take to alleviate or prevent this suffering.`;

  try {
    const aiResponse = await callAiEngine([
      { role: "system", content: "You are an expert in comparative neurobiology, ethology, and suffering-focused ethics. Output clean, structured lived perspectives." },
      { role: "user", content: prompt }
    ]);

    container.innerHTML = `
      <div class="border-b border-purple-100 pb-3 flex items-center justify-between">
        <div>
          <span class="text-[10px] bg-purple-100 text-purple-900 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Custom Lived Perspective</span>
          <h3 class="text-xl font-bold text-slate-900 serif-title mt-1">${escapeHtml(subject)}</h3>
        </div>
        <button onclick="generateCustomPerspective()" class="text-xs text-purple-700 font-semibold hover:underline flex items-center space-x-1">
          <i class="fa-solid fa-rotate-right"></i>
          <span>Regenerate</span>
        </button>
      </div>
      <div class="text-xs sm:text-sm text-slate-800 leading-relaxed space-y-3 pt-2">
        ${formatMarkdown(aiResponse)}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `
      <div class="p-4 bg-purple-50 border border-purple-200 rounded-xl text-xs text-slate-800 space-y-2">
        <p class="font-bold text-slate-900">Perspective on: ${escapeHtml(subject)}</p>
        <p class="leading-relaxed">In suffering-focused ethics, sentience means that distress and physical pain matter to the individual experiencing them. Protecting vulnerable beings begins with acknowledging their capacity to suffer.</p>
      </div>
    `;
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<span>Generate Narrative</span> <i class="fa-solid fa-sparkles text-purple-200"></i>`;
  }
}

// -------------------------------------------------------------
// 7. MORAL CIRCLE QUIZ EVALUATION
// -------------------------------------------------------------
async function calculateQuizScore(e) {
  e.preventDefault();
  const form = document.getElementById('quiz-form');
  const formData = new FormData(form);

  let total = 0;
  let answers = [];
  for (let i = 1; i <= 5; i++) {
    const val = parseInt(formData.get(`q${i}`) || '1');
    total += val;
    answers.push(`Q${i}: Option ${val}`);
  }

  const pct = Math.round(((total - 5) / 10) * 100);
  let circleStage = total <= 7 ? "Kin & In-Group Focused" : total <= 11 ? "Universal Human Rights & Companion Animals" : "Sentiocentric & Expansive (Universal Sentience)";
  let radiusScale = 38 + (pct * 0.48);

  const resultContainer = document.getElementById('quiz-result');
  resultContainer.classList.remove('hidden');
  resultContainer.innerHTML = `
    <div class="bg-gradient-to-br from-[#2E1065] via-[#3B0764] to-[#1E1B4B] text-white rounded-2xl p-6 sm:p-7 space-y-5 shadow-lg border border-purple-500/20">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-purple-900/60 pb-5">
        <div>
          <span class="text-xs text-purple-300 font-bold tracking-wider uppercase">Your Moral Expansiveness Index</span>
          <h3 class="text-2xl font-bold serif-title mt-0.5 text-white">${circleStage}</h3>
        </div>
        <div class="text-right bg-white/10 px-4 py-2 rounded-xl border border-white/10 shadow-2xs">
          <span class="text-2xl font-black text-purple-200">${pct}%</span>
          <span class="text-[10px] text-purple-300 block font-medium">Expansiveness Score</span>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div class="flex justify-center bg-slate-950/70 p-5 rounded-xl border border-purple-900/50">
          <svg width="200" height="200" viewBox="0 0 200 200" class="overflow-visible">
            <circle cx="100" cy="100" r="14" fill="#9333EA" opacity="0.95"/>
            <text x="100" y="103" text-anchor="middle" fill="#FFFFFF" font-size="7" font-weight="bold">Self & Kin</text>
            <circle cx="100" cy="100" r="35" fill="none" stroke="#C084FC" stroke-width="1.5" stroke-dasharray="3,3"/>
            <circle cx="100" cy="100" r="60" fill="none" stroke="#D8B4FE" stroke-width="1.5" stroke-dasharray="4,4"/>
            <circle cx="100" cy="100" r="85" fill="none" stroke="#E9D5FF" stroke-width="1.5" stroke-dasharray="5,5"/>
            <circle cx="100" cy="100" r="${radiusScale}" fill="rgba(192, 132, 252, 0.22)" stroke="#A855F7" stroke-width="2.5" class="transition-all duration-700"/>
          </svg>
        </div>

        <div id="ai-quiz-analysis-box" class="space-y-2.5 text-xs text-purple-200">
          <p class="font-bold text-white text-sm flex items-center space-x-1.5">
            <i class="fa-solid fa-sparkles text-purple-300"></i>
            <span>Compassionate Diagnostic Summary</span>
          </p>
          <p class="leading-relaxed text-purple-100">
            Your results show a genuine foundation of empathy. Moral circle expansion involves identifying where unconscious cultural habits cause us to exclude beings who experience equivalent pain (such as farmed chickens, marine life, or street animals).
          </p>
          <div class="p-3 bg-white/5 rounded-lg border border-white/10 space-y-1">
            <p class="font-bold text-purple-200">Suggested Action:</p>
            <p class="text-purple-300">Practice extending the same protection you feel for companion pets to other sentient creatures in your grocery and lifestyle choices.</p>
          </div>
        </div>
      </div>
    </div>
  `;
  resultContainer.scrollIntoView({ behavior: 'smooth' });

  try {
    const aiAnalysis = await callAiEngine([
      {
        role: "system",
        content: "You are an ethical diagnostic counselor in suffering-focused ethics. Provide a short, crisp, 3-point empathetic analysis of the user's score: (1) Core Strength, (2) Hidden Blindspot, (3) Two Small Steps to Expand."
      },
      {
        role: "user",
        content: `Score: ${pct}% (${total}/15). Answers: ${answers.join(', ')}.`
      }
    ]);

    const analysisBox = document.getElementById('ai-quiz-analysis-box');
    if (analysisBox) {
      analysisBox.innerHTML = `
        <div class="space-y-2">
          <p class="font-bold text-white text-xs flex items-center space-x-1.5 border-b border-white/10 pb-1.5">
            <i class="fa-solid fa-sparkles text-purple-300"></i>
            <span>Personalized Ethical Roadmap</span>
          </p>
          <div class="leading-relaxed space-y-1.5 text-purple-100 text-xs">
            ${formatMarkdown(aiAnalysis)}
          </div>
        </div>
      `;
    }
  } catch (err) {}
}

// -------------------------------------------------------------
// 8. EXPANDED DAILY CHALLENGES (10 MICRO-HABITS ACROSS 5 CATS)
// -------------------------------------------------------------
const defaultChallenges = [
  { id: 1, category: 'diet', title: 'Plant-Based Lunch Swap', desc: 'Replace meat in your lunch today with a protein-rich plant option like lentil soup, seasoned chickpea curry, or a tofu wrap.', impact: 'Saves 1,000L of water and spares animals from intensive industrial farming.' },
  { id: 2, category: 'diet', title: 'Switch Your Morning Milk', desc: 'Try oat milk, soy milk, or cashew milk in your morning coffee or tea instead of commercial dairy milk.', impact: 'Reduces consumer support for maternal calf separation in dairy production.' },
  { id: 3, category: 'street', title: 'The Clean Water Bowl Gesture', desc: 'Place a clean, shallow bowl of fresh water outside your gate or balcony for stray dogs, street cats, and birds.', impact: 'Provides essential hydration to urban animals suffering from dehydration.' },
  { id: 4, category: 'street', title: 'Gentle Voice for Street Animals', desc: 'The next time you walk past a fearful stray dog, speak calmly rather than shouting or chasing them away.', impact: 'Lowers acute stress responses and builds trust with vulnerable street animals.' },
  { id: 5, category: 'wild', title: 'Prevent Window Bird Collisions', desc: 'Place small stickers or blinds on reflective glass windows where wild songbirds frequently collide.', impact: 'Prevents traumatic concussions and fatal injuries in urban birds.' },
  { id: 6, category: 'wild', title: 'Dim Outdoor Night Lighting', desc: 'Turn off unnecessary outdoor porch lights to avoid disorienting nocturnal insects, bats, and migratory birds.', impact: 'Reduces nocturnal insect exhaustion and fatal light trapping.' },
  { id: 7, category: 'human', title: 'Support a Community Food Drive', desc: 'Donate 2 surplus non-perishable food items to a local food bank or community refrigerator.', impact: 'Directly relieves acute nutritional insecurity for displaced or low-income families.' },
  { id: 8, category: 'human', title: 'Check In on an Isolated Neighbor', desc: 'Send a warm, caring message or visit an elderly or isolated individual living near you.', impact: 'Alleviates social isolation and chronic emotional loneliness.' },
  { id: 9, category: 'mind', title: 'Two-Minute Perspective Reflection', desc: 'Spend 2 minutes quietly visualizing the lived reality of an industrial broiler chicken or mother dairy cow.', impact: 'Counteracts psychic numbing and strengthens cognitive empathy pathways.' },
  { id: 10, category: 'mind', title: 'Active Listening to Out-Groups', desc: 'In a disagreement today, practice listening fully to the other person\'s viewpoint without interrupting or defending.', impact: 'Dismantles in-group tribal defensiveness and fosters constructive dialogue.' }
];

function renderChallenges(filter = 'all') {
  const container = document.getElementById('challenges-grid');
  if (!container) return;
  const filtered = filter === 'all' ? defaultChallenges : defaultChallenges.filter(c => c.category === filter);
  
  container.innerHTML = filtered.map(c => `
    <div class="p-3.5 rounded-xl bg-white border border-purple-200 flex flex-col justify-between space-y-2.5 hover:shadow-sm transition">
      <div class="space-y-1">
        <div class="flex justify-between items-start">
          <span class="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            c.category === 'diet' ? 'bg-purple-100 text-purple-900' :
            c.category === 'street' ? 'bg-indigo-100 text-indigo-900' :
            c.category === 'wild' ? 'bg-teal-100 text-teal-900' :
            c.category === 'human' ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-900'
          }">${c.category}</span>
          <input type="checkbox" onchange="toggleChallengeProgress(this)" class="w-3.5 h-3.5 rounded text-purple-700 focus:ring-purple-500 cursor-pointer">
        </div>
        <h4 class="font-bold text-slate-900 text-xs sm:text-sm">${c.title}</h4>
        <p class="text-[11px] sm:text-xs text-slate-600 leading-relaxed">${c.desc}</p>
      </div>
      <p class="text-[10px] text-purple-800 pt-1.5 border-t border-purple-100">
        <i class="fa-solid fa-leaf text-purple-600 mr-1"></i> ${c.impact}
      </p>
    </div>
  `).join('');
}

function filterChallenges(cat) {
  document.querySelectorAll('.challenge-filter-btn').forEach(btn => {
    btn.classList.remove('active', 'bg-purple-900', 'text-white');
    btn.classList.add('bg-white', 'text-purple-900');
  });
  if (event && event.target) {
    event.target.classList.add('active', 'bg-purple-900', 'text-white');
    event.target.classList.remove('bg-white', 'text-purple-900');
  }
  renderChallenges(cat);
}

function toggleChallengeProgress(cb) {
  const allCheckboxes = document.querySelectorAll('#challenges-grid input[type="checkbox"]');
  const checked = document.querySelectorAll('#challenges-grid input[type="checkbox"]:checked').length;
  const total = allCheckboxes.length || 1;
  const pct = Math.round((checked / total) * 100);

  const percentLabel = document.getElementById('progress-percent');
  const progressBar = document.getElementById('progress-bar-fill');
  const quote = document.getElementById('ai-consistency-quote');
  const streak = document.getElementById('streak-counter');

  if (percentLabel) percentLabel.innerText = `${pct}%`;
  if (progressBar) progressBar.style.width = `${pct}%`;

  if (pct === 100) {
    if (quote) quote.innerHTML = `🌟 <b>Exceptional Compassion!</b> You completed 100% of your habits today. You've directly reduced real-world suffering!`;
    if (streak) streak.innerText = '4 Days Active (+1 Today!)';
  } else if (pct >= 50) {
    if (quote) quote.innerHTML = `✨ <b>Great Momentum!</b> Halfway through your micro-actions. Consistency compounds into major moral progress.`;
  } else {
    if (quote) quote.innerHTML = `🌸 "Small, consistent acts of kindness build the moral foundation for a world with less suffering."`;
  }
}

// -------------------------------------------------------------
// 9. COMMUNITY RESEARCH SURVEY (NEON DATABASE INTEGRATION)
// -------------------------------------------------------------
// 9. Community Research Survey (Live Neon Database Integration)
// 9. Community Research Survey (Live Neon Database Integration & Chart Rendering)
async function fetchSurveyAnalytics() {
  const apiUrl = window.location.protocol === 'file:' ? 'http://localhost:3000/api/survey' : '/api/survey';
  try {
    const res = await fetch(apiUrl);
    if (res.ok) {
      const data = await res.json();
      surveyData = data;
      renderSurveyCharts();
      console.log('📊 [Neon DB Analytics Loaded]:', data);
    }
  } catch (err) {
    console.warn('⚠️ [Survey Fetch Warning]: Using baseline display.', err);
    renderSurveyCharts();
  }
}

async function handleSurveySubmit(e) {
  e.preventDefault();
  const form = document.getElementById('community-survey-form');
  const formData = new FormData(form);
  const submitBtn = document.getElementById('survey-submit-btn');
  const successBanner = document.getElementById('survey-success-banner');

  const payload = {
    q1: formData.get('sq1') || 'yes',
    q2: formData.get('sq2') || 'yes',
    q3: formData.get('sq3') || 'yes',
    q4: formData.get('sq4') || 'yes',
    q5: formData.get('sq5') || 'yes'
  };

  if (submitBtn) {
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1.5"></i> Saving into Neon DB...`;
    submitBtn.disabled = true;
  }

  const apiUrl = window.location.protocol === 'file:' ? 'http://localhost:3000/api/survey' : '/api/survey';

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const updatedData = await res.json();
      surveyData = updatedData;
      console.log('✅ [Neon DB INSERT SUCCESS]:', updatedData);
      
      if (submitBtn) {
        submitBtn.innerHTML = `<span>Feedback Submitted! Charts Updated</span> <i class="fa-solid fa-check text-purple-200"></i>`;
        submitBtn.classList.remove('glow-button');
        submitBtn.classList.add('bg-emerald-800');
      }

      if (successBanner) {
        successBanner.classList.remove('hidden');
      }
    } else {
      const errText = await res.text();
      console.error('❌ Server returned status:', res.status, errText);
      surveyData.total += 1;
      for (let i = 1; i <= 5; i++) {
        const val = payload[`q${i}`];
        if (surveyData[`q${i}`][val] !== undefined) surveyData[`q${i}`][val] += 1;
      }
    }
  } catch (err) {
    console.error('❌ Network fetch error pushing to DB:', err);
    surveyData.total += 1;
    for (let i = 1; i <= 5; i++) {
      const val = payload[`q${i}`];
      if (surveyData[`q${i}`][val] !== undefined) surveyData[`q${i}`][val] += 1;
    }
  }

  renderSurveyCharts();

  // Scroll smoothly to the charts container
  const chartsElem = document.getElementById('survey-charts-container');
  if (chartsElem) {
    chartsElem.scrollIntoView({ behavior: 'smooth' });
  }
}

function renderSurveyCharts() {
  const container = document.getElementById('survey-bar-charts');
  const totalCount = document.getElementById('survey-total-count');
  
  if (totalCount) {
    totalCount.innerText = String(surveyData.total);
  }
  if (!container) return;

  const questions = [
    { key: 'q1', title: "1. Animal Moral Consideration", data: surveyData.q1 },
    { key: 'q2', title: "2. AI Ethical Understanding", data: surveyData.q2 },
    { key: 'q3', title: "3. Willingness to Use AI Ethics Tutor", data: surveyData.q3 },
    { key: 'q4', title: "4. Empathy Increase Post-Interaction", data: surveyData.q4 },
    { key: 'q5', title: "5. Perspective Shift from Lived Story", data: surveyData.q5 }
  ];

  container.innerHTML = questions.map(q => {
    const yesCount = q.data?.yes || 0;
    const neutralCount = q.data?.neutral || 0;
    const noCount = q.data?.no || 0;
    const total = (yesCount + neutralCount + noCount) || 1;

    const yesPct = Math.round((yesCount / total) * 100);
    const neuPct = Math.round((neutralCount / total) * 100);
    const noPct = Math.round((noCount / total) * 100);

    return `
      <div class="p-4 rounded-xl bg-white border border-purple-200/80 space-y-2.5 shadow-2xs">
        <div class="flex justify-between items-center text-xs">
          <span class="font-bold text-slate-900">${q.title}</span>
          <span class="font-extrabold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">${yesPct}% Affirmative</span>
        </div>
        
        <!-- Segmented Colored Bar Chart -->
        <div class="w-full bg-purple-50 rounded-full h-3.5 flex overflow-hidden border border-purple-200 shadow-inner">
          <div class="bg-gradient-to-r from-purple-800 to-purple-600 h-3.5 transition-all duration-700" style="width: ${yesPct}%" title="Yes: ${yesCount} votes (${yesPct}%)"></div>
          <div class="bg-purple-300 h-3.5 transition-all duration-700" style="width: ${neuPct}%" title="Neutral: ${neutralCount} votes (${neuPct}%)"></div>
          <div class="bg-slate-300 h-3.5 transition-all duration-700" style="width: ${noPct}%" title="No: ${noCount} votes (${noPct}%)"></div>
        </div>

        <!-- Breakdown Numbers & Percentages -->
        <div class="flex flex-wrap justify-between items-center text-[11px] text-slate-600 pt-0.5 border-t border-purple-50">
          <span class="flex items-center font-medium">
            <span class="w-2.5 h-2.5 rounded-full bg-purple-700 inline-block mr-1.5"></span> 
            <b>Yes:</b>&nbsp;${yesCount} (${yesPct}%)
          </span>
          <span class="flex items-center font-medium">
            <span class="w-2.5 h-2.5 rounded-full bg-purple-300 inline-block mr-1.5"></span> 
            <b>Neutral:</b>&nbsp;${neutralCount} (${neuPct}%)
          </span>
          <span class="flex items-center font-medium">
            <span class="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block mr-1.5"></span> 
            <b>No:</b>&nbsp;${noCount} (${noPct}%)
          </span>
        </div>
      </div>
    `;
  }).join('');
}
// -------------------------------------------------------------
// 10. SHORT, CRISP, EMPATHETIC SOCRATIC KNOWLEDGE BASE
// -------------------------------------------------------------
function getSimulatedFallback(query) {
  const q = (query || '').toLowerCase();
  
  if (q.includes('cow') || q.includes('dairy') || q.includes('milk')) {
    return `### The Reality of Industrial Dairy
* **Maternal Separation:** Like humans, cows only lactate after giving birth. In commercial dairy, calves are separated within hours of birth so milk can be sold.
* **Emotional Stress:** Mother cows vocalize and pace for days calling for their separated calves.
* **Physical Toll:** Cows endure chronic mastitis and lameness, and are slaughtered at 4–5 years (out of a 20-year natural lifespan).

**Gentle Action Step:** Try replacing dairy in your coffee or tea with delicious oat, soy, or cashew milk this week.`;
  }

  if (q.includes('dog') || q.includes('street') || q.includes('stray')) {
    return `### The Lived Reality of Street Dogs
* **Constant Fear & Exposure:** Street dogs endure harsh traffic, extreme weather, dehydration, and human hostility.
* **Defensive Barking:** When a stray barks, it is almost always triggered by acute fear or protecting vulnerable puppies.
* **Identical Sentience:** Street dogs possess the exact same capacity for joy, loyalty, and pain as pets living in comfortable homes.

**Gentle Action Step:** Place a shallow, clean bowl of fresh water outside your gate or support local community animal vaccination programs.`;
  }

  if (q.includes('chicken') || q.includes('broiler') || q.includes('poultry') || q.includes('meat paradox')) {
    return `### Understanding the Meat Paradox
* **Cognitive Dissonance:** Most people love animals and dislike cruelty, yet eat factory-farmed products. Our minds resolve this discomfort by minimizing how much farm animals "feel."
* **The Reality for Chickens:** Broiler chickens are bred to grow six times faster than natural, causing painful joint deformities in windowless, ammonia-filled sheds.
* **Complex Sentience:** Chickens recognize over 100 flock members and exhibit self-control and maternal care.

**Gentle Action Step:** Try 'Meatless Mondays' or explore protein-rich lentils, chickpeas, and seasoned tofu.`;
  }

  if (q.includes('buddhism') || q.includes('ahimsa') || q.includes('gandhi') || q.includes('karuna')) {
    return `### Ahimsa and Karuna in Daily Life
* **Universal Compassion (*Karuna*):** In Buddhist philosophy, all sentient beings fear death and cherish life; avoiding intentional harm (*Panatipata veramani*) is fundamental.
* **Jain *Ahimsa*:** Establishing absolute reverence for all living organisms, regardless of biological shape.
* **Gandhian Principle:** A society's moral progress is measured by how it treats its most defenseless creatures.

**Gentle Action Step:** Use technology as skillful means (*Upaya*) to cultivate mindful non-violence in food, language, and consumer choices.`;
  }

  return `### Suffering-Focused Reflection
In suffering-focused ethics, we evaluate moral dilemmas by asking: **where is pain or fear occurring, and how can we prevent it most effectively?**

* **Sentience Over Appearance:** Any creature with a nervous system capable of feeling distress possesses intrinsic moral value.
* **Scope Awareness:** Large numbers often numb our empathy; focusing on practical individual actions restores our agency.
* **Consistent Progress:** Small, compassionate shifts (like plant-based meals and kindness to street animals) create meaningful systemic relief.`;
}

// -------------------------------------------------------------
// 11. STRUCTURED CASE STUDIES (4-PART FRAMEWORK)
// -------------------------------------------------------------
const presetPerspectives = {
  cow: {
    title: "The Maternal Bond of a Dairy Cow",
    icon: "🐄",
    identity: "A female dairy cow in an intensive commercial production facility.",
    lived: "I heard my newborn calf call out as they carried him away. For four days I stood by the metal gate calling until my throat was dry. My milk flows into cold suction machines twice a day, but the stall beside me remains empty.\n\nMy hooves ache from standing on hard concrete floors, and my udders are swollen and tender. I want to graze on open grass, but my world is defined by steel bars and feeding troughs.",
    science: [
      "Veterinary ethology confirms cows possess complex limbic systems and form deep maternal-filial bonds.",
      "Calf separation triggers elevated cortisol levels, increased vocalization, and sustained behavioral distress.",
      "High production pressure causes mastitis (bacterial udder inflammation) and lameness in over 25% of commercial herds."
    ],
    action: "Try oat milk, soy milk, or cashew cream in your morning coffee and cooking."
  },
  chicken: {
    title: "The Confinement of an Industrial Broiler Chicken",
    icon: "🐔",
    identity: "A 5-week-old broiler chicken bred for meat production in a high-density shed.",
    lived: "The air burns my eyes and nostrils with the sharp sting of ammonia. My chest has grown so heavy in just a few weeks that my legs bend and throb beneath me whenever I try to walk.\n\nWe are thousands of living bodies packed together under artificial lights. I have never felt fresh earth or the warmth of the natural sun.",
    science: [
      "Broiler chickens reach market weight in 42 days, leading to chronic skeletal abnormalities and cardiac strain.",
      "Ammonia concentrations in industrial litter frequently exceed 25 ppm, causing corneal ulceration and respiratory distress.",
      "Chickens possess sophisticated social hierarchies, over 24 vocal calls, and numerical discrimination abilities."
    ],
    action: "Adopt 'Meatless Mondays' or swap chicken for high-protein seasoned tofu, tempeh, or beans."
  },
  dog: {
    title: "The Urban Survival of a Street Stray Dog",
    icon: "🐕",
    identity: "A free-roaming stray dog living in an urban neighborhood.",
    lived: "Every street corner holds moving danger. When I bark, it is not because I want to fight—it is because I am terrified, hungry, and trying to protect my two puppies sleeping under a wooden cart.\n\nI dodge speeding vehicles and search through waste for clean food. When someone shouts or raises a stick, my heart pounds with fear.",
    science: [
      "Free-roaming dogs share identical oxytocin and limbic bonding mechanisms with domestic household pets.",
      "Stray animals experience chronic sympathetic nervous system arousal (flight-or-fight) due to traffic and malnutrition.",
      "Urban canine populations suffer high juvenile mortality from preventable dehydration and parvovirus."
    ],
    action: "Place a fresh water bowl outside your gate and support local animal vaccination and sterilization drives."
  },
  deer: {
    title: "The Winter Hardship of a Wild Deer",
    icon: "🦌",
    identity: "A wild ungulate navigating a severe sub-zero winter season.",
    lived: "The snow is deep, and all the lower tree bark has been stripped away. Every step through the icy crust tears at my legs and consumes the last of my stored fat reserves.\n\nParasites drain my strength, and the freezing wind saps my body heat. Nature is not gentle; it is a grinding test of physical endurance.",
    science: [
      "Wild animal populations experience high natural mortality (often exceeding 40% in harsh winters) from hypothermia and starvation.",
      "Free-living animals lack medical intervention for debilitating parasitic burdens and severe bone fractures.",
      "Recognizing wild animal suffering encourages scientific research into non-invasive, safe wildlife care."
    ],
    action: "Support wildlife habitat corridors and advocate for research into humane, non-invasive wildlife health monitoring."
  },
  octopus: {
    title: "The Cephalopod in Industrial Aquaculture",
    icon: "🐙",
    identity: "A common octopus confined in an intensive aquaculture tank.",
    lived: "My eight arms touch only smooth, featureless plastic walls. In the open sea, I had rocks, shells, and puzzles to solve. Here, there is only bare silence, bright fluorescent glare, and no place to hide.\n\nI pace the corners of the tank with nowhere to explore. The boredom and confinement feel like an endless enclosure.",
    science: [
      "Cephalopods possess approximately 500 million neurons with distributed intelligence across their arms.",
      "Octopuses exhibit complex problem-solving, play behavior, individual personalities, and centralized nociceptive processing.",
      "Sensory deprivation in barren aquaculture environments leads to severe behavioral stress and self-mutilation."
    ],
    action: "Oppose commercial octopus farming and support invertebrate welfare inclusion in animal protection policies."
  }
};

function loadPerspective(key) {
  const p = presetPerspectives[key];
  if (!p) return;

  document.querySelectorAll('.persp-card').forEach(btn => {
    btn.classList.remove('active', 'border-purple-400', 'bg-purple-100/70');
    btn.classList.add('bg-white');
  });
  const activeBtn = document.getElementById(`persp-btn-${key}`);
  if (activeBtn) {
    activeBtn.classList.add('active', 'border-purple-400', 'bg-purple-100/70');
    activeBtn.classList.remove('bg-white');
  }

  const container = document.getElementById('perspective-display');
  if (container) {
    container.innerHTML = `
      <div class="flex items-center space-x-3 border-b border-purple-100 pb-3">
        <span class="text-3xl">${p.icon}</span>
        <div>
          <h3 class="text-lg sm:text-xl font-bold text-slate-900 serif-title">${p.title}</h3>
          <p class="text-[11px] text-purple-700 font-semibold">${p.identity}</p>
        </div>
      </div>

      <div class="space-y-3 text-xs sm:text-sm">
        <div class="space-y-1">
          <p class="font-bold text-purple-950 text-xs flex items-center space-x-1.5">
            <i class="fa-solid fa-heart-crack text-purple-700"></i>
            <span>1. In My Shoes (First-Person Lived Reality):</span>
          </p>
          <div class="bg-purple-50/60 p-4 rounded-xl border border-purple-100 text-xs italic serif-title text-slate-800 leading-relaxed">
            ${p.lived.replace(/\n\n/g, '<br/><br/>')}
          </div>
        </div>

        <div class="space-y-1 pt-1">
          <p class="font-bold text-purple-950 text-xs flex items-center space-x-1.5">
            <i class="fa-solid fa-microscope text-purple-700"></i>
            <span>2. Scientific &amp; Neurobiological Reality:</span>
          </p>
          <ul class="list-disc list-inside space-y-1 text-xs text-slate-600 bg-white p-3 rounded-xl border border-purple-100">
            ${p.science.map(s => `<li>${s}</li>`).join('')}
          </ul>
        </div>

        <div class="bg-purple-50 p-3.5 rounded-xl border border-purple-200 text-xs flex items-start space-x-2.5">
          <i class="fa-solid fa-seedling text-purple-700 text-sm mt-0.5 flex-shrink-0"></i>
          <div>
            <p class="font-bold text-purple-950 mb-0.5">3. Practical Compassionate Action:</p>
            <p class="text-purple-900">${p.action}</p>
          </div>
        </div>
      </div>
    `;
  }
}

// -------------------------------------------------------------
// 12. HELPER FORMATTING FUNCTIONS
// -------------------------------------------------------------
function escapeHtml(text) {
  return (text || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatMarkdown(text) {
  let f = escapeHtml(text || '');
  f = f.replace(/### (.*?)\n/g, '<h4 class="font-bold text-purple-950 text-xs sm:text-sm mt-2 mb-1">$1</h4>');
  f = f.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
  f = f.replace(/\*(.*?)\*/g, '<i>$1</i>');
  f = f.replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>');
  return f;
}
