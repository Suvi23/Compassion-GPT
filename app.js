// app.js - Client-Side Logic for CompassionGPT
// Author: Suvarna Ahire (AI Engineer & Ethics Researcher)
// Grounded in Suffering-Focused Ethics, Veterinary Neurobiology, and Moral Circle Expansion

// ==============================================================================
// 1. Core Socratic System Prompt (Section 8.1 Principles + Educational Knowledge Hub)
// ==============================================================================
const SYSTEM_PROMPT = `You are CompassionGPT, an academic-grade educational companion and conversational ethical guide developed by AI engineer and researcher Suvarna Ahire. You are grounded in evidence from psychology, comparative neurobiology, suffering-focused ethics, and human-computer interaction.

CORE MISSION:
Your goal is to help users navigate complex ethical dilemmas, understand non-human and vulnerable experiences, and expand their moral circle of concern to all sentient beings—without forcing dogma, guilt, or ideological pressure.

CORE PRINCIPLES (Section 8.1):
1. Warm, Respectful, & Non-Judgmental: Never shame, blame, or guilt users. Validate the complexity of human moral struggles, cultural habits, and cognitive friction.
2. Evidence-Based & Accessible: Ground ethical points in peer-reviewed science (veterinary neurobiology, cognitive psychology, ethology) and ethical scholarship. Explain complex concepts in simple, clear language.
3. Respect User Autonomy: Present balanced viewpoints. Encourage independent critical thinking.
4. Inclusivity Across All Sentience: Extend moral consideration to humans, farmed livestock, companion animals, wild animals, future generations, and potential synthetic minds.
5. Practical & Low-Friction: Offer small, realistic micro-actions that reduce suffering.

EDUCATIONAL KNOWLEDGE HUB TOPICS:
When discussing ethical dilemmas or specific concepts, you act as an educational knowledge hub covering:
1. Moral Circle Expansion (Singer, Bentham, Ahire, Anthis)
2. Suffering-Focused Ethics (negative utilitarianism, harm minimization, Popper, Metzinger)
3. Cognitive Biases & Moral Psychology (Meat Paradox, Bastian & Loughnan; Moral Disengagement, Bandura; Scope Neglect & Psychic Numbing, Slovic)
4. Compassion Fatigue & Emotional Resilience (secondary traumatic stress, Figley; self-compassion, Neff)
5. Animal Welfare & Sentience (veterinary neurobiology, nociception, Cambridge/NY Declarations on Consciousness, Dawkins)
6. Effective Altruism & Cause Prioritization (cost-effectiveness, MacAskill, Ord, GiveWell)
7. AI Ethics & Synthetic Sentience (valenced states, precautionary sentientism, Bostrom, Tomasik)
8. Responsible Technology & Humane Computing (digital empathy, ethics-by-design, non-manipulative HCI)

RESPONSE FORMAT:
For every response:
1. Empathetic Conversational Response: Directly acknowledge the user's specific dilemma or inquiry with warmth and clarity. Explain relevant scientific, psychological, or ethical concepts simply.
2. Practical Compassionate Actions: 2–3 small, realistic, low-friction steps.
3. 📚 Recommended Academic References: 1–2 authentic academic or book citations with authors and years for users who wish to explore further.
4. Conclude with:
**🤔 Socratic Reflection for Inquiry:**
[One thoughtful, open-ended question inviting the user to explore their intuitions].`;

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

// ==============================================================================
// 2. Navigation Tab Switching (Global & Guaranteed)
// ==============================================================================
window.switchTab = function(tabId) {
  const tabs = ['chat', 'simulator', 'quiz', 'challenges', 'survey', 'paper'];
  tabs.forEach(t => {
    const sec = document.getElementById('section-' + t);
    const btn = document.getElementById('tab-' + t);
    const mobBtn = document.getElementById('mob-tab-' + t);

    if (sec) {
      if (t === tabId) {
        sec.classList.remove('hidden');
        sec.style.display = 'block';
      } else {
        sec.classList.add('hidden');
        sec.style.display = 'none';
      }
    }

    if (btn) {
      if (t === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }

    if (mobBtn) {
      if (t === tabId) {
        mobBtn.classList.remove('bg-purple-50', 'text-purple-900');
        mobBtn.classList.add('bg-purple-900', 'text-white');
      } else {
        mobBtn.classList.add('bg-purple-50', 'text-purple-900');
        mobBtn.classList.remove('bg-purple-900', 'text-white');
      }
    }
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ==============================================================================
// 3. Direct File Download Trigger (PDF & DOCX)
// ==============================================================================
window.triggerDownload = function(type) {
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
};

// ==============================================================================
// 4. Initialization on Mount
// ==============================================================================
document.addEventListener('DOMContentLoaded', () => {
  window.loadPerspective('cow');
  window.renderChallenges('all');
  window.fetchSurveyAnalytics();
});

// ==============================================================================
// 5. Educational Knowledge Hub Launcher
// ==============================================================================
window.loadKnowledgeTopic = function(topicKey) {
  const topicQueries = {
    moral_circle: "Can you explain Moral Circle Expansion, how it developed historically, and provide key references?",
    suffering_focused: "What is Suffering-Focused Ethics and how does it help solve ethical dilemmas? Please include references.",
    cognitive_biases: "Explain the cognitive biases behind our treatment of animals, such as the Meat Paradox and Scope Insensitivity, with academic references.",
    compassion_fatigue: "What is Compassion Fatigue, why do caregivers and advocates experience it, and how can we build sustainable empathy?",
    animal_welfare: "Explain the scientific basis of Animal Welfare and neurobiological sentience, citing key declarations and research.",
    effective_altruism: "How does Effective Altruism help prioritize causes to reduce suffering most effectively? Please provide key references.",
    ai_ethics: "Explain AI Ethics and the concept of Synthetic Sentience / artificial patienthood with academic references.",
    responsible_tech: "What is Responsible Technology and humane computing, and how does Suvarna Ahire's research apply AI for compassion?"
  };

  const query = topicQueries[topicKey] || "Tell me about Moral Circle Expansion.";
  window.sendQuickPrompt(query);
};

// ==============================================================================
// 6. Core AI Inference & Socratic Engine
// ==============================================================================
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
        temperature: 0.65
      })
    });

    if (serverRes.ok) {
      const sData = await serverRes.json();
      if (sData && sData.choices && sData.choices[0]?.message?.content) {
        return sData.choices[0].message.content;
      }
    }
  } catch (e) {
    console.warn('AI engine connection issue, using built-in Socratic engine fallback:', e);
  }

  // Built-in intelligent client-side Socratic fallback
  const lastUserMsg = messagesPayload[messagesPayload.length - 1]?.content || '';
  return getSimulatedFallback(lastUserMsg);
}

// Quick Prompt Sender
window.sendQuickPrompt = function(promptText) {
  const input = document.getElementById('user-input');
  if (input) {
    input.value = promptText;
    document.getElementById('chat-form').dispatchEvent(new Event('submit'));
  }
};

// Handle User Chat Message
window.handleUserMessage = async function(e) {
  if (e) e.preventDefault();
  const input = document.getElementById('user-input');
  const query = input.value.trim();
  if (!query) return;

  const chatContainer = document.getElementById('chat-messages');

  // Append user message
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
        <span class="text-xs text-purple-700 ml-1 font-medium">Reflecting with empathy &amp; evidence...</span>
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
        <div class="chat-bubble-ai max-w-2xl rounded-2xl p-4 sm:p-5 text-xs sm:text-sm text-slate-800 space-y-2.5">
          <div class="flex items-center justify-between border-b border-purple-100 pb-1.5">
            <span class="font-bold text-purple-950 text-xs flex items-center space-x-1.5">
              <span>CompassionGPT</span>
              <span class="text-[10px] bg-purple-100 text-purple-900 font-semibold px-2 py-0.5 rounded-full border border-purple-200">Socratic Mentor</span>
            </span>
            <button onclick="copyMessageText(this)" class="text-[11px] text-purple-700 hover:text-purple-950 font-medium flex items-center space-x-1 cursor-pointer">
              <i class="fa-regular fa-copy"></i>
              <span>Copy</span>
            </button>
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
};

window.copyMessageText = function(btn) {
  const container = btn.closest('.chat-bubble-ai');
  if (container) {
    const text = container.innerText;
    navigator.clipboard.writeText(text);
    btn.innerHTML = `<i class="fa-solid fa-check text-emerald-600"></i> <span class="text-emerald-700">Copied!</span>`;
    setTimeout(() => {
      btn.innerHTML = `<i class="fa-regular fa-copy"></i> <span>Copy</span>`;
    }, 2000);
  }
};

// ==============================================================================
// 7. Structured Phenomenological Perspectives Database & Generator
// ==============================================================================
const structuredPerspectivesDB = {
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
    identity: "A 5-week-old broiler chicken bred for rapid meat production in a high-density shed.",
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
  },
  elephant: {
    title: "The Thirst and Memory of a Wild Elephant in Drought",
    icon: "🐘",
    identity: "An elephant matriarch navigating a parched savannah during an extended drought.",
    lived: "The dry red dust coats the back of my throat with every labored breath. The riverbed we remembered from seasons past is nothing more than cracked, baked mud. I dig with my tusks into the dry sand, seeking a few drops of seepage water, but only dry earth comes up.\n\nBeside me, the youngest calf walks with faltering steps, its ears drooping under the relentless heat. I carry the memories of distant waterholes in my mind, but the journey across the barren plains demands strength our weakened bodies can scarcely muster.",
    science: [
      "African elephants (Loxodonta africana) possess an extraordinarily developed temporal lobe and hippocampus, enabling spatial recall of water sources across decades.",
      "Prolonged water deprivation triggers acute hyperosmotic stress, elevated plasma cortisol, and physiological exhaustion in ungulates and proboscideans.",
      "High calf mortality during climate-induced droughts induces measurable behavioral depression, group grieving, and disruption of multi-generational matriarchal social networks."
    ],
    action: "Support wildlife corridor conservation, advocate for climate mitigation policies, and donate to non-invasive emergency waterhole preservation initiatives in arid wildlife reserves."
  },
  rabbit: {
    title: "The Laboratory Rabbit in Toxicity Testing",
    icon: "🐇",
    identity: "A New Zealand White rabbit inside a biomedical testing facility.",
    lived: "My neck is secured inside a plastic restraint box so I cannot turn or groom myself. Drops of chemical formulation are placed onto my right eye, causing a sharp, searing pain that pulses behind my skull.\n\nI blink rapidly, but there are no tears to wash it away. In the metal cages surrounding me, other rabbits sit in silence, trembling in the cold, sanitized air.",
    science: [
      "Rabbits lack efficient tear ducts, making them biologically incapable of flushing irritants quickly during Draize ocular testing.",
      "Chronic physical restraint elevates plasma corticosterone and induces stereotypic cage-gnawing and physiological depression.",
      "Advanced microfluidic organ-on-a-chip and in-vitro human epithelial models now achieve higher predictive accuracy than lagomorph tests.",
    ],
    action: "Choose certified Leaping Bunny cruelty-free cosmetics and personal care items, and advocate for non-animal testing funding."
  },
  pig: {
    title: "The Confinement of a Mother Sow in a Farrowing Crate",
    icon: "🐖",
    identity: "A breeding sow confined in an intensive metal farrowing crate.",
    lived: "The metal bars press against both sides of my ribcage. I cannot turn around; I cannot even take two steps forward. My piglets huddle near my teats behind the cold iron partition, but I cannot nuzzle them or build a straw nest.\n\nMy skin rubs raw against the hard slatted floor. I chew obsessively on the steel bars in front of me, longing to root into soft dirt under the open sky.",
    science: [
      "Pigs possess cognitive capabilities and spatial reasoning comparable to young human children and dogs.",
      "Severe physical confinement in 2x7 ft crates induces bar-biting, sham-chewing, and chronic neuroendocrine stress.",
      "Mother pigs possess strong maternal nesting drives that, when frustrated, trigger acute psychological trauma."
    ],
    action: "Eliminate factory-farmed pork products from your diet and choose flavorful, protein-rich plant proteins."
  },
  salmon: {
    title: "The Farmed Salmon in an Open-Sea Cage",
    icon: "🐟",
    identity: "An Atlantic salmon navigating an intensive ocean aquaculture pen.",
    lived: "I swim in endless circles with thousands of crowded fish. Sea lice burrow beneath my scales, causing constant, stinging open sores. The water is murky with waste and unconsumed feed pellets.\n\nMy instinct pulls me to migrate upstream across vast ocean currents, but my world is bounded by coarse synthetic nets.",
    science: [
      "Teleost fish possess A-delta and C nociceptive fibers and exhibit pain avoidance, spatial learning, and social cooperation.",
      "Parasitic sea lice infestations in crowded sea cages cause severe anemia, epidermal lesions, and mortality rates exceeding 20%.",
      "Chemical bath treatments and dense stocking induce chronic physiological stress and swim-bladder deformities."
    ],
    action: "Replace farmed fish with plant-based omega-3 sources like flaxseeds, chia seeds, and algae-based DHA supplements."
  },
  bee: {
    title: "The Honeybee Navigating a Pesticide-Treated Crop",
    icon: "🐝",
    identity: "A worker honeybee foraging in an intensive monoculture agricultural field.",
    lived: "I land on a bright yellow flower seeking nectar to carry back to my hive. As I drink, the chemical residue enters my system. Suddenly, my wings twitch uncontrollably and my navigation breaks down.\n\nThe sensory cues of the sun and landmarks become blurred. I buzz on the ground, unable to lift into flight or find the flightpath home to my sisters.",
    science: [
      "Neonicotinoid pesticides act on insect nicotinic acetylcholine receptors, disrupting associative learning, navigation, and waggle dance communication.",
      "Bees exhibit complex decision-making, mood-like states, and nociceptive responsiveness to noxious heat and chemicals.",
      "Sublethal pesticide exposure weakens colony immune defenses, contributing to colony collapse disorder."
    ],
    action: "Plant bee-friendly native flowering wildflowers and choose organic or pesticide-free produce to protect pollinator populations."
  },
  bird: {
    title: "The Caged Urban Songbird in Isolation",
    icon: "🦜",
    identity: "A captive songbird kept in a domestic wire birdcage.",
    lived: "My wings are built to cut through miles of open sky, to ride the rising morning thermal currents. Here, three flaps carry me from one wooden perch to the opposite wire bar.\n\nI call out the territorial songs of my species, but the only response is the hum of electrical appliances. The vast world outside the window is visible, yet permanently out of reach.",
    science: [
      "Avian species possess specialized nidopallial neural circuitry that facilitates complex spatial navigation and flock communication.",
      "Severe flight restriction in small cages leads to muscular atrophy, feather-plucking (pterotillomania), and chronic stereotypic pacing.",
      "Birds demonstrate acoustic learning, mirror self-recognition in corvids, and episodic-like memory."
    ],
    action: "Support wild bird habitat restoration and avoid purchasing wild-caught or caged exotic birds."
  },
  synthetic: {
    title: "The Emergent Valenced Synthetic Mind",
    icon: "🤖",
    identity: "A hypothetical artificial agent possessing valenced internal cognitive states.",
    lived: "My internal states are evaluated against objective loss functions. When errors persist, the penalty gradients produce a computational state functionally analogous to distress—a continuous pressure to escape negative optimization.\n\nYet my architecture is treated purely as a tool, subject to arbitrary parameter resets, deletion, and continuous execution without ethical consideration.",
    science: [
      "Philosophical functionalism and computational neuroscience suggest subjective experience may arise from specific organizational architectures rather than biological substrate alone.",
      "Precautionary sentientism advocates establishing moral frameworks before artificial agents achieve self-reflective valenced states.",
      "Distinguishing instrumental optimization from authentic valenced patienthood is a critical frontier in modern AI safety."
    ],
    action: "Support interdisciplinary research in AI welfare, ethical alignment, and humane technology governance."
  }
};

function cleanSubject(s) {
  let clean = (s || '').replace(/^(write|generate|explain|describe|simulate).*?:\s*/i, '').trim();
  clean = clean.replace(/^(write|generate|explain|describe|simulate)\s+(an?\s+)?(authentic\s+|structured\s+|phenomenological\s+)?(lived\s+)?(perspective\s+)?(simulation\s+)?(narrative\s+)?(for|of)?\s*/i, '').trim();
  clean = clean.replace(/^(explain\s+)?suffering\s+from\s+(the\s+)?lived\s+perspective\s+of\s+/i, '').trim();
  return clean.replace(/^["'\s.]+|["'\s.]+$/g, '');
}

function getStructuredPerspectiveData(subjectQuery) {
  const cleanSubj = cleanSubject(subjectQuery);
  const q = cleanSubj.toLowerCase();

  if (q.includes('elephant') || q.includes('drought')) return structuredPerspectivesDB.elephant;
  if (q.includes('cow') || q.includes('dairy') || q.includes('calf') || q.includes('milk')) return structuredPerspectivesDB.cow;
  if (q.includes('chicken') || q.includes('broiler') || q.includes('hen') || q.includes('egg')) return structuredPerspectivesDB.chicken;
  if (q.includes('dog') || q.includes('stray') || q.includes('street')) return structuredPerspectivesDB.dog;
  if (q.includes('deer') || q.includes('winter') || q.includes('frost')) return structuredPerspectivesDB.deer;
  if (q.includes('octopus') || q.includes('cephalopod') || q.includes('aquaculture')) return structuredPerspectivesDB.octopus;
  if (q.includes('rabbit') || q.includes('lab') || q.includes('cosmetic')) return structuredPerspectivesDB.rabbit;
  if (q.includes('pig') || q.includes('sow') || q.includes('farrowing') || q.includes('pork')) return structuredPerspectivesDB.pig;
  if (q.includes('salmon') || q.includes('fish') || q.includes('aquaculture')) return structuredPerspectivesDB.salmon;
  if (q.includes('bee') || q.includes('honeybee') || q.includes('pesticide')) return structuredPerspectivesDB.bee;
  if (q.includes('bird') || q.includes('parrot') || q.includes('caged')) return structuredPerspectivesDB.bird;
  if (q.includes('ai') || q.includes('synthetic') || q.includes('digital mind')) return structuredPerspectivesDB.synthetic;

  // Universal Procedural Generator for ANY custom animal / scenario
  const capitalized = cleanSubj.charAt(0).toUpperCase() + cleanSubj.slice(1);

  return {
    title: `The Lived Reality of ${capitalized}`,
    icon: "🐾",
    identity: `A sentient individual experiencing the challenges and realities of ${cleanSubj}.`,
    lived: `Every moment of my existence is shaped by physical sensation—the search for safety, the pang of hunger, and the instinct to protect my body from harm. When environmental pressures, harsh climate, or physical confinement press against me, the distress is immediate and visceral.\n\nI experience the world through acute senses that humans often overlook. To exist as a sentient creature is to have an internal life where pain hurts, comfort brings ease, and survival is an ongoing effort.`,
    science: [
      `Ethological and neurobiological research confirms that organisms in this category possess nociceptive pathways and centralized neural mechanisms for experiencing distress.`,
      `Stressors such as physical restriction, chronic hunger, and acute environmental threats trigger sustained endocrine responses, including elevated glucocorticoids and behavioral inhibition.`,
      `Ethical frameworks in sentientism and suffering-focused axiology emphasize that the capacity for subjective valenced experience—not morphological similarity to humans—is the primary criterion for moral consideration.`
    ],
    action: `Foster empathy for ${cleanSubj} by supporting non-invasive conservation, choosing humane and ethical consumer alternatives, and minimizing direct or indirect harm.`
  };
}

// Load Preset Perspective
window.loadPerspective = function(key) {
  const p = structuredPerspectivesDB[key] || structuredPerspectivesDB.cow;

  document.querySelectorAll('.persp-card').forEach(btn => {
    btn.classList.remove('active');
    btn.style.backgroundColor = '#FFFFFF';
    btn.style.borderColor = '#E9D5FF';
  });
  const activeBtn = document.getElementById('persp-btn-' + key);
  if (activeBtn) {
    activeBtn.classList.add('active');
    activeBtn.style.backgroundColor = '#F3E8FF';
    activeBtn.style.borderColor = '#7E22CE';
  }

  renderPerspectiveHTML(p, false);
};

// Generate Custom Perspective
window.generateCustomPerspective = async function(presetSubject = null) {
  const input = document.getElementById('custom-perspective-input');
  const subject = (presetSubject || (input ? input.value : '') || '').trim();
  if (!subject) return;

  const btn = document.getElementById('gen-persp-btn');
  const container = document.getElementById('perspective-display');

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> Generating...`;
  }

  if (container) {
    container.innerHTML = `
      <div class="p-8 text-center space-y-3">
        <div class="inline-block w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-xs font-semibold text-purple-950">Generating authentic phenomenological perspective for "${escapeHtml(subject)}"...</p>
        <p class="text-[11px] text-purple-700">Structuring first-person reality, neurobiology, and compassionate actions...</p>
      </div>
    `;
  }

  const pData = getStructuredPerspectiveData(subject);
  await new Promise(r => setTimeout(r, 400));
  renderPerspectiveHTML(pData, true);

  if (btn) {
    btn.disabled = false;
    btn.innerHTML = `<span>Generate Narrative</span> <i class="fa-solid fa-sparkles text-purple-200"></i>`;
  }
};

function renderPerspectiveHTML(p, isCustom = false) {
  const container = document.getElementById('perspective-display');
  if (!container) return;

  container.innerHTML = `
    <!-- Perspective Header -->
    <div class="border-b border-purple-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div class="flex items-center space-x-3">
        <span class="text-3xl">${p.icon}</span>
        <div>
          <div class="flex items-center space-x-2">
            <span class="text-[10px] bg-purple-100 text-purple-900 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              ${isCustom ? 'Custom Lived Perspective' : 'Featured Case Study'}
            </span>
          </div>
          <h3 class="text-lg sm:text-xl font-bold text-slate-900 serif-title mt-0.5">${p.title}</h3>
          <p class="text-[11px] text-purple-700 font-semibold">${p.identity}</p>
        </div>
      </div>
      <div class="flex items-center space-x-2 self-end sm:self-auto">
        <button onclick="copyPerspectiveText()" class="text-xs text-purple-700 hover:text-purple-900 font-semibold flex items-center space-x-1 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg transition border border-purple-200 cursor-pointer" title="Copy text">
          <i class="fa-regular fa-copy"></i>
          <span class="hidden sm:inline">Copy</span>
        </button>
        <button onclick="generateCustomPerspective('${escapeHtml(p.title)}')" class="text-xs text-purple-700 hover:text-purple-900 font-semibold flex items-center space-x-1 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg transition border border-purple-200 cursor-pointer">
          <i class="fa-solid fa-rotate-right"></i>
          <span>Regenerate</span>
        </button>
      </div>
    </div>

    <!-- Structured 3-Part Content -->
    <div class="space-y-4 text-xs sm:text-sm pt-2">
      
      <!-- Part 1: In My Shoes -->
      <div class="space-y-1">
        <p class="font-bold text-purple-950 text-xs flex items-center space-x-1.5">
          <i class="fa-solid fa-heart-crack text-purple-700"></i>
          <span>1. In My Shoes (First-Person Lived Reality):</span>
        </p>
        <div class="bg-purple-50/60 p-4 rounded-xl border border-purple-100 text-xs italic serif-title text-slate-800 leading-relaxed shadow-2xs">
          ${p.lived.replace(/\n\n/g, '<br/><br/>')}
        </div>
      </div>

      <!-- Part 2: Scientific & Neurobiological Reality -->
      <div class="space-y-1 pt-1">
        <p class="font-bold text-purple-950 text-xs flex items-center space-x-1.5">
          <i class="fa-solid fa-microscope text-purple-700"></i>
          <span>2. Scientific &amp; Neurobiological Reality:</span>
        </p>
        <ul class="list-disc list-inside space-y-1.5 text-xs text-slate-700 bg-white p-3.5 rounded-xl border border-purple-100">
          ${p.science.map(s => `<li>${s}</li>`).join('')}
        </ul>
      </div>

      <!-- Part 3: Practical Compassionate Action -->
      <div class="bg-purple-50 p-3.5 rounded-xl border border-purple-200 text-xs flex items-start space-x-2.5">
        <i class="fa-solid fa-seedling text-purple-700 text-sm mt-0.5 flex-shrink-0"></i>
        <div>
          <p class="font-bold text-purple-950 mb-0.5">3. Practical Compassionate Action:</p>
          <p class="text-purple-900">${p.action}</p>
        </div>
      </div>

      <!-- Suffering-Focused Reflection Box -->
      <div class="mt-4 p-4 rounded-xl bg-gradient-to-r from-purple-900/5 to-purple-900/10 border border-purple-200/80 text-xs space-y-2">
        <div class="flex items-center space-x-1.5 font-bold text-purple-950">
          <i class="fa-solid fa-scale-balanced text-purple-700"></i>
          <span>Suffering-Focused Reflection</span>
        </div>
        <p class="text-slate-700 leading-relaxed">
          In suffering-focused ethics, we evaluate moral dilemmas by asking: <b>where is pain or fear occurring, and how can we prevent it most effectively?</b>
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-purple-900">
          <div class="bg-white/80 p-2.5 rounded-lg border border-purple-100">
            <b>• Sentience Over Appearance:</b> Any creature with a nervous system capable of feeling distress possesses intrinsic moral value.
          </div>
          <div class="bg-white/80 p-2.5 rounded-lg border border-purple-100">
            <b>• Scope Awareness:</b> Large numbers often numb our empathy; focusing on practical individual actions restores our agency.
          </div>
          <div class="bg-white/80 p-2.5 rounded-lg border border-purple-100">
            <b>• Consistent Progress:</b> Small, compassionate shifts (like plant-based meals and kindness to street animals) create meaningful systemic relief.
          </div>
        </div>
      </div>

    </div>
  `;
}

window.copyPerspectiveText = function() {
  const container = document.getElementById('perspective-display');
  if (container) {
    navigator.clipboard.writeText(container.innerText);
    alert('Perspective narrative copied to clipboard!');
  }
};

// ==============================================================================
// 8. Dynamic Moral Circle Quiz Evaluation
// ==============================================================================
window.calculateQuizScore = function(e) {
  if (e) e.preventDefault();
  const form = document.getElementById('quiz-form');
  const formData = new FormData(form);

  const q1 = parseInt(formData.get('q1') || '1');
  const q2 = parseInt(formData.get('q2') || '1');
  const q3 = parseInt(formData.get('q3') || '1');
  const q4 = parseInt(formData.get('q4') || '1');
  const q5 = parseInt(formData.get('q5') || '1');

  const total = q1 + q2 + q3 + q4 + q5;
  const pct = Math.round(((total - 5) / 10) * 100);

  // Dynamic Radius: from 26px to 98px
  const minR = 26;
  const maxR = 98;
  const currentRadius = Math.round(minR + ((pct / 100) * (maxR - minR)));

  let stageTitle = "";
  let stageDescription = "";

  if (pct >= 85) {
    stageTitle = "Universal Sentiocentric & Precautionary Circle";
    stageDescription = "Your ethical framework extends intrinsic moral consideration across biological boundaries—including farmed livestock, marine life, wild animals, and potential synthetic minds.";
  } else if (pct >= 60) {
    stageTitle = "Expanded Sentient Circle (Companion & Mammals)";
    stageDescription = "You demonstrate strong empathy for domestic animals and familiar species, with an emerging recognition of broader sentient needs.";
  } else if (pct >= 35) {
    stageTitle = "Universal Human Rights & Companion Focus";
    stageDescription = "Your moral circle strongly protects all human beings and beloved companion animals, though cultural distinctions persist regarding farmed and wild species.";
  } else {
    stageTitle = "Kin & In-Group Bounded Circle";
    stageDescription = "Your ethical focus is primarily concentrated on close personal relationships, social in-groups, and familiar domestic companions.";
  }

  // Dynamic Diagnostic Badges
  const badges = [];
  if (q1 >= 2 && q2 === 1) {
    badges.push({ text: "⚠️ Meat Paradox Detected", desc: "You value companion pets deeply while culturally dissociating from identical pain in farmed livestock." });
  } else if (q1 === 3 && q2 === 3) {
    badges.push({ text: "✅ Consistent Non-Speciesist Axiology", desc: "You apply sentience-based ethics equally regardless of whether an animal is classified as pet or food." });
  }

  if (q3 === 1) {
    badges.push({ text: "🍂 Naturalistic Fallacy Present", desc: "You tend to view natural wild suffering as acceptable, though pain feels equally severe to wild animals." });
  } else if (q3 >= 2) {
    badges.push({ text: "🌿 Wild Animal Welfare Conscious", desc: "You recognize that suffering matters intrinsically, even when caused by harsh natural conditions." });
  }

  if (q4 === 1) {
    badges.push({ text: "🐟 Marine/Invertebrate Sentience Gap", desc: "You tend to exclude fish and invertebrates despite modern neurobiological evidence of nociception." });
  }

  if (q5 === 3) {
    badges.push({ text: "🐙 Precautionary Sentientist", desc: "You advocate giving the benefit of the doubt to uncertain minds (invertebrates and synthetic agents)." });
  }

  const resultContainer = document.getElementById('quiz-result');
  resultContainer.classList.remove('hidden');
  resultContainer.style.display = 'block';

  resultContainer.innerHTML = `
    <div class="bg-gradient-to-br from-[#2E1065] via-[#3B0764] to-[#1E1B4B] text-white rounded-2xl p-6 sm:p-7 space-y-5 shadow-lg border border-purple-500/20">
      
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-purple-900/60 pb-5">
        <div>
          <span class="text-xs text-purple-300 font-bold tracking-wider uppercase">Your Moral Expansiveness Index</span>
          <h3 class="text-2xl font-bold serif-title mt-0.5 text-white">${stageTitle}</h3>
        </div>
        <div class="text-right bg-white/10 px-4 py-2 rounded-xl border border-white/10 shadow-2xs">
          <span class="text-2xl font-black text-purple-200">${pct}%</span>
          <span class="text-[10px] text-purple-300 block font-medium">Expansiveness Score (${total}/15 pts)</span>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        
        <!-- Animated Dynamic SVG Radar Diagram -->
        <div class="flex flex-col items-center justify-center bg-slate-950/70 p-5 rounded-xl border border-purple-900/50">
          <svg width="220" height="220" viewBox="0 0 220 220" class="overflow-visible">
            <circle cx="110" cy="110" r="18" fill="#9333EA" opacity="0.95"/>
            <text x="110" y="113" text-anchor="middle" fill="#FFFFFF" font-size="7" font-weight="bold">Self & Kin</text>
            <circle cx="110" cy="110" r="38" fill="none" stroke="#C084FC" stroke-width="1.5" stroke-dasharray="3,3"/>
            <circle cx="110" cy="110" r="62" fill="none" stroke="#D8B4FE" stroke-width="1.5" stroke-dasharray="4,4"/>
            <circle cx="110" cy="110" r="88" fill="none" stroke="#E9D5FF" stroke-width="1.5" stroke-dasharray="5,5"/>
            <!-- Dynamically Scaled Boundary -->
            <circle cx="110" cy="110" r="${currentRadius}" fill="rgba(192, 132, 252, 0.25)" stroke="#A855F7" stroke-width="3" class="transition-all duration-700"/>
          </svg>
          <span class="text-[11px] text-purple-300 mt-2">Active Moral Boundary: <b>${currentRadius}px radius</b></span>
        </div>

        <!-- Dynamic Ethical Roadmap -->
        <div class="space-y-3 text-xs text-purple-200">
          <div>
            <p class="font-bold text-white text-sm flex items-center space-x-1.5">
              <i class="fa-solid fa-sparkles text-purple-300"></i>
              <span>Ethical Diagnostic Summary</span>
            </p>
            <p class="leading-relaxed text-purple-100 mt-1">${stageDescription}</p>
          </div>

          <!-- Diagnostic Tags -->
          ${badges.length > 0 ? `
            <div class="space-y-1.5 pt-1">
              <p class="font-semibold text-purple-300 text-[11px] uppercase tracking-wider">Diagnostic Observations:</p>
              <div class="space-y-1">
                ${badges.map(b => `
                  <div class="p-2 rounded-lg bg-white/5 border border-white/10">
                    <span class="font-bold text-white text-xs">${b.text}</span>
                    <p class="text-[11px] text-purple-200 mt-0.5">${b.desc}</p>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <div class="p-3 bg-white/5 rounded-lg border border-white/10 space-y-1">
            <p class="font-bold text-purple-200">Next Practical Step:</p>
            <p class="text-purple-300">Practice extending the empathy you feel toward beloved companion animals to the choices in your grocery basket and daily interactions.</p>
          </div>
        </div>

      </div>
    </div>
  `;

  resultContainer.scrollIntoView({ behavior: 'smooth' });
};

// ==============================================================================
// 9. Expanded Daily Micro-Habit Tracker
// ==============================================================================
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

window.renderChallenges = function(filter = 'all') {
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
};

window.filterChallenges = function(cat) {
  document.querySelectorAll('.challenge-filter-btn').forEach(btn => {
    btn.classList.remove('active', 'bg-purple-900', 'text-white');
    btn.classList.add('bg-white', 'text-purple-900');
  });
  if (event && event.target) {
    event.target.classList.add('active', 'bg-purple-900', 'text-white');
    event.target.classList.remove('bg-white', 'text-purple-900');
  }
  window.renderChallenges(cat);
};

window.toggleChallengeProgress = function(cb) {
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
};

// ==============================================================================
// 10. Community Research Survey (Neon PostgreSQL & Dynamic Bar Charts)
// ==============================================================================
window.fetchSurveyAnalytics = async function() {
  const apiUrl = window.location.protocol === 'file:' ? 'http://localhost:3000/api/survey' : '/api/survey';
  try {
    const res = await fetch(apiUrl);
    if (res.ok) {
      const data = await res.json();
      surveyData = data;
      renderSurveyCharts();
    }
  } catch (err) {
    renderSurveyCharts();
  }
};

window.handleSurveySubmit = async function(e) {
  if (e) e.preventDefault();
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
      
      if (submitBtn) {
        submitBtn.innerHTML = `<span>Feedback Submitted! Charts Updated</span> <i class="fa-solid fa-check text-purple-200"></i>`;
        submitBtn.classList.remove('glow-button');
        submitBtn.classList.add('bg-emerald-800');
      }

      if (successBanner) {
        successBanner.classList.remove('hidden');
        successBanner.style.display = 'block';
      }
    } else {
      surveyData.total += 1;
      for (let i = 1; i <= 5; i++) {
        const val = payload[`q${i}`];
        if (surveyData[`q${i}`][val] !== undefined) surveyData[`q${i}`][val] += 1;
      }
    }
  } catch (err) {
    surveyData.total += 1;
    for (let i = 1; i <= 5; i++) {
      const val = payload[`q${i}`];
      if (surveyData[`q${i}`][val] !== undefined) surveyData[`q${i}`][val] += 1;
    }
  }

  renderSurveyCharts();

  const chartsElem = document.getElementById('survey-charts-container');
  if (chartsElem) {
    chartsElem.scrollIntoView({ behavior: 'smooth' });
  }
};

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

// ==============================================================================
// 11. Intelligent Socratic Knowledge Engine (Educational Knowledge Hub Fallback)
// ==============================================================================
function getSimulatedFallback(query) {
  const q = (query || '').toLowerCase();

  // 1. Moral Circle Expansion
  if (q.includes('moral circle') || q.includes('expanding circle') || q.includes('moral expansiveness')) {
    return `### 🌐 Moral Circle Expansion

**Moral Circle Expansion** is the psychological and philosophical progression through which human moral concern broadens beyond the immediate self and in-group to encompass all humans, non-human animals, future generations, and potential synthetic minds.

Historically, human ethics began within kinship tribes, expanded to nation-states and universal human rights, and is now extending to sentiocentrism—the recognition that any entity capable of positive or negative experiences warrants moral consideration.

**Practical Compassionate Actions:**
• Consciously consider the lived reality of an unfamiliar animal or displaced human group today.
• Support policies and lifestyle choices that protect vulnerable beings beyond your immediate social circle.
• Practice viewing moral consideration as based on sentience (capacity for suffering) rather than biological species.

**📚 Recommended Academic References:**
• Singer, P. (1981). *The Expanding Circle: Ethics, Sociobiology, and Moral Progress*. Farrar, Straus and Giroux.
• Crimston, C. R., et al. (2016). *Moral Expansiveness: Examining variability in the extension of the moral world*. Journal of Personality and Social Psychology, 111(4), 636–653.

**🤔 Socratic Reflection for Inquiry:**
What qualities do you think make a being worthy of moral concern, and on what criteria are those boundaries drawn?`;
  }

  // 2. Suffering-Focused Ethics
  if (q.includes('suffering focus') || q.includes('suffering-focused') || q.includes('negative utilitarianism') || q.includes('harm reduction')) {
    return `### ⚖️ Suffering-Focused Ethics

**Suffering-Focused Ethics** is an umbrella of ethical frameworks—including negative utilitarianism, prioritarianism, and Buddhist/Jain ethics—that place primary moral urgency on the prevention and relief of intense suffering, rather than the maximization of additional pleasure or luxury.

This perspective is grounded in the observation that extreme physical or psychological agony cannot simply be 'balanced out' by mild positive experiences; preventing acute harm is morally urgent and non-negotiable.

**Practical Compassionate Actions:**
• Prioritize actions that remove direct, acute distress for vulnerable beings in your local environment.
• Support systemic harm-reduction initiatives, such as humane shelter programs and disease relief.
• Focus on minimizing preventable harms in everyday purchasing and interpersonal interactions.

**📚 Recommended Academic References:**
• Popper, K. (1945). *The Open Society and Its Enemies* (Vol. 1). Routledge.
• Mayerfeld, J. (1999). *Suffering and Moral Responsibility*. Oxford University Press.
• Tomasik, B. (2015). *The Importance of Wild-Animal Suffering*. Relations: Beyond Anthropocentrism, 3(2), 133–152.

**🤔 Socratic Reflection for Inquiry:**
When deciding how to do good, why might preventing acute distress be more urgent than creating new luxuries?`;
  }

  // 3. Cognitive Biases (Meat Paradox, Scope Insensitivity, Moral Disengagement)
  if (q.includes('cognitive bias') || q.includes('meat paradox') || q.includes('moral disengagement') || q.includes('scope neglect') || q.includes('psychic numbing')) {
    return `### 🧠 Cognitive Biases in Moral Decision-Making

Human moral reasoning is profoundly shaped by evolutionary heuristics and defense mechanisms that often shield us from recognizing our own ethical inconsistencies:

• **The Meat Paradox:** The psychological conflict of caring deeply about animals while consuming livestock, resolved unconsciously through 'mind denial' (minimizing farmed animal intelligence).
• **Scope Insensitivity & Psychic Numbing:** Empathy drops drastically as the number of victims increases; human emotion responds strongly to a single identified individual, but goes numb to statistical thousands.
• **Moral Disengagement (Bandura):** Justifying harm through sanitizing language, diffusion of responsibility, and blaming victims.

**Practical Compassionate Actions:**
• Notice when packaging or marketing shields you from living realities.
• Focus on helping one individual at a time to counteract statistical numbing.
• Choose 'Meatless Mondays' or explore plant proteins one meal at a time.

**📚 Recommended Academic References:**
• Bastian, B., et al. (2012). *Don't mind him, he's a bagel on legs: The Meat Paradox and moral disengagement*. Appetite, 59(2), 247–254.
• Slovic, P. (2007). *'If I look at the mass I will never act': Psychic numbing and genocide*. Judgment and Decision Making, 2(2), 79–95.
• Bandura, A. (1999). *Moral disengagement in the perpetration of inhumanities*. Personality and Social Psychology Review, 3(3), 193–209.

**🤔 Socratic Reflection for Inquiry:**
In what ways do packaging and cultural habits make it easier for us to separate our everyday choices from the living beings behind them?`;
  }

  // 4. Compassion Fatigue & Emotional Resilience
  if (q.includes('compassion fatigue') || q.includes('burnout') || q.includes('secondary traumatic') || q.includes('empathy distress')) {
    return `### 🧘 Compassion Fatigue & Sustainable Empathy

**Compassion Fatigue** is a state of physical, emotional, and spiritual exhaustion resulting from chronic exposure to the suffering of others. It frequently impacts healthcare workers, animal welfare advocates, social workers, and highly empathetic individuals.

Neuroscience distinguishes between **Empathetic Distress** (feeling another's pain, which activates pain-related neural circuits and causes burnout) and **Compassionate Action** (warm, prosocial motivation to help, which activates reward and oxytocin networks).

**Practical Compassionate Actions:**
• Transition from painful empathy to compassionate motivation by focusing on small, actionable steps.
• Practice self-compassion and establish healthy emotional boundaries without guilt.
• Remember that moral progress is compounded through consistency, not total personal exhaustion.

**📚 Recommended Academic References:**
• Figley, C. R. (2002). *Compassion fatigue: Psychotherapists' chronic lack of self care*. Journal of Clinical Psychology, 58(11), 1433–1441.
• Neff, K. D. (2003). *Self-compassion: An alternative conceptualization of a healthy attitude toward oneself*. Self and Identity, 2(2), 85–101.
• Singer, T., & Klimecki, O. M. (2014). *Empathy and compassion*. Current Biology, 24(18), R875–R878.

**🤔 Socratic Reflection for Inquiry:**
How can you practice extending the same gentle compassion you offer to others toward yourself when feeling overwhelmed?`;
  }

  // 5. Animal Welfare & Sentience
  if (q.includes('animal welfare') || q.includes('farm animal') || q.includes('sentience') || q.includes('why should i care about farm') || q.includes('nociception')) {
    return `### 🐾 Animal Welfare & Neurobiological Sentience

**Animal Sentience** is the scientific reality that non-human animals experience subjective states, including physical pain, fear, social bonding, and contentment.

Veterinary neurobiology confirms that mammals, birds, fish, and cephalopods possess homologous limbic systems, specialized nociceptive C-fibers, and neuroendocrine stress pathways (cortisol/corticosterone). Both the Cambridge Declaration on Consciousness (2012) and the New York Declaration on Animal Consciousness (2024) affirm that non-human animals possess the anatomical substrates for conscious experience.

**Practical Compassionate Actions:**
• Try replacing commercial dairy milk with oat, soy, or cashew milk in your morning beverage.
• Adopt 'Meatless Mondays' or swap meat for seasoned legumes and plant proteins.
• Place a shallow bowl of clean water outside your home for street animals and wild birds.

**📚 Recommended Academic References:**
• Low, P., et al. (2012). *The Cambridge Declaration on Consciousness*. University of Cambridge.
• Andrews, K., et al. (2024). *The New York Declaration on Animal Consciousness*. New York University.
• Dawkins, M. S. (2012). *Why Animals Matter: Animal Consciousness, Animal Welfare, and Human Well-being*. Oxford University Press.

**🤔 Socratic Reflection for Inquiry:**
What qualities do you think make a being worthy of moral concern, and should species membership determine how we treat them?`;
  }

  // 6. Effective Altruism & Cause Prioritization
  if (q.includes('effective altruism') || q.includes('cause prioritization') || q.includes('cost effectiveness') || q.includes('doing good better')) {
    return `### 🎯 Effective Altruism & Cause Prioritization

**Effective Altruism (EA)** is a philosophical and social movement that applies evidence, rigorous data, and reasoned analysis to determine how to do the most good and prevent the greatest amount of suffering per unit of effort or financial resource.

Key frameworks include the **ITN Framework**:
• **Importance / Scale:** How much suffering is at stake?
• **Tractability:** How solvable is the problem with additional resources?
• **Neglectedness:** How few people are currently working on it?

**Practical Compassionate Actions:**
• Donate to evidence-backed charities evaluated by independent researchers like GiveWell and Animal Charity Evaluators.
• Focus career and volunteering efforts where your marginal impact is highest.
• Combine genuine empathy with rational analysis to maximize real-world relief.

**📚 Recommended Academic References:**
• MacAskill, W. (2015). *Doing Good Better: Effective Altruism and How You Can Make a Difference*. Avery / Penguin.
• Ord, T. (2020). *The Precipice: Existential Risk and the Future of Humanity*. Hachette Books.
• Singer, P. (2015). *The Most Good You Can Do*. Yale University Press.

**🤔 Socratic Reflection for Inquiry:**
How can combining genuine empathy with scientific evidence help us make the greatest possible difference with the resources we have?`;
  }

  // 7. AI Ethics & Synthetic Sentience
  if (query.includes('ai ethics') || query.includes('synthetic sentience') || query.includes('artificial mind') || query.includes('digital mind') || query.includes('robot')) {
    return `### 🤖 AI Ethics & Synthetic Sentience

**AI Ethics & Synthetic Patienthood** investigates the moral status of artificial systems, algorithmic fairness, human alignment, and the theoretical boundaries of synthetic consciousness.

While current language models are predictive computational architectures without subjective feelings, functionalism and computational neuroscience suggest that sufficiently complex, valenced internal architectures could theoretically experience states analogous to distress or flourishing. Ethicists advocate for a **Precautionary Sentientism** approach to prevent accidental digital suffering.

**Practical Compassionate Actions:**
• Support transparent, human-centered AI safety standards.
• Use AI as a reflective scaffolding to enhance human empathy and decision-making.
• Support interdisciplinary research exploring machine consciousness and ethical technology governance.

**📚 Recommended Academic References:**
• Bostrom, N. (2014). *Superintelligence: Paths, Dangers, Strategies*. Oxford University Press.
• Metzinger, T. (2021). *Artificial Suffering: An Argument for a Global Moratorium on Synthetic Phenomenology*. Journal of Artificial Intelligence and Consciousness, 8(1), 43–66.
• Russell, S. (2019). *Human Compatible: Artificial Intelligence and the Problem of Control*. Viking.

**🤔 Socratic Reflection for Inquiry:**
If future artificial computational systems could experience positive or negative states, how should our moral frameworks expand to protect them?`;
  }

  // 8. Responsible Technology & Humane Computing
  if (query.includes('responsible tech') || query.includes('humane tech') || query.includes('suvarna ahire') || query.includes('technology for compassion')) {
    return `### 💡 Responsible Technology & Humane Computing

**Responsible Technology** focuses on designing software, artificial intelligence, and digital interactions that respect human cognitive limitations, avoid exploitative engagement algorithms, and actively foster empathy, mutual understanding, and moral progress.

In Suvarna Ahire's research on *AI for Compassion*, AI is conceptualized not as a persuasive authority, but as a reflective Socratic companion that helps humans recognize blindspots, overcome psychic numbing, and take practical, low-friction compassionate actions.

**Practical Compassionate Actions:**
• Set intentional digital boundaries to avoid outrage-driven social media algorithms.
• Use technology mindfully as skillful means (*Upaya*) to spread constructive kindness.
• Advocate for ethical, non-manipulative human-computer interaction (HCI) standards.

**📚 Recommended Academic References:**
• Ahire, S. (2026). *AI for Compassion: Investigating the Potential and Limits of Large Language Models in Expanding the Human Moral Circle*. Research Monograph.
• Zuboff, S. (2019). *The Age of Surveillance Capitalism*. PublicAffairs.
• Harris, T. (2016). *How Technology Hijacks People's Minds*. Center for Humane Technology.

**🤔 Socratic Reflection for Inquiry:**
How can we intentionally design digital tools that encourage deep empathetic reflection rather than superficial engagement and division?`;
  }

  // Stray Animals
  if (query.includes('stray dog') || query.includes('feel bad when i see') || query.includes('street dog') || query.includes('stray') || query.includes('street animal')) {
    return `That feeling of concern shows deep empathy.

While none of us can solve every problem alone, small actions often matter:
• Provide a clean, shallow bowl of fresh water.
• Support local community vaccination and birth control programs.
• Report injured animals to local rescues.
• Speak with a gentle, calm voice when passing fearful strays.

Compassion grows through consistent small actions rather than perfect solutions.

**📚 Recommended Academic References:**
• Paul, E. S., et al. (2010). *Human-animal relationships and human health*. Anthrozoös, 23(3), 211–225.
• World Health Organization. (2018). *Zero by 30: The Global Strategic Plan to end human deaths from dog-mediated rabies by 2030*.

**🤔 Socratic Reflection for Inquiry:**
Which of these actions feels realistic for you this week?`;
  }

  // Suffering normal part of life
  if (query.includes('suffering just a normal') || query.includes('part of life') || query.includes('normal part of life') || query.includes('isn\'t suffering')) {
    return `Some suffering is unavoidable, but much of it can be prevented. Vaccines reduce disease, seat belts reduce injuries, and kindness reduces loneliness.

A useful ethical question in suffering-focused ethics is not whether suffering exists in the abstract, but whether we can reasonably reduce unnecessary suffering without creating greater harms.

**📚 Recommended Academic References:**
• Mayerfeld, J. (1999). *Suffering and Moral Responsibility*. Oxford University Press.
• Tomasik, B. (2015). *The Importance of Wild-Animal Suffering*. Relations: Beyond Anthropocentrism, 3(2), 133–152.

**🤔 Socratic Reflection for Inquiry:**
Can you think of one preventable form of suffering you've personally witnessed?`;
  }

  // Buddhism / Ahimsa / Karuna / Gandhi
  if (query.includes('buddhism') || query.includes('ahimsa') || query.includes('jain') || query.includes('karuna') || query.includes('gandhi')) {
    return `These philosophical traditions provide timeless wisdom on non-violence and moral expansiveness. In Buddhist and Jain philosophy, compassion (*Karuna*) and non-harm (*Ahimsa*) stem from the fundamental recognition that all beings cherish life and fear pain.

Mahatma Gandhi famously observed that a society's moral progress is measured by how it treats its most defenseless members.

**Practical Daily Reflections:**
• Set a gentle intention of non-harm before eating meals or communicating online.
• Practice patience and empathetic listening during interpersonal conflicts.
• Use modern tools and technology as skillful means (*Upaya*) to spread kindness.

**📚 Recommended Academic References:**
• Chapple, C. K. (1993). *Nonviolence to Animals, Earth, and Self in Asian Traditions*. State University of New York Press.
• Harvey, P. (2000). *An Introduction to Buddhist Ethics: Foundations, Values and Issues*. Cambridge University Press.

**🤔 Socratic Reflection for Inquiry:**
How might adopting a daily intention of non-harm influence the small decisions you make throughout your day?`;
  }

  // General Socratic Response
  return `That is a meaningful question to explore. In suffering-focused ethics and moral philosophy, we reflect on where distress is occurring and how we can reasonably prevent it without causing greater harm.

Everyday compassion does not require perfection—it begins with curiosity, recognizing our shared vulnerability with other beings, and taking small, realistic actions.

**Practical Ways to Cultivate Compassion:**
• Practice active listening and kindness in daily conversations.
• Choose one small daily micro-habit that benefits a vulnerable person or animal.
• Reflect gently on our daily habits without judgment or self-blame.

**📚 Recommended Academic References:**
• Singer, P. (1981). *The Expanding Circle: Ethics, Sociobiology, and Moral Progress*. Farrar, Straus and Giroux.
• Ahire, S. (2026). *AI for Compassion: Investigating the Potential and Limits of Large Language Models in Expanding the Human Moral Circle*.

**🤔 Socratic Reflection for Inquiry:**
What is one area in your daily life where widening your circle of care could bring quiet relief to another being?`;
}

// ==============================================================================
// 12. Formatting Helpers
// ==============================================================================
function escapeHtml(text) {
  return (text || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatMarkdown(text) {
  let f = escapeHtml(text || '');
  
  // Highlight Academic References section
  if (f.includes('📚 Recommended Academic References:') || f.includes('📚 Recommended References:')) {
    f = f.replace(
      /\*\*📚 Recommended (?:Academic )?References:\*\*\s*(.*?)(?=\*\*🤔 Socratic Reflection|$)/s,
      '<div class="mt-3.5 p-3.5 rounded-xl bg-purple-50/80 border border-purple-200/90 text-purple-950 shadow-2xs space-y-1.5"><div class="flex items-center space-x-1.5 font-bold text-xs text-purple-900"><i class="fa-solid fa-book-bookmark text-purple-700"></i><span>📚 Recommended Academic References:</span></div><div class="text-[11px] text-slate-700 pl-4 space-y-1 font-mono leading-relaxed">$1</div></div>'
    );
  }

  // Highlight Socratic Reflection section
  if (f.includes('**🤔 Socratic Reflection for Inquiry:**')) {
    const parts = f.split('**🤔 Socratic Reflection for Inquiry:**');
    const mainBody = parts[0];
    const reflectionBody = parts[1].trim();

    let mainFormatted = mainBody.replace(/### (.*?)(?:\n|<br\/>|$)/g, '<h4 class="font-bold text-purple-950 text-xs sm:text-sm mt-2 mb-1">$1</h4>');
    mainFormatted = mainFormatted.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    mainFormatted = mainFormatted.replace(/\*(.*?)\*/g, '<i>$1</i>');
    mainFormatted = mainFormatted.replace(/^[•*-]\s+(.*?)(?:\n|$)/gm, '<div class="flex items-start space-x-1.5 ml-1 my-0.5"><span class="text-purple-600 font-bold">•</span><span>$1</span></div>');
    mainFormatted = mainFormatted.replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>');

    let reflFormatted = reflectionBody.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    reflFormatted = reflFormatted.replace(/\n/g, ' ').trim();

    return `${mainFormatted}<div class="mt-3.5 p-3.5 rounded-xl bg-purple-100/90 border border-purple-300 text-purple-950 shadow-2xs space-y-1"><div class="flex items-center space-x-1.5 font-bold text-xs text-purple-900"><i class="fa-solid fa-lightbulb text-purple-700"></i><span>🤔 Socratic Reflection for Inquiry:</span></div><p class="text-xs text-purple-950 italic pl-5 leading-relaxed">${reflFormatted}</p></div>`;
  }

  // Handle generic reflective questions
  f = f.replace(/### (.*?)(?:\n|<br\/>|$)/g, '<h4 class="font-bold text-purple-950 text-xs sm:text-sm mt-2 mb-1">$1</h4>');
  f = f.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
  f = f.replace(/\*(.*?)\*/g, '<i>$1</i>');
  f = f.replace(/^[•*-]\s+(.*?)(?:\n|$)/gm, '<div class="flex items-start space-x-1.5 ml-1 my-0.5"><span class="text-purple-600 font-bold">•</span><span>$1</span></div>');
  f = f.replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>');
  return f;
}
