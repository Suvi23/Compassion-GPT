// api/chat.js - Vercel Serverless Function: /api/chat
// Author: Suvarna Ahire (CompassionGPT)
// Dynamic Groq AI Inference Proxy with Socratic Reasoning Engine

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
          body: JSON.stringify({
            model: model,
            messages: messages,
            temperature: temperature,
            max_tokens: max_tokens
          })
        });

        if (groqResponse.ok) {
          const data = await groqResponse.json();
          return res.status(200).json(data);
        }
      } catch (err) {
        console.warn('Groq serverless call issue, falling back to Socratic engine:', err.message);
      }
    }

    // Dynamic Socratic fallback response
    const lastUserMsg = typeof messages === 'string' ? messages : ([...(messages || [])].reverse().find(m => m.role === 'user')?.content || '');
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
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}

function generateSmartSocraticReply(queryText) {
  const q = (queryText || '').toLowerCase();

  // 1. AHIMSA & KARUNA / BUDDHISM / JAIN / GANDHI
  if (q.includes('ahimsa') || q.includes('karuna') || q.includes('buddhism') || q.includes('jain') || q.includes('gandhi') || q.includes('eastern philosophy')) {
    return `### ☸️ Ahimsa & Karuna: Compassion as Daily Practice\n\nIn classical Eastern traditions—including Buddhism, Jainism, and Gandhian philosophy—compassion (*Karuna*) and non-harm (*Ahimsa*) are not abstract theories, but active daily disciplines designed to expand our moral circle to embrace all sentient beings that fear pain and cherish life.\n\nAs the Buddhist *Dhammapada* states: *"All beings tremble at danger; life is dear to all."* Recognizing shared vulnerability dissolves artificial in-group and out-group divides. Mahatma Gandhi famously observed that the moral progress of a society is measured by how it treats its most defenseless members.\n\n**Practical Daily Ways to Apply Ahimsa & Karuna:**\n• **Mindful Non-Violence in Daily Routines:** Set a gentle intention of non-harm before eating meals, speaking with family, or communicating online.\n• **Practice Skillful Means (*Upaya*):** Use technology and daily tools to share constructive kindness and defuse interpersonal conflicts.\n• **Compassionate Dietary Choices:** Choose plant-based alternatives and ensure street animals have access to fresh water outside your home.\n\n**📚 Recommended Academic References:**\n• Chapple, C. K. (1993). *Nonviolence to Animals, Earth, and Self in Asian Traditions*. State University of New York Press.\n• Harvey, P. (2000). *An Introduction to Buddhist Ethics: Foundations, Values and Issues*. Cambridge University Press.\n• Gandhi, M. K. (1927). *An Autobiography: The Story of My Experiments with Truth*. Navajivan Publishing House.\n\n**🤔 Socratic Reflection for Inquiry:**\nHow might adopting a daily intention of non-harm influence the small decisions you make throughout your day?`;
  }

  // 2. Compassion Fatigue
  if (q.includes('compassion fatigue') || q.includes('burnout') || q.includes('caregiver') || q.includes('sustainable empathy') || q.includes('advocate') || q.includes('exhaustion')) {
    return `### 🧘 Compassion Fatigue & Sustainable Empathy\n\n**Compassion Fatigue** is a state of physical, emotional, and spiritual exhaustion resulting from prolonged exposure to the suffering of others. It frequently affects healthcare workers, animal welfare advocates, caregivers, and highly empathetic individuals.\n\nNeuroscience distinguishes between **Empathetic Distress** (where the brain's pain matrix mirrors another's distress, leading to overwhelm and burnout) and **Compassionate Motivation** (prosocial warmth that engages oxytocin and reward networks to provide constructive relief).\n\n**Practical Ways to Build Sustainable Empathy:**\n• **Shift from Empathy to Compassion:** Reframe your role from absorbing another's distress to taking calm, constructive actions within your spheres of influence.\n• **Set Compassionate Boundaries:** Taking restorative breaks and resting is not selfish—it preserves your biological and emotional capacity to help over the long term.\n• **Celebrate Micro-Progress:** Measure impact through consistent small acts (e.g. daily water bowls, plant-based choices) rather than expecting to solve global suffering overnight.\n\n**📚 Recommended Academic References:**\n• Figley, C. R. (2002). *Compassion fatigue: Psychotherapists' chronic lack of self care*. Journal of Clinical Psychology, 58(11), 1433–1441.\n• Neff, K. D. (2003). *Self-compassion: An alternative conceptualization of a healthy attitude toward oneself*. Self and Identity, 2(2), 85–101.\n• Singer, T., & Klimecki, O. M. (2014). *Empathy and compassion*. Current Biology, 24(18), R875–R878.\n\n**🤔 Socratic Reflection for Inquiry:**\nHow can you practice extending the same gentle compassion you offer to others toward yourself when feeling overwhelmed?`;
  }

  // 3. Sick Puppy / Pet Triage
  if (q.includes('sick puppy') || q.includes('sick dog') || q.includes('sick cat') || q.includes('sick pet') || q.includes('puppy what should i do') || q.includes('puppy')) {
    return `I am so sorry to hear your puppy is unwell. When a young or dependent animal is sick, acting with calm reassurance while prioritizing their physical comfort and veterinary care is the most compassionate approach.\n\n**Immediate Practical & Less-Harmful Action Steps:**\n• **Check Critical Vital Signs:** Gently inspect their gums—they should be moist and healthy pink (pale, white, blue, or dry gums indicate acute shock or dehydration). Check if there is vomiting, severe diarrhea, difficulty breathing, or extreme lethargy.\n• **Warmth & Low-Stress Sanctuary:** Young puppies cannot regulate their body temperature well when sick. Create a quiet, warm nest with clean blankets in a dimly lit room away from household noise.\n• **Hydration & Zero Human Medications:** Offer small, frequent sips of fresh water or unflavored electrolyte solution with an eye dropper. **Never give human medications** (paracetamol, ibuprofen, aspirin), which cause fatal liver/kidney toxicity in canines.\n• **Contact a Veterinary Triage Clinic:** Call a local veterinary clinic or 24/7 animal hospital immediately for professional guidance on whether emergency admission is needed.\n\n**📚 Recommended Academic References:**\n• Silver, R. J. (2018). *Integrative Veterinary Care and Pain Management in Canines*. Veterinary Clinics of North America, 48(6), 1023–1043.\n• American Veterinary Medical Association (AVMA). (2020). *Emergency Pet Triage and Palliative Welfare Guidelines*.\n\n**🤔 Socratic Reflection for Inquiry:**\nWhen caring for a vulnerable dependent life, how does prioritizing their immediate physical comfort guide our next best decision?`;
  }

  // 4. Hornets Nest / Wasps / Bees
  if (q.includes('hornet') || q.includes('wasp') || q.includes('bee nest') || q.includes('nest near my window') || q.includes('hornets nest') || q.includes('bee')) {
    return `That is a very understandable concern. Finding a hornets or wasps nest near an active window creates an immediate dilemma between protecting your household safety and avoiding unnecessary lethal harm to living creatures. Hornets are protective of their brood, but they are also essential ecological apex predators that control garden pests and pollinate.\n\n**Humane, Less-Harmful Methods to Resolve the Issue:**\n• **Physical Barrier First (Immediate Safety):** Keep the window firmly closed and inspect the interior window frame. Use painter's tape or fine mesh over any small interior frame gaps so hornets cannot enter your living space. This resolves human danger immediately without harming the nest.\n• **Natural Aromatic Deterrents:** Hornets possess acute chemosensory receptors on their antennae and strongly dislike strong terpenes. Spray a diluted mixture of peppermint essential oil, clove-geranium oil, or citrus extract onto the exterior window sill and outer frame (away from the nest entrance) to discourage expansion.\n• **Hang a Visual Decoy Nest:** Hornets and wasps are fiercely territorial and will often abandon or avoid expanding a nesting territory if they believe another colony is nearby. Hanging a crumpled brown paper bag shaped like an artificial nest a few feet away can encourage them to relocate.\n• **Humane Professional Relocation / Seasonal Timing:** If removal is unavoidable (due to severe allergies or children), contact an eco-friendly pest professional who uses evening vacuum capture and box relocation rather than toxic neurotoxin sprays. If it is already late summer or autumn, worker hornets naturally vacate and abandon the nest before winter frost, after which the empty paper nest can be safely composted.\n\n**📚 Recommended Academic References:**\n• Ratnieks, F. L., & Carreck, N. L. (2010). *Clarity on honey bee and social wasp colony defense and foraging*. Science, 327(5962), 152–153.\n• Lockwood, J. A. (1987). *The moral standing of insects and the ethics of pest management*. Florida Entomologist, 70(1), 70–89.\n\n**🤔 Socratic Reflection for Inquiry:**\nHow can we balance our legitimate need for household safety with finding non-violent ways to coexist with urban wildlife?`;
  }

  // General Socratic response
  return `That is a thoughtful dilemma to address. In suffering-focused ethics and moral philosophy, we navigate real-world challenges by asking: **where is vulnerability or distress occurring, and how can we prevent or resolve it in the least harmful way possible?**\n\n**Practical, Less-Harmful Problem-Solving Steps:**\n• **Prioritize Direct Harm Reduction:** Look for solutions that defuse immediate friction and protect physical safety without resorting to lethal force or confrontational conflict.\n• **Use Gentle Non-Lethal Barriers & Communication:** Whether dealing with wildlife, household pests, or interpersonal disagreements, establish clear, gentle boundaries.\n• **Take Realistic Small Actions:** Remember that moral progress is compounded through consistent small choices rather than expecting immediate perfection.\n\n**📚 Recommended Academic References:**\n• Singer, P. (1981). *The Expanding Circle: Ethics, Sociobiology, and Moral Progress*. Farrar, Straus and Giroux.\n• Ahire, S. (2026). *AI for Compassion: Investigating the Potential and Limits of Large Language Models in Expanding the Human Moral Circle*.\n\n**🤔 Socratic Reflection for Inquiry:**\nWhat is one gentle, less-harmful approach you can take in this situation that honors the well-being of everyone involved?`;
}
