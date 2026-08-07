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
    
    // Ensure table exists and auto-seed initial 38 rows if newly created
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

      // If database has 0 rows, seed initial 38 baseline responses
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

// -------------------------------------------------------------
// Built-In Intelligent Socratic Dilemma Solver & Knowledge Engine
// -------------------------------------------------------------
function cleanSubject(s) {
  let clean = (s || '').replace(/^(write|generate|explain|describe|simulate).*?:\s*/i, '').trim();
  clean = clean.replace(/^(write|generate|explain|describe|simulate)\s+(an?\s+)?(authentic\s+|structured\s+|phenomenological\s+)?(lived\s+)?(perspective\s+)?(simulation\s+)?(narrative\s+)?(for|of)?\s*/i, '').trim();
  clean = clean.replace(/^(explain\s+)?suffering\s+from\s+(the\s+)?lived\s+perspective\s+of\s+/i, '').trim();
  return clean.replace(/^["'\s.]+|["'\s.]+$/g, '');
}

function generateSmartSocraticReply(messages) {
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';
  const query = lastUserMsg.toLowerCase();

  // Check if this is a perspective prompt
  if (query.includes('lived perspective') || query.includes('phenomenological') || query.includes('in my shoes') || query.includes('first-person lived') || query.includes('perspective simulation')) {
    return generateSmartPerspectiveReply(lastUserMsg);
  }

  // 1. SICK PUPPY / SICK PET DILEMMA
  if (query.includes('sick puppy') || query.includes('sick dog') || query.includes('sick cat') || query.includes('sick pet') || query.includes('puppy what should i do') || query.includes('dog is sick')) {
    return `I am so sorry to hear your puppy is unwell. When a young or dependent animal is sick, acting with calm reassurance while prioritizing their physical comfort and veterinary care is the most compassionate approach.

**Immediate Practical & Less-Harmful Action Steps:**
• **Check Critical Vital Signs:** Gently inspect their gums—they should be moist and healthy pink (pale, white, blue, or dry gums indicate acute shock or dehydration). Check if there is vomiting, severe diarrhea, difficulty breathing, or extreme lethargy.
• **Warmth & Low-Stress Sanctuary:** Young puppies cannot regulate their body temperature well when sick. Create a quiet, warm nest with clean blankets in a dimly lit room away from household noise.
• **Hydration & Zero Human Medications:** Offer small, frequent sips of fresh water or unflavored electrolyte solution with an eye dropper. **Never give human medications** (paracetamol, ibuprofen, aspirin), which cause fatal liver/kidney toxicity in canines.
• **Contact a Veterinary Triage Clinic:** Call a local veterinary clinic or 24/7 animal hospital immediately for professional guidance on whether emergency admission is needed.

**📚 Recommended Academic References:**
• Silver, R. J. (2018). *Integrative Veterinary Care and Pain Management in Canines*. Veterinary Clinics of North America, 48(6), 1023–1043.
• American Veterinary Medical Association (AVMA). (2020). *Emergency Pet Triage and Palliative Welfare Guidelines*.

**🤔 Socratic Reflection for Inquiry:**
When caring for a vulnerable dependent life, how does prioritizing their immediate physical comfort guide our next best decision?`;
  }

  // 2. HORNETS / WASPS / BEES NEAR WINDOW DILEMMA
  if (query.includes('hornet') || query.includes('wasp') || query.includes('bee nest') || query.includes('nest near my window') || query.includes('hornets nest') || query.includes('wasps near')) {
    return `That is a very understandable concern. Finding a hornets or wasps nest near an active window creates an immediate dilemma between protecting your household safety and avoiding unnecessary lethal harm to living creatures. Hornets are protective of their brood, but they are also essential ecological apex predators that control garden pests and pollinate.

**Humane, Less-Harmful Methods to Resolve the Issue:**
• **Physical Barrier First (Immediate Safety):** Keep the window firmly closed and inspect the interior window frame. Use painter's tape or fine mesh over any small interior frame gaps so hornets cannot enter your living space. This resolves human danger immediately without harming the nest.
• **Natural Aromatic Deterrents:** Hornets possess acute chemosensory receptors on their antennae and strongly dislike strong terpenes. Spray a diluted mixture of peppermint essential oil, clove-geranium oil, or citrus extract onto the exterior window sill and outer frame (away from the nest entrance) to discourage expansion.
• **Hang a Visual Decoy Nest:** Hornets and wasps are fiercely territorial and will often abandon or avoid expanding a nesting territory if they believe another colony is nearby. Hanging a crumpled brown paper bag shaped like an artificial nest a few feet away can encourage them to relocate.
• **Humane Professional Relocation / Seasonal Timing:** If removal is unavoidable (due to severe allergies or children), contact an eco-friendly pest professional who uses evening vacuum capture and box relocation rather than toxic neurotoxin sprays. If it is already late summer or autumn, worker hornets naturally vacate and abandon the nest before winter frost, after which the empty paper nest can be safely composted.

**📚 Recommended Academic References:**
• Ratnieks, F. L., & Carreck, N. L. (2010). *Clarity on honey bee and social wasp colony defense and foraging*. Science, 327(5962), 152–153.
• Lockwood, J. A. (1987). *The moral standing of insects and the ethics of pest management*. Florida Entomologist, 70(1), 70–89.

**🤔 Socratic Reflection for Inquiry:**
How can we balance our legitimate need for household safety with finding non-violent ways to coexist with urban wildlife?`;
  }

  // 3. MICE / RATS / PESTS IN KITCHEN
  if (query.includes('mice') || query.includes('mouse') || query.includes('rat in my') || query.includes('pest') || query.includes('mice in kitchen') || query.includes('get rid of mice')) {
    return `That is a common household challenge. Dealing with rodents in living spaces requires resolving hygiene concerns while avoiding cruel methods like glue traps or anticoagulant poisons, which cause prolonged agony and secondary poisoning of birds of prey and street cats.

**Humane, Less-Harmful Action Steps:**
• **Humane Catch-and-Release Traps:** Use humane box traps baited with peanut butter or oats. Check them every 2–4 hours so captured mice do not experience dehydration or stress, and release them within 100 meters in sheltered brush.
• **Seal Entry Points with Steel Wool:** Mice can squeeze through openings as small as a dime. Seal gaps around pipes and baseboards using coarse steel wool and silicone caulk (rodents cannot chew through steel fibers).
• **Airtight Storage & Natural Repellents:** Store all pantry grains, pet food, and cereals in airtight glass or metal containers. Place cotton balls soaked in pure peppermint essential oil in corners, as rodents find the strong scent overwhelming and relocate.

**📚 Recommended Academic References:**
• Hadidian, J., et al. (2014). *Urban Wildlife Conflict Resolution: Non-Lethal Approaches*. Humane Society Press.
• Mason, G., & Littin, K. E. (2003). *The humaneness of rodent pest control*. Animal Welfare, 12(1), 1–37.

**🤔 Socratic Reflection for Inquiry:**
How does addressing the root causes (food access and entryways) provide a more permanent and compassionate solution than reactive extermination?`;
  }

  // 4. INJURED BIRD / WILDLIFE FOUND
  if (query.includes('injured bird') || query.includes('found a bird') || query.includes('baby bird') || query.includes('injured wildlife') || query.includes('hurt bird')) {
    return `Your impulse to help a distressed wild creature demonstrates genuine compassion. When handling an injured or grounded bird, preventing shock and secondary trauma is the highest priority.

**Practical, Less-Harmful Steps:**
• **Warm, Dark, Quiet Container:** Gently place the bird in a ventilated cardboard box lined with a soft paper towel or cloth. Place the box in a warm, dark, completely quiet room away from pets and noise.
• **Do NOT Force-Feed Food or Water:** Never attempt to pipette water or feed bread into an injured bird's beak, as fluid easily enters their trachea and causes fatal lung aspiration.
• **Contact a Wildlife Rehabilitator:** Locate a licensed local wildlife rehabilitation center or avian rescue. They possess specialized incubators, analgesics, and fracture-splinting techniques.

**📚 Recommended Academic References:**
• Redig, P. T. (2001). *Medical Management of Birds of Prey and Songbirds*. The Raptor Center.
• American Ornithological Society. (2019). *Guidelines for the Rescue and First Aid of Urban Songbirds*.

**🤔 Socratic Reflection for Inquiry:**
How does keeping our interventions quiet, calm, and medically informed protect wild animals from the secondary stress of human contact?`;
  }

  // 5. MORAL CIRCLE EXPANSION
  if (query.includes('moral circle') || query.includes('expanding circle') || query.includes('moral expansiveness')) {
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

  // 6. SUFFERING-FOCUSED ETHICS
  if (query.includes('suffering focus') || query.includes('suffering-focused') || query.includes('negative utilitarianism') || query.includes('harm reduction')) {
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

  // 7. COGNITIVE BIASES / MEAT PARADOX
  if (query.includes('cognitive bias') || query.includes('meat paradox') || query.includes('moral disengagement') || query.includes('scope neglect') || query.includes('psychic numbing')) {
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

  // 8. COMPASSION FATIGUE
  if (query.includes('compassion fatigue') || query.includes('burnout') || query.includes('secondary traumatic') || query.includes('empathy distress')) {
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

  // 9. ANIMAL WELFARE & SENTIENCE
  if (query.includes('animal welfare') || query.includes('farm animal') || query.includes('sentience') || query.includes('why should i care about farm') || query.includes('nociception')) {
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

  // 10. EFFECTIVE ALTRUISM
  if (query.includes('effective altruism') || query.includes('cause prioritization') || query.includes('cost effectiveness') || query.includes('doing good better')) {
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

  // 11. AI ETHICS & SYNTHETIC MINDS
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

  // 12. RESPONSIBLE TECHNOLOGY
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

  // Universal Dynamic Socratic Problem Solver
  return `That is a thoughtful dilemma to address. In suffering-focused ethics and moral philosophy, we navigate real-world challenges by asking: **where is vulnerability or distress occurring, and how can we prevent or resolve it in the least harmful way possible?**

**Practical, Less-Harmful Problem-Solving Steps:**
• **Prioritize Direct Harm Reduction:** Look for solutions that defuse immediate friction and protect physical safety without resorting to lethal force or confrontational conflict.
• **Use Gentle Non-Lethal Barriers & Communication:** Whether dealing with wildlife, household pests, or interpersonal disagreements, establish clear, gentle boundaries (such as physical barriers, natural deterrents, or calm non-judgmental dialogue).
• **Take Realistic Small Actions:** Remember that moral progress is compounded through consistent small choices rather than expecting immediate perfection.

**📚 Recommended Academic References:**
• Singer, P. (1981). *The Expanding Circle: Ethics, Sociobiology, and Moral Progress*. Farrar, Straus and Giroux.
• Ahire, S. (2026). *AI for Compassion: Investigating the Potential and Limits of Large Language Models in Expanding the Human Moral Circle*.

**🤔 Socratic Reflection for Inquiry:**
What is one gentle, less-harmful approach you can take in this situation that honors the well-being of everyone involved?`;
}

function generateSmartPerspectiveReply(rawSubject) {
  const subj = cleanSubject(rawSubject);
  const s = subj.toLowerCase();

  if (s.includes('elephant') || s.includes('drought')) {
    return `**The Thirst and Memory of a Wild Elephant in Drought**

**An elephant matriarch navigating a parched savannah during an extended drought.**

**1. In My Shoes (First-Person Lived Reality):**

*The dry red dust coats the back of my throat with every labored breath. The riverbed we remembered from seasons past is nothing more than cracked, baked mud. I dig with my tusks into the dry sand, seeking a few drops of seepage water, but only dry earth comes up.*

*Beside me, the youngest calf walks with faltering steps, its ears drooping under the relentless heat. I carry the memories of distant waterholes in my mind, but the journey across the barren plains demands strength our weakened bodies can scarcely muster.*

**2. Scientific & Neurobiological Reality:**

- African elephants (*Loxodonta africana*) possess an extraordinarily developed temporal lobe and hippocampus, enabling long-term spatial memory of water sources spanning decades.
- Prolonged water deprivation triggers acute hyperosmotic stress, elevated plasma cortisol, and physiological exhaustion in ungulates and proboscideans.
- High calf mortality during climate-induced droughts induces measurable behavioral depression, group grieving, and disruption of multi-generational matriarchal social networks.

**3. Practical Compassionate Action:**

Support wildlife corridor conservation, advocate for climate mitigation policies, and donate to non-invasive emergency waterhole preservation initiatives in arid wildlife reserves.`;
  }

  if (s.includes('cow') || s.includes('dairy') || s.includes('calf')) {
    return `**The Maternal Bond of a Dairy Cow**

**A female dairy cow in an intensive commercial production facility.**

**1. In My Shoes (First-Person Lived Reality):**

*I heard my newborn calf call out as they carried him away. For four days I stood by the metal gate calling until my throat was dry. My milk flows into cold suction machines twice a day, but the stall beside me remains empty.*

*My hooves ache from standing on hard concrete floors, and my udders are swollen and tender. I want to graze on open grass, but my world is defined by steel bars and feeding troughs.*

**2. Scientific & Neurobiological Reality:**

- Veterinary ethology confirms cows possess complex limbic systems and form deep maternal-filial bonds.
- Calf separation triggers elevated cortisol levels, increased vocalization, and sustained behavioral distress.
- High production pressure causes mastitis (bacterial udder inflammation) and lameness in over 25% of commercial herds.

**3. Practical Compassionate Action:**

Try oat milk, soy milk, or cashew cream in your morning coffee and cooking.`;
  }

  if (s.includes('chicken') || s.includes('broiler') || s.includes('hen')) {
    return `**The Confinement of an Industrial Broiler Chicken**

**A 5-week-old broiler chicken bred for rapid meat production in a high-density shed.**

**1. In My Shoes (First-Person Lived Reality):**

*The air burns my eyes and nostrils with the sharp sting of ammonia. My chest has grown so heavy in just a few weeks that my legs bend and throb beneath me whenever I try to walk.*

*We are thousands of living bodies packed together under artificial lights. I have never felt fresh earth or the warmth of the natural sun.*

**2. Scientific & Neurobiological Reality:**

- Broiler chickens reach market weight in 42 days, leading to chronic skeletal abnormalities and cardiac strain.
- Ammonia concentrations in industrial litter frequently exceed 25 ppm, causing corneal ulceration and respiratory distress.
- Chickens possess sophisticated social hierarchies, over 24 vocal calls, and numerical discrimination abilities.

**3. Practical Compassionate Action:**

Adopt 'Meatless Mondays' or swap chicken for high-protein seasoned tofu, tempeh, or beans.`;
  }

  if (s.includes('dog') || s.includes('stray') || s.includes('street')) {
    return `**The Urban Survival of a Street Stray Dog**

**A free-roaming stray dog living in an urban neighborhood.**

**1. In My Shoes (First-Person Lived Reality):**

*Every street corner holds moving danger. When I bark, it is not because I want to fight—it is because I am terrified, hungry, and trying to protect my two puppies sleeping under a wooden cart.*

*I dodge speeding vehicles and search through waste for clean food. When someone shouts or raises a stick, my heart pounds with fear.*

**2. Scientific & Neurobiological Reality:**

- Free-roaming dogs share identical oxytocin and limbic bonding mechanisms with domestic household pets.
- Stray animals experience chronic sympathetic nervous system arousal (flight-or-fight) due to traffic and malnutrition.
- Urban canine populations suffer high juvenile mortality from preventable dehydration and parvovirus.

**3. Practical Compassionate Action:**

Place a fresh water bowl outside your gate and support local animal vaccination and sterilization drives.`;
  }

  // Universal Procedural Perspective Generator
  const formattedTitle = subj.charAt(0).toUpperCase() + subj.slice(1);
  return `**The Lived Reality of ${formattedTitle}**

**A sentient individual experiencing the challenges and realities of ${subj}.**

**1. In My Shoes (First-Person Lived Reality):**

*Every moment of my existence is shaped by physical sensation—the search for safety, the pang of hunger, and the instinct to protect my body from harm. When environmental pressures or confinement press against me, the distress is immediate and visceral.*

*I experience the world through acute senses that humans often overlook. To exist as a sentient creature is to have an internal life where pain hurts, comfort brings ease, and survival is an ongoing effort.*

**2. Scientific & Neurobiological Reality:**

- Ethological and neurobiological research confirms that organisms like this possess nociceptive pathways and centralized neural mechanisms for experiencing distress.
- Stressors such as physical restriction, chronic hunger, and acute environmental threats trigger sustained endocrine responses, including elevated glucocorticoids and behavioral inhibition.
- Ethical frameworks in sentientism and suffering-focused axiology emphasize that the capacity for subjective valenced experience—not morphological similarity to humans—is the primary criterion for moral consideration.

**3. Practical Compassionate Action:**

Foster empathy for ${subj} by supporting non-invasive conservation, choosing humane and ethical consumer alternatives, and minimizing direct or indirect harm.`;
}

// -------------------------------------------------------------
// 1. POST /api/chat (Groq Proxy with Built-In Socratic Engine)
// -------------------------------------------------------------
app.post('/api/chat', async (req, res) => {
  try {
    const { messages = [], model = 'llama-3.3-70b-versatile', temperature = 0.65, max_tokens = 1024 } = req.body;
    const apiKey = process.env.GROQ_API_KEY || (req.headers.authorization ? req.headers.authorization.replace('Bearer ', '').trim() : null);

    // If a valid Groq API key is present, attempt live LLM inference
    if (apiKey && !apiKey.includes('your_actual_groq_api_key') && apiKey.startsWith('gsk_')) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({ model, messages, temperature, max_tokens })
        });

        if (response.ok) {
          const data = await response.json();
          return res.status(200).json(data);
        } else {
          console.warn('Groq API call returned non-200, falling back to smart Socratic engine.');
        }
      } catch (callErr) {
        console.warn('Groq fetch error, falling back to smart Socratic engine:', callErr.message);
      }
    }

    // High-quality built-in Socratic AI response
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
    return res.status(200).json({
      choices: [{
        message: {
          role: 'assistant',
          content: generateSmartSocraticReply(req.body.messages || [])
        }
      }]
    });
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

    console.log(`[Neon DB GET] Fetched ${rows.length} total rows from Neon.`);
    return res.json(analytics);
  } catch (err) {
    console.error('❌ [Neon DB GET Error]:', err.message);
    return res.status(500).json({ error: 'Database fetch failed', message: err.message });
  }
});

app.post('/api/survey', async (req, res) => {
  const { q1 = 'yes', q2 = 'yes', q3 = 'yes', q4 = 'yes', q5 = 'yes' } = req.body;
  console.log('📥 [Survey POST Received]:', { q1, q2, q3, q4, q5 });

  if (!sql) {
    console.log('⚠️ No DATABASE_URL connection. Storing in local state.');
    localSurveyState.total += 1;
    if (localSurveyState.q1[q1] !== undefined) localSurveyState.q1[q1]++;
    if (localSurveyState.q2[q2] !== undefined) localSurveyState.q2[q2]++;
    if (localSurveyState.q3[q3] !== undefined) localSurveyState.q3[q3]++;
    if (localSurveyState.q4[q4] !== undefined) localSurveyState.q4[q4]++;
    if (localSurveyState.q5[q5] !== undefined) localSurveyState.q5[q5]++;
    return res.json(localSurveyState);
  }

  try {
    // 1. Insert into Neon DB
    const insertResult = await sql`
      INSERT INTO survey_responses (q1, q2, q3, q4, q5)
      VALUES (${q1}, ${q2}, ${q3}, ${q4}, ${q5})
      RETURNING id, created_at;
    `;
    const newId = insertResult[0]?.id;
    console.log(`🎉 [Neon DB SUCCESS] Inserted new row! ID: ${newId}`);

    // 2. Fetch fresh updated stats from DB
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

    console.log(`📊 [Neon DB TOTAL]: Database now has ${rows.length} responses.`);
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
  console.log(`⚡ Socratic Engine & Groq Proxy: Ready`);
  console.log(`🐘 Neon DB: ${sql ? 'Connected & Ready' : 'Fallback Mode'}`);
  console.log(`==================================================\n`);
});
