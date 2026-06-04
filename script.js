// script.js - AI Prompt Studio (No API simulation)

const form = document.getElementById('promptForm');
const goalEl = document.getElementById('goal');
const topicEl = document.getElementById('topic');
const toneEl = document.getElementById('tone');
const lengthEl = document.getElementById('length');
const outputEl = document.getElementById('output');
const copyBtn = document.getElementById('copyBtn');
const saveBtn = document.getElementById('saveBtn');
const favList = document.getElementById('favList');
const favCount = document.getElementById('favCount');

const preserveEl = document.getElementById('preserve');
const directModeEl = document.getElementById('directMode');
const directProEl = document.getElementById('directPro');

const genVariantsBtn = document.getElementById('genVariantsBtn');
const useSelectedBtn = document.getElementById('useSelectedBtn');
const runSelectedBtn = document.getElementById('runSelectedBtn');
const runSimBtn = document.getElementById('runSimBtn');

let favorites = JSON.parse(localStorage.getItem('prompts_favs') || '[]');
renderFavorites();

// --- uploaded image path (if you want to use a reference image in image prompts)
const uploadedImageUrl = "/mnt/data/3b885e17-c2e8-411c-9793-4a2a85c0d85e.png";

// Form submit: generate single prompt (template) into output box
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const goal = goalEl.value;
  const topic = topicEl.value.trim();
  const tone = toneEl.value;
  const length = lengthEl.value;
  const preserve = !!preserveEl?.checked;
  const directMode = !!directModeEl?.checked;
  const directPro = !!directProEl?.checked;

  if (!topic) {
    outputEl.textContent = 'Please enter a topic or task.';
    return;
  }

  const prompt = buildPrompt({goal, topic, tone, length, preserve, directMode, directPro});
  outputEl.textContent = prompt;
  animateOutput();
});

// copy / save
copyBtn.addEventListener('click', async () => {
  const text = outputEl.textContent.trim();
  if(!text) return;
  await navigator.clipboard.writeText(text);
  showToast('Copied to clipboard');
});

saveBtn.addEventListener('click', () => {
  const text = outputEl.textContent.trim();
  if(!text) return;
  favorites.unshift({text, created: Date.now()});
  if (favorites.length > 30) favorites.pop();
  localStorage.setItem('prompts_favs', JSON.stringify(favorites));
  renderFavorites();
  showToast('Saved to favorites');
});

document.getElementById('clearBtn').addEventListener('click', () => {
  topicEl.value = '';
  outputEl.textContent = 'Your prompt will appear here...';
});

// ----------------------
// Prompt building (goal/tone/length/direct/preserve)
// ----------------------
function buildPrompt({goal, topic, tone, length, preserve, directMode, directPro}) {
  const safeTopic = String(topic).replace(/"/g, '\\"');

  const lengthHintMap = {
    short: 'Short: 1–2 sentences.',
    medium: 'Medium: 2–4 sentences.',
    long: 'Long: 4–7 detailed sentences.'
  };

  const toneHintMap = {
    neutral: 'Neutral tone.',
    formal: 'Formal tone.',
    casual: 'Casual tone.',
    creative: 'Creative tone.'
  };

  const goalHintMap = {
    writing: 'Write well-structured content.',
    coding: 'Write code with correct syntax + one example.',
    marketing: 'Write headline + caption + 2 CTAs.',
    design: 'Write purpose, audience, features, and style.'
  };

  const lengthHint = lengthHintMap[length];
  const toneHint = toneHintMap[tone];
  const goalHint = goalHintMap[goal];

  if (directPro) {
    return `FOLLOW THESE RULES STRICTLY:
1) Do NOT repeat the user's request.
2) Do NOT add explanation, disclaimers, or steps.
3) Output ONLY the final answer.
4) Do NOT add headings unless user asked.
Goal: ${goalHint}
Tone: ${toneHint}
Length: ${lengthHint}

User request: "${safeTopic}"`;
  }

  if (directMode) {
    return `Give the final answer directly. Do NOT repeat or rephrase the user's request.
Goal: ${goalHint}
Tone: ${toneHint}
Length: ${lengthHint}

User Request: "${safeTopic}"`;
  }

  if (preserve) {
    return `Use the exact text below without editing ANY word. Then complete the task.
"${safeTopic}"

Goal: ${goalHint}
Length: ${lengthHint}`;
  }

  // Normal mode
  const toneRule = {
    neutral: 'Use a neutral, clear tone.',
    formal: 'Use a formal professional tone.',
    casual: 'Use a casual friendly tone.',
    creative: 'Use a creative expressive style.'
  };

  const lengthRule = {
    short: 'Keep it 1–2 sentences.',
    medium: 'Make it 2–4 sentences.',
    long: 'Make it 4–7 detailed sentences.'
  };

  if (goal === 'writing') {
    return `You are an expert writer. ${toneRule[tone]} ${lengthRule[length]}
Topic: ${topic}`;
  }

  if (goal === 'coding') {
    return `You are an expert programmer. ${toneRule[tone]} ${lengthRule[length]}
Provide correct code and one example.
Task: ${topic}`;
  }

  if (goal === 'marketing') {
    return `You are a marketing expert. ${toneRule[tone]} ${lengthRule[length]}
Write headline + caption + 2 CTAs for:
${topic}`;
  }

  if (goal === 'design') {
    return `You are a product designer. ${toneRule[tone]} ${lengthRule[length]}
Write design brief for:
${topic}`;
  }

  return `${toneRule[tone]} ${lengthRule[length]} Task: ${topic}`;
}

// ---------- UI helpers ----------
function animateOutput() {
  outputEl.style.transition = '150ms';
  outputEl.style.transform = 'scale(0.97)';
  setTimeout(() => outputEl.style.transform = 'scale(1)', 150);
}

function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.display = "block";
  t.style.opacity = 1;
  setTimeout(() => {
    t.style.opacity = 0;
    setTimeout(() => t.style.display = "none", 300);
  }, 900);
}

// ---------- favorites rendering ----------
function renderFavorites(){
  favList.innerHTML = '';
  favCount.textContent = favorites.length;
  favorites.forEach((f, i) => {
    const li = document.createElement('li');
    li.textContent = f.text.slice(0, 120) + (f.text.length>120?'...':'');
    const del = document.createElement('button');
    del.textContent = "Delete";
    del.className = "smallBtn";
    del.onclick = () => {
      favorites.splice(i, 1);
      localStorage.setItem('prompts_favs', JSON.stringify(favorites));
      renderFavorites();
    };
    li.appendChild(del);
    favList.appendChild(li);
  });
}

// ----------------------
// Variants generation + UI
// ----------------------
function generateVariants({topic, goal, tone, length}) {
  const safeTopic = String(topic).trim();
  const variants = [];

  variants.push(`${goalToPrefix(goal)} ${toneLengthHint(tone, length)} Answer concisely for: "${safeTopic}"`);
  variants.push(`${goalToPrefix(goal)} ${toneLengthHint(tone, length)} Provide the full result with clear structure and examples if relevant. Task: ${safeTopic}`);
  variants.push(`${goalToPrefix(goal)} ${toneLengthHint(tone, length)} Provide 2 variations or alternatives for the requested output about: ${safeTopic}`);

  if (/image|photo|picture|design|logo|illustration|generate an image/i.test(safeTopic)) {
    variants.push(`${goalToPrefix(goal)} ${toneLengthHint(tone, length)} Use this reference image: ${uploadedImageUrl} and generate a creative prompt to produce: ${safeTopic}`);
  } else {
    variants.push(`${goalToPrefix(goal)} ${toneLengthHint(tone, length)} Give the final required output only, no extra explanation. ${safeTopic}`);
  }

  return variants.slice(0,4);
}

function goalToPrefix(goal){
  const map = {
    writing: "You are an expert writer.",
    coding: "You are an expert developer. Provide runnable code where applicable.",
    marketing: "You are a senior marketer. Provide headlines and CTAs.",
    design: "You are a product designer. Provide brief visual specs."
  };
  return map[goal] || "You are an assistant.";
}

function toneLengthHint(tone, length){
  const toneMap = {neutral: "Neutral tone.", formal: "Formal tone.", casual: "Casual tone.", creative: "Creative tone."};
  const lengthMap = {short: "Short (1-2 sentences).", medium: "Medium (2-4 sentences).", long: "Long (4-7 sentences)."};
  return `${toneMap[tone] || ""} ${lengthMap[length] || ""}`.trim();
}

function renderVariants(variants) {
  const list = document.getElementById('variantsList');
  list.innerHTML = '';
  variants.forEach((v, idx) => {
    const item = document.createElement('div');
    item.className = 'variant-item';
    item.dataset.index = idx;

    const txt = document.createElement('div');
    txt.className = 'variant-text';
    txt.textContent = v;

    const actions = document.createElement('div');
    actions.className = 'variant-actions';

    const selRadio = document.createElement('input');
    selRadio.type = 'radio';
    selRadio.name = 'variantSelect';
    selRadio.value = idx;
    selRadio.style.marginBottom = '6px';

    const useBtn = document.createElement('button');
    useBtn.className = 'smallBtn';
    useBtn.textContent = 'Use';
    useBtn.onclick = () => {
      outputEl.textContent = v; // put chosen prompt into output box
      showToast('Prompt loaded to output');
    };

    const runBtn = document.createElement('button');
    runBtn.className = 'smallBtn';
    runBtn.textContent = 'Run (Sim)';
    runBtn.onclick = () => simulateRunPrompt(v);

    actions.appendChild(selRadio);
    actions.appendChild(useBtn);
    actions.appendChild(runBtn);

    item.appendChild(txt);
    item.appendChild(actions);
    list.appendChild(item);
  });
}

function simulateRunPrompt(promptText) {
  const aiEl = document.getElementById('aiAnswer');
  if(!aiEl) return;
  aiEl.textContent = 'Simulating response for the selected prompt...\n\n' + shortSimulate(promptText);
  showToast('Simulated response shown');
}

function shortSimulate(promptText){
  if(/perceptron|and gate|and_gate|and gate/i.test(promptText)) {
    return `# Simulated Python perceptron for AND gate (short demo)
import random

class Perceptron:
    def __init__(self, n, lr=0.1):
        self.w = [random.uniform(-1,1) for _ in range(n+1)]
        self.lr = lr

    def predict(self, x):
        s = self.w[-1]
        for wi, xi in zip(self.w[:-1], x):
            s += wi*xi
        return 1 if s>0 else 0

    def train(self, data, epochs=20):
        for _ in range(epochs):
            for x,y in data:
                e = y - self.predict(x)
                if e!=0:
                    for i in range(len(x)):
                        self.w[i] += self.lr*e*x[i]
                    self.w[-1] += self.lr*e

# training AND
data = [([0,0],0),([0,1],0),([1,0],0),([1,1],1)]
p = Perceptron(2,0.2)
p.train(data, epochs=50)
for x,y in data:
    print(x, '->', p.predict(x))`;
  }

  if(/code|python|javascript|function/i.test(promptText)) {
    return `# Simulated small code snippet (example)
def add(a,b): return a+b
print(add(3,4))  # 7`;
  }

  if(/image|photo|generate an image|illustration|logo/i.test(promptText)) {
    return `# Simulated image prompt ready:
"Neon cyberpunk city at night, high detail, cinematic lighting — reference image used."`;
  }

  return `Simulated final answer for: ${promptText.slice(0,150)}...`;
}

// Buttons wiring for variants
genVariantsBtn.addEventListener('click', ()=>{
  const topic = topicEl.value.trim();
  if(!topic) return showToast('Enter topic first');
  const variants = generateVariants({topic, goal: goalEl.value, tone: toneEl.value, length: lengthEl.value});
  renderVariants(variants);
});

function getSelectedVariantIndex(){
  const radios = document.getElementsByName('variantSelect');
  for(const r of radios){
    if(r.checked) return Number(r.value);
  }
  return null;
}

useSelectedBtn.addEventListener('click', ()=>{
  const idx = getSelectedVariantIndex();
  if(idx === null) return showToast('Select one suggestion first');
  const variants = generateVariants({topic: topicEl.value.trim(), goal: goalEl.value, tone: toneEl.value, length: lengthEl.value});
  outputEl.textContent = variants[idx];
  showToast('Selected prompt loaded');
});

runSelectedBtn.addEventListener('click', ()=>{
  const idx = getSelectedVariantIndex();
  if(idx === null) return showToast('Select one suggestion first');
  const variants = generateVariants({topic: topicEl.value.trim(), goal: goalEl.value, tone: toneEl.value, length: lengthEl.value});
  simulateRunPrompt(variants[idx]);
});

runSimBtn.addEventListener('click', ()=>{
  const prompt = outputEl.textContent.trim();
  if(!prompt) return showToast('No prompt to simulate');
  simulateRunPrompt(prompt);
});
