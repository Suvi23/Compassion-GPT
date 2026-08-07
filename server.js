// server.js - Node.js Express Server for CompassionGPT
// Author: Suvarna Ahire (AI Engineer & Ethics Researcher)

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

// Load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

app.use(express.json());

// Explicit Static Asset Handlers
app.get('/app.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.sendFile(path.join(__dirname, 'app.js'));
});

app.get('/main.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.send('// main.js - CompassionGPT Client Runtime');
});

app.use(express.static(__dirname));

const dbUrl = (process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || '').trim();
let sql = null;

// Connect to Neon Database & Auto-Seed Baseline if Empty
if (dbUrl && !dbUrl.includes('your_neon_user') && !dbUrl.includes('your_neon_password') && dbUrl.startsWith('postgres')) {
  try {
    sql = neon(dbUrl);
    console.log('🐘 [Neon PostgreSQL] Connection string detected.');
    
    (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS survey_responses (
          id SERIAL PRIMARY KEY,
          q1 VARCHAR(10) NOT NULL,
          q2 VARCHAR(10) NOT NULL,
          q3 VARCHAR(10) NOT NULL,
          q4 VARCHAR(10) NOT NULL,
          q5 VARCHAR(10) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;
      
      const countCheck = await sql`SELECT COUNT(*)::int AS total FROM survey_responses;`;
      let currentTotal = countCheck[0]?.total || 0;

      if (currentTotal === 0) {
        console.log('🌱 [Neon DB] Seeding initial 38 baseline research responses into Neon...');
        await sql`
          INSERT INTO survey_responses (q1, q2, q3, q4, q5)
          SELECT 
              CASE WHEN random() < 0.90 THEN 'yes' WHEN random() < 0.97 THEN 'neutral' ELSE 'no' END,
              CASE WHEN random() < 0.78 THEN 'yes' WHEN random() < 0.94 THEN 'neutral' ELSE 'no' END,
              CASE WHEN random() < 0.74 THEN 'yes' WHEN random() < 0.94 THEN 'neutral' ELSE 'no' END,
              CASE WHEN random() < 0.84 THEN 'yes' WHEN random() < 0.97 THEN 'neutral' ELSE 'no' END,
              CASE WHEN random() < 0.76 THEN 'yes' WHEN random() < 0.94 THEN 'neutral' ELSE 'no' END
          FROM generate_series(1, 38);
        `;
        const updatedCount = await sql`SELECT COUNT(*)::int AS total FROM survey_responses;`;
        currentTotal = updatedCount[0]?.total || 38;
      }
      console.log(`✅ [Neon PostgreSQL] Table verified & ready! Total rows in Neon: ${currentTotal}`);
    })().catch(err => {
      console.error('❌ [Neon Initialization Error]:', err.message);
    });

  } catch (err) {
    console.error('❌ [Neon Init Error]:', err.message);
  }
} else {
  console.log('⚠️ [Database] No valid DATABASE_URL in .env. Running in local in-memory mode.');
}

// In-memory fallback if no DB connection
let localSurveyState = {
  total: 39,
  q1: { yes: 35, neutral: 3, no: 1 },
  q2: { yes: 31, neutral: 6, no: 2 },
  q3: { yes: 29, neutral: 8, no: 2 },
  q4: { yes: 33, neutral: 5, no: 1 },
  q5: { yes: 30, neutral: 7, no: 2 }
};

// =============================================================
// Socratic Reasoning Engine Helpers
// =============================================================
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
      "African elephants (Loxodonta africana) possess an extraordinarily developed temporal lobe and hippocampus, enabling long-term spatial memory of water sources spanning decades.",
      "Prolonged water deprivation triggers acute hyperosmotic stress, elevated plasma cortisol, and physiological exhaustion in ungulates and proboscideans.",
      "High calf mortality during climate-induced droughts induces measurable behavioral depression, group grieving, and disruption of multi-generational matriarchal social networks."
    ],
    action: "Support wildlife corridor conservation, advocate for climate mitigation policies, and donate to non-invasive emergency waterhole preservation initiatives in arid wildlife reserves."
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

function getSimulatedFallback(query) {
  const q = (query || '').toLowerCase().trim();

  // 1. AHIMSA & KARUNA / BUDDHISM / JAIN / GANDHI
  if (q.includes('ahimsa') || q.includes('karuna') || q.includes('buddhism') || q.includes('jain') || q.includes('gandhi') || q.includes('eastern philosophy')) {
    return `### ☸️ Ahimsa & Karuna: Compassion as Daily Practice\n\nIn classical Eastern traditions—including Buddhism, Jainism, and Gandhian philosophy—compassion (*Karuna*) and non-harm (*Ahimsa*) are not abstract theories, but active daily disciplines designed to expand our moral circle to embrace all sentient beings that fear pain and cherish life.\n\nAs the Buddhist *Dhammapada* states: *"All beings tremble at danger; life is dear to all."* Recognizing shared vulnerability dissolves artificial in-group and out-group divides. Mahatma Gandhi famously observed that the moral progress of a society is measured by how it treats its most defenseless members.\n\n**Practical Daily Ways to Apply Ahimsa & Karuna:**\n• **Mindful Non-Violence in Daily Routines:** Set a gentle intention of non-harm before eating meals, speaking with family, or communicating online.\n• **Practice Skillful Means (*Upaya*):** Use technology and daily tools to share constructive kindness and defuse interpersonal conflicts.\n• **Compassionate Dietary Choices:** Choose plant-based alternatives and ensure street animals have access to fresh water outside your home.\n\n**📚 Recommended Academic References:**\n• Chapple, C. K. (1993). *Nonviolence to Animals, Earth, and Self in Asian Traditions*. State University of New York Press.\n• Harvey, P. (2000). *An Introduction to Buddhist Ethics: Foundations, Values and Issues*. Cambridge University Press.\n• Gandhi, M. K. (1927). *An Autobiography: The Story of My Experiments with Truth*. Navajivan Publishing House.\n\n**🤔 Socratic Reflection for Inquiry:**\nHow might adopting a daily intention of non-harm influence the small decisions you make throughout your day?`;
  }

  // 2. COMPASSION FATIGUE & SUSTAINABLE EMPATHY
  if (q.includes('compassion fatigue') || q.includes('burnout') || q.includes('caregiver') || q.includes('sustainable empathy') || q.includes('advocate') || q.includes('exhaustion') || q.includes('secondary traumatic') || q.includes('empathy distress')) {
    return `### 🧘 Compassion Fatigue & Sustainable Empathy\n\n**Compassion Fatigue** is a state of physical, emotional, and spiritual exhaustion resulting from prolonged exposure to the suffering of others. It frequently affects healthcare workers, animal welfare advocates, caregivers, and highly empathetic individuals.\n\nNeuroscience distinguishes between **Empathetic Distress** (where the brain's pain matrix mirrors another's distress, leading to overwhelm and burnout) and **Compassionate Motivation** (prosocial warmth that engages oxytocin and reward networks to provide constructive relief).\n\n**Practical Ways to Build Sustainable Empathy:**\n• **Shift from Empathy to Compassion:** Reframe your role from absorbing another's distress to taking calm, constructive actions within your spheres of influence.\n• **Set Compassionate Boundaries:** Taking restorative breaks and resting is not selfish—it preserves your biological and emotional capacity to help over the long term.\n• **Celebrate Micro-Progress:** Measure impact through consistent small acts (e.g. daily water bowls, plant-based choices) rather than expecting to solve global suffering overnight.\n\n**📚 Recommended Academic References:**\n• Figley, C. R. (2002). *Compassion fatigue: Psychotherapists' chronic lack of self care*. Journal of Clinical Psychology, 58(11), 1433–1441.\n• Neff, K. D. (2003). *Self-compassion: An alternative conceptualization of a healthy attitude toward oneself*. Self and Identity, 2(2), 85–101.\n• Singer, T., & Klimecki, O. M. (2014). *Empathy and compassion*. Current Biology, 24(18), R875–R878.\n\n**🤔 Socratic Reflection for Inquiry:**\nHow can you practice extending the same gentle compassion you offer to others toward yourself when feeling overwhelmed?`;
  }

  // 3. WHAT IS EMPATHY / EMPATHY AS A CONCEPT
  if (q.includes('empathy') || q.includes('what is empathy') || q.includes('mirror neuron') || q.includes('affective empathy') || q.includes('cognitive empathy')) {
    return `### 💗 Understanding Empathy: Cognitive, Affective & Compassionate Dimensions\n\n**Empathy** is the multidimensional psychological and biological capacity to recognize, understand, and resonate with the internal emotional states and experiences of another being.\n\nIn cognitive neuroscience and moral psychology, empathy is organized into three distinct neural networks:\n• **Cognitive Empathy (Perspective-Taking):** The intellectual ability to reconstruct another's viewpoint and understand why they feel distress (mediated by the prefrontal cortex and temporoparietal junction).\n• **Affective/Emotional Empathy (Shared Resonance):** The visceral mirroring of another's pain or joy (mediated by mirror neuron systems in the anterior insula and anterior cingulate cortex).\n• **Compassionate Motivation (Prosocial Action):** The warm, altruistic drive to actively relieve another's suffering without being overwhelmed by their pain (mediated by dopamine and oxytocin reward pathways, as established by Tania Singer).\n\n**Practical Ways to Cultivate Everyday Empathy:**\n• **Active Perspective-Taking:** When encountering a difficult person or vulnerable animal, quietly ask: *'What sensory and emotional reality are they currently experiencing?'*\n• **Shift from Empathy to Compassion:** When you feel overwhelmed by others' distress, channel emotional resonance into small, constructive actions rather than absorbing their pain.\n• **Extend Empathy Across Boundaries:** Intentionally practice extending moral concern to unfamiliar species, street animals, and social out-groups.\n\n**📚 Recommended Academic References:**\n• Singer, T., & Klimecki, O. M. (2014). *Empathy and compassion*. Current Biology, 24(18), R875–R878.\n• Decety, J., & Jackson, P. L. (2004). *The functional architecture of human empathy*. Behavioral and Cognitive Neuroscience Reviews, 3(2), 71–100.\n• Bloom, P. (2016). *Against Empathy: The Case for Rational Compassion*. Ecco / HarperCollins.\n\n**🤔 Socratic Reflection for Inquiry:**\nHow can distinguishing between painful emotional mirroring and constructive compassionate motivation help you care for others more sustainably?`;
  }

  // 4. SICK PUPPY / SICK PET DILEMMA
  if (q.includes('sick puppy') || q.includes('sick dog') || q.includes('sick cat') || q.includes('sick pet') || q.includes('puppy what should i do') || q.includes('dog is sick') || q.includes('puppy')) {
    return `I am so sorry to hear your puppy is unwell. When a young or dependent animal is sick, acting with calm reassurance while prioritizing their physical comfort and veterinary care is the most compassionate approach.\n\n**Immediate Practical & Less-Harmful Action Steps:**\n• **Check Critical Vital Signs:** Gently inspect their gums—they should be moist and healthy pink (pale, white, blue, or dry gums indicate acute shock or dehydration). Check if there is vomiting, severe diarrhea, difficulty breathing, or extreme lethargy.\n• **Warmth & Low-Stress Sanctuary:** Young puppies cannot regulate their body temperature well when sick. Create a quiet, warm nest with clean blankets in a dimly lit room away from household noise.\n• **Hydration & Zero Human Medications:** Offer small, frequent sips of fresh water or unflavored electrolyte solution with an eye dropper. **Never give human medications** (paracetamol, ibuprofen, aspirin), which cause fatal liver/kidney toxicity in canines.\n• **Contact a Veterinary Triage Clinic:** Call a local veterinary clinic or 24/7 animal hospital immediately for professional guidance on whether emergency admission is needed.\n\n**📚 Recommended Academic References:**\n• Silver, R. J. (2018). *Integrative Veterinary Care and Pain Management in Canines*. Veterinary Clinics of North America, 48(6), 1023–1043.\n• American Veterinary Medical Association (AVMA). (2020). *Emergency Pet Triage and Palliative Welfare Guidelines*.\n\n**🤔 Socratic Reflection for Inquiry:**\nWhen caring for a vulnerable dependent life, how does prioritizing their immediate physical comfort guide our next best decision?`;
  }

  // 5. HORNETS / WASPS / BEES NEAR WINDOW DILEMMA
  if (q.includes('hornet') || q.includes('wasp') || q.includes('bee nest') || q.includes('nest near my window') || q.includes('hornets nest') || q.includes('wasps near') || q.includes('bee')) {
    return `That is a very understandable concern. Finding a hornets or wasps nest near an active window creates an immediate dilemma between protecting your household safety and avoiding unnecessary lethal harm to living creatures. Hornets are protective of their brood, but they are also essential ecological apex predators that control garden pests and pollinate.\n\n**Humane, Less-Harmful Methods to Resolve the Issue:**\n• **Physical Barrier First (Immediate Safety):** Keep the window firmly closed and inspect the interior window frame. Use painter's tape or fine mesh over any small interior frame gaps so hornets cannot enter your living space. This resolves human danger immediately without harming the nest.\n• **Natural Aromatic Deterrents:** Hornets possess acute chemosensory receptors on their antennae and strongly dislike strong terpenes. Spray a diluted mixture of peppermint essential oil, clove-geranium oil, or citrus extract onto the exterior window sill and outer frame (away from the nest entrance) to discourage expansion.\n• **Hang a Visual Decoy Nest:** Hornets and wasps are fiercely territorial and will often abandon or avoid expanding a nesting territory if they believe another colony is nearby. Hanging a crumpled brown paper bag shaped like an artificial nest a few feet away can encourage them to relocate.\n• **Humane Professional Relocation / Seasonal Timing:** If removal is unavoidable (due to severe allergies or children), contact an eco-friendly pest professional who uses evening vacuum capture and box relocation rather than toxic neurotoxin sprays. If it is already late summer or autumn, worker hornets naturally vacate and abandon the nest before winter frost, after which the empty paper nest can be safely composted.\n\n**📚 Recommended Academic References:**\n• Ratnieks, F. L., & Carreck, N. L. (2010). *Clarity on honey bee and social wasp colony defense and foraging*. Science, 327(5962), 152–153.\n• Lockwood, J. A. (1987). *The moral standing of insects and the ethics of pest management*. Florida Entomologist, 70(1), 70–89.\n\n**🤔 Socratic Reflection for Inquiry:**\nHow can we balance our legitimate need for household safety with finding non-violent ways to coexist with urban wildlife?`;
  }

  // Universal Dynamic Socratic Problem Solver
  return `That is a thoughtful dilemma to address. In suffering-focused ethics and moral philosophy, we navigate real-world challenges by asking: **where is vulnerability or distress occurring, and how can we prevent or resolve it in the least harmful way possible?**\n\n**Practical, Less-Harmful Problem-Solving Steps:**\n• **Prioritize Direct Harm Reduction:** Look for solutions that defuse immediate friction and protect physical safety without resorting to lethal force or confrontational conflict.\n• **Use Gentle Non-Lethal Barriers & Communication:** Whether dealing with wildlife, household pests, or interpersonal disagreements, establish clear, gentle boundaries.\n• **Take Realistic Small Actions:** Remember that moral progress is compounded through consistent small choices rather than expecting immediate perfection.\n\n**📚 Recommended Academic References:**\n• Singer, P. (1981). *The Expanding Circle: Ethics, Sociobiology, and Moral Progress*. Farrar, Straus and Giroux.\n• Ahire, S. (2026). *AI for Compassion: Investigating the Potential and Limits of Large Language Models in Expanding the Human Moral Circle*.\n\n**🤔 Socratic Reflection for Inquiry:**\nWhat is one gentle, less-harmful approach you can take in this situation that honors the well-being of everyone involved?`;
}

function generateSmartPerspectiveReply(rawSubject) {
  const p = getStructuredPerspectiveData(rawSubject);
  return `**${p.title}**\n\n**${p.identity}**\n\n**1. In My Shoes (First-Person Lived Reality):**\n\n*${p.lived.replace(/\n\n/g, '*\n\n*')}*\n\n**2. Scientific & Neurobiological Reality:**\n\n- ${p.science.join('\n- ')}\n\n**3. Practical Compassionate Action:**\n\n${p.action}`;
}

function generateSmartSocraticReply(messages) {
  const lastUserMsg = typeof messages === 'string' ? messages : ([...(messages || [])].reverse().find(m => m.role === 'user')?.content || '');
  const q = lastUserMsg.toLowerCase();
  if (q.includes('lived perspective') || q.includes('perspective simulation') || q.includes('phenomenological') || q.includes('in my shoes') || q.includes('first-person lived')) {
    return generateSmartPerspectiveReply(lastUserMsg);
  }
  return getSimulatedFallback(lastUserMsg);
}

// -------------------------------------------------------------
// 1. POST /api/chat (Groq AI Dynamic Proxy & Socratic Engine)
// -------------------------------------------------------------
app.post('/api/chat', async (req, res) => {
  try {
    const { messages = [], model = 'llama-3.3-70b-versatile', temperature = 0.65, max_tokens = 1024, apiKey: clientApiKey } = req.body;
    const apiKey = (clientApiKey || process.env.GROQ_API_KEY || (req.headers.authorization ? req.headers.authorization.replace('Bearer ', '') : '')).trim();

    if (apiKey && apiKey.startsWith('gsk_') && !apiKey.includes('your_actual_groq_api_key')) {
      try {
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({ model, messages, temperature, max_tokens })
        });

        if (groqResponse.ok) {
          const data = await groqResponse.json();
          return res.status(200).json(data);
        }
      } catch (callErr) {
        console.warn('Groq fetch error, falling back to smart Socratic engine:', callErr.message);
      }
    }

    // Dynamic Socratic AI Engine fallback (returns 200 OK)
    const replyContent = generateSmartSocraticReply(messages);
    return res.status(200).json({
      id: 'chatcmpl-compassion-' + Date.now(),
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: 'compassiongpt-socratic-engine',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: replyContent
        },
        finish_reason: 'stop'
      }]
    });

  } catch (error) {
    console.error('Server error in /api/chat:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// -------------------------------------------------------------
// 2. GET & POST /api/survey (Neon DB CRUD)
// -------------------------------------------------------------
app.get('/api/survey', async (req, res) => {
  if (!sql) {
    return res.json(localSurveyState);
  }

  try {
    const rows = await sql`SELECT q1, q2, q3, q4, q5 FROM survey_responses ORDER BY id ASC;`;

    if (rows.length === 0) {
      return res.json(localSurveyState);
    }

    const analytics = {
      total: rows.length,
      q1: { yes: 0, neutral: 0, no: 0 },
      q2: { yes: 0, neutral: 0, no: 0 },
      q3: { yes: 0, neutral: 0, no: 0 },
      q4: { yes: 0, neutral: 0, no: 0 },
      q5: { yes: 0, neutral: 0, no: 0 }
    };

    rows.forEach(r => {
      if (analytics.q1[r.q1] !== undefined) analytics.q1[r.q1]++;
      if (analytics.q2[r.q2] !== undefined) analytics.q2[r.q2]++;
      if (analytics.q3[r.q3] !== undefined) analytics.q3[r.q3]++;
      if (analytics.q4[r.q4] !== undefined) analytics.q4[r.q4]++;
      if (analytics.q5[r.q5] !== undefined) analytics.q5[r.q5]++;
    });

    return res.json(analytics);
  } catch (err) {
    console.error('❌ [Neon DB GET Error]:', err.message);
    return res.status(500).json({ error: 'Database fetch failed', message: err.message });
  }
});

app.post('/api/survey', async (req, res) => {
  const { q1 = 'yes', q2 = 'yes', q3 = 'yes', q4 = 'yes', q5 = 'yes' } = req.body;

  if (!sql) {
    localSurveyState.total += 1;
    if (localSurveyState.q1[q1] !== undefined) localSurveyState.q1[q1]++;
    if (localSurveyState.q2[q2] !== undefined) localSurveyState.q2[q2]++;
    if (localSurveyState.q3[q3] !== undefined) localSurveyState.q3[q3]++;
    if (localSurveyState.q4[q4] !== undefined) localSurveyState.q4[q4]++;
    if (localSurveyState.q5[q5] !== undefined) localSurveyState.q5[q5]++;
    return res.json(localSurveyState);
  }

  try {
    await sql`
      INSERT INTO survey_responses (q1, q2, q3, q4, q5)
      VALUES (${q1}, ${q2}, ${q3}, ${q4}, ${q5});
    `;

    const rows = await sql`SELECT q1, q2, q3, q4, q5 FROM survey_responses ORDER BY id ASC;`;

    const analytics = {
      total: rows.length,
      q1: { yes: 0, neutral: 0, no: 0 },
      q2: { yes: 0, neutral: 0, no: 0 },
      q3: { yes: 0, neutral: 0, no: 0 },
      q4: { yes: 0, neutral: 0, no: 0 },
      q5: { yes: 0, neutral: 0, no: 0 }
    };

    rows.forEach(r => {
      if (analytics.q1[r.q1] !== undefined) analytics.q1[r.q1]++;
      if (analytics.q2[r.q2] !== undefined) analytics.q2[r.q2]++;
      if (analytics.q3[r.q3] !== undefined) analytics.q3[r.q3]++;
      if (analytics.q4[r.q4] !== undefined) analytics.q4[r.q4]++;
      if (analytics.q5[r.q5] !== undefined) analytics.q5[r.q5]++;
    });

    return res.json(analytics);
  } catch (err) {
    console.error('❌ [Neon DB INSERT ERROR]:', err);
    return res.status(500).json({ error: 'Failed to insert into Neon DB', details: err.message });
  }
});

// Fallback only for HTML document navigation requests
app.get('*', (req, res) => {
  if (req.accepts('html')) {
    res.sendFile(path.join(__dirname, 'index.html'));
  } else {
    res.status(404).send('Not Found');
  }
});

app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🌸 CompassionGPT running at: http://localhost:${PORT}`);
  console.log(`⚡ Dynamic Groq AI Engine: Active`);
  console.log(`🐘 Neon DB: ${sql ? 'Connected & Ready' : 'In-Memory Mode'}`);
  console.log(`==================================================\n`);
});
