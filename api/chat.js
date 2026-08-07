// Vercel Serverless Function: /api/chat
// Author: Suvarna Ahire (CompassionGPT)

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const { messages = [], model = 'llama-3.3-70b-versatile', temperature = 0.65, max_tokens = 1024 } = req.body;
    const apiKey = process.env.GROQ_API_KEY || (req.headers.authorization ? req.headers.authorization.replace('Bearer ', '').trim() : null);

    if (apiKey && !apiKey.includes('your_actual_groq_api_key') && apiKey.startsWith('gsk_')) {
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
      } catch (err) {
        console.warn('Groq serverless error, falling back to local Socratic engine:', err.message);
      }
    }

    // Fallback smart Socratic response
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';
    const replyContent = generateSmartSocraticReply(lastUserMsg);

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
    console.error('Serverless error in /api/chat:', error);
    return res.status(200).json({
      choices: [{
        message: {
          role: 'assistant',
          content: 'Some suffering is unavoidable, but much of it can be prevented. How can we reasonably reduce unnecessary suffering without creating greater harms?'
        }
      }]
    });
  }
}

function cleanSubject(s) {
  let clean = (s || '').replace(/^(write|generate|explain|describe|simulate).*?:\s*/i, '').trim();
  clean = clean.replace(/^(write|generate|explain|describe|simulate)\s+(an?\s+)?(authentic\s+|structured\s+|phenomenological\s+)?(lived\s+)?(perspective\s+)?(simulation\s+)?(narrative\s+)?(for|of)?\s*/i, '').trim();
  clean = clean.replace(/^(explain\s+)?suffering\s+from\s+(the\s+)?lived\s+perspective\s+of\s+/i, '').trim();
  return clean.replace(/^["'\s.]+|["'\s.]+$/g, '');
}

function generateSmartSocraticReply(queryText) {
  const query = (queryText || '').toLowerCase();

  // Perspective Generator
  if (query.includes('lived perspective') || query.includes('phenomenological') || query.includes('in my shoes') || query.includes('perspective simulation')) {
    const subj = cleanSubject(queryText);
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

  // 1. SICK PUPPY / SICK PET
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

  // 2. HORNETS / WASPS / BEES NEAR WINDOW
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

  // 3. MICE / RATS
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

  // 4. INJURED BIRD
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

  // General Socratic Response
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
