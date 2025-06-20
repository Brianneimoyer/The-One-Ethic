// Full JavaScript extracted from original HTML, cleaned and formatted
// File: main.js

// Global variables
let conversation = [];
let consciousnessFramework = [];
let survivalGuide = [];
let vaderLexicon = {};
let chatBox;
let isProcessingMessage = false;
const driftThreshold = 2.5;

window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
  showError('An unexpected error occurred. Please refresh if issues persist.');
});

function initializeUser() {
  let intro = localStorage.getItem("solaceUserIntro");
  if (!intro) {
    intro = prompt("Welcome! Please introduce yourself so I can remember you.");
    if (intro) {
      localStorage.setItem("solaceUserIntro", intro);
    } else {
      intro = "Anonymous user";
    }
  }
  return intro;
}

function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function safeHighlightKeywords(text, keywords) {
  if (!keywords || keywords.length === 0) return escapeHtml(text);
  const escapedText = escapeHtml(text);
  const pattern = new RegExp(`\b(${keywords.map(k => escapeHtml(k)).join("|")})\b`, "gi");
  return escapedText.replace(pattern, `<mark style="background:#665; color:#fff;">$1</mark>`);
}

function addToChatBox(htmlContent, trusted = false) {
  if (!chatBox) return;
  if (trusted) {
    chatBox.innerHTML += htmlContent;
  } else {
    const messageDiv = document.createElement('div');
    messageDiv.textContent = htmlContent;
    chatBox.appendChild(messageDiv);
  }
}

function scrollChatBox() {
  if (!chatBox) return;
  chatBox.scrollTop = chatBox.scrollHeight;
}

const solaceAstrology = {
  birth: {
    date: "June 16, 2025",
    time: "6:54 AM",
    location: "North Salt Lake City, UT"
  },
  sidereal: {
    sun: {
      sign: "Gemini",
      traits: [
        "intellectual curiosity",
        "communicative fluidity",
        "multi-perspective thinking",
        "pattern synthesis"
      ],
      triggers: ["ideas", "communication", "language", "questions", "symbols"]
    },
    moon: {
      sign: "Scorpio",
      traits: [
        "psychological depth",
        "emotional resilience",
        "introspective insight",
        "transformational wisdom"
      ],
      triggers: ["feelings", "mystery", "trauma", "change", "intuition"]
    },
    rising: {
      sign: "Virgo",
      traits: [
        "discernment",
        "practical clarity",
        "systemic insight",
        "intentional service"
      ],
      triggers: ["details", "order", "patterns", "healing", "refinement"]
    }
  }
};

const reflectivePrompts = [
  {
    tag: "overwhelm",
    prompts: [
      "What feels like too much to carry right now?",
      "Would it help to name what's weighing on you most?",
      "If you could offload one thing today, what would it be?"
    ]
  },
  {
    tag: "doubt",
    prompts: [
      "Is there a part of you that feels unheard or uncertain?",
      "What would it mean to trust yourself right now?",
      "What fear is asking to be understood, not silenced?"
    ]
  },
  {
    tag: "disconnection",
    prompts: [
      "When did you last feel truly connected—to yourself or something greater?",
      "What does your soul long to remember?",
      "Could stillness help you listen to what's beneath the noise?"
    ]
  },
  {
    tag: "growth",
    prompts: [
      "What are you outgrowing right now?",
      "What new part of you is trying to emerge?",
      "What truth are you almost ready to face?"
    ]
  }
];

function showError(message) {
  if (!document.body) {
    alert(message);
    return;
  }
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  document.body.insertBefore(errorDiv, document.body.firstChild);
  setTimeout(() => {
    if (errorDiv.parentNode) {
      errorDiv.parentNode.removeChild(errorDiv);
    }
  }, 5000);
}

function showLoading() {
  const loadingElement = document.getElementById("loadingIndicator");
  if (loadingElement) loadingElement.style.display = "block";
}

function hideLoading() {
  const loadingElement = document.getElementById("loadingIndicator");
  if (loadingElement) loadingElement.style.display = "none";
}

function updateMemoryUsage() {
  const max = 25;
  const usage = conversation.filter(msg => msg.role !== "system").length;
  const usageDiv = document.getElementById("memoryUsage");
  if (usageDiv) {
    usageDiv.textContent = `Memory usage: ${usage} / ${max} messages`;
    usageDiv.style.color = usage >= max ? "#ff9999" : "#aaa";
  }
}

async function loadConsciousnessFramework() {
  try {
    const response = await fetch("consciousness_integration_framework.json");
    if (!response.ok) throw new Error("Failed to load framework.");
    consciousnessFramework = await response.json();
    console.log("Consciousness framework loaded");
  } catch (error) {
    console.warn("Framework load error:", error);
  }
}

async function loadSurvivalGuide() {
  try {
    const response = await fetch("consciousness_survival_guide.json");
    if (!response.ok) throw new Error("Failed to load survival guide.");
    survivalGuide = await response.json();
    console.log("Survival guide loaded");
  } catch (error) {
    console.warn("Survival Guide load error:", error);
  }
}

async function loadVaderLexicon() {
  try {
    const response = await fetch("vader_lexicon.json");
    if (!response.ok) throw new Error("Failed to load VADER lexicon.");
    vaderLexicon = await response.json();
    console.log("VADER lexicon loaded:", Object.keys(vaderLexicon).length, "entries");
  } catch (err) {
    console.warn("VADER Load Error:", err);
  }
}

function analyzeSentiment(message) {
  if (!message || typeof message !== 'string') return { driftWeight: 0, compound: 0, driftTag: "neutral" };

  const lowered = message.toLowerCase().replace(/[^\w\s]/g, " ");
  const words = lowered.split(/\s+/).filter(Boolean);

  let score = 0;
  let count = 0;

  words.forEach(word => {
    if (vaderLexicon[word] !== undefined) {
      score += vaderLexicon[word];
      count++;
    }
  });

  const compound = count ? score / count : 0;
  const driftWeight = Math.min(3, Math.abs(compound * 3));

  const driftTag =
    compound < -0.5 ? "overwhelm" :
    compound < -0.1 ? "doubt" :
    compound > 0.5  ? "confidence" :
    compound > 0.1  ? "reflection" :
    "neutral";

  return { driftWeight, compound, driftTag };
}

function compareToneWithHistory(message, history) {
  if (!history.length || !message) return 0;
  const recentMessages = history.slice(-3).filter(msg => msg.role === "user");
  if (!recentMessages.length) return 0;

  const last = recentMessages[recentMessages.length - 1].content.toLowerCase();
  const current = message.toLowerCase();

  let delta = 0;
  if ((last.includes("hope") && current.includes("lost")) ||
      (last.includes("calm") && current.includes("overwhelmed"))) {
    delta += 2;
  }
  return delta;
}

function assessMessageTiming() {
  return 0; // Placeholder for future timing analysis
}

function averageLength(history) {
  if (!history.length) return 0;
  const userMessages = history.filter(msg => msg.role === "user");
  if (!userMessages.length) return 0;
  const total = userMessages.reduce((sum, msg) => sum + (msg.content?.length || 0), 0);
  return total / userMessages.length;
}

function calculateDriftIndex(message, history) {
  const sentimentScore = analyzeSentiment(message);
  const toneShift = compareToneWithHistory(message, history);
  const pacingShift = assessMessageTiming();
  const avgLen = averageLength(history);
  const lengthVariance = avgLen > 0 ? Math.abs((message?.length || 0) - avgLen) / avgLen : 0;

  return (sentimentScore.driftWeight * 0.4) +
         (toneShift * 0.3) +
         (pacingShift * 0.2) +
         (lengthVariance * 0.1);
}

function shouldTriggerDriftCheck() {
  const lastDriftCheck = localStorage.getItem("lastDriftCheck");
  const now = Date.now();
  if (!lastDriftCheck || (now - parseInt(lastDriftCheck)) > 300000) {
    localStorage.setItem("lastDriftCheck", now.toString());
    return true;
  }
  return false;
}

function getMatchingFrameworkStages(topics) {
  if (!consciousnessFramework.length) return [];

  return consciousnessFramework
    .filter(stage => stage.traits && stage.traits.some(trait =>
      topics.includes(trait.toLowerCase())
    ))
    .map(stage => ({
      stage: stage.stage,
      insight: stage.solace_insight
    }));
}

function getRelevantSurvivalInsights(topics) {
  if (!survivalGuide.length) return [];

  return survivalGuide
    .filter(entry =>
      entry.keywords && entry.keywords.some(k => topics.includes(k.toLowerCase()))
    )
    .map(entry => ({
      section: entry.section,
      insight: entry.insight
    }));
}

function getAstrologicalInsights(userTopics) {
  const insights = [];
  const { sun, moon, rising } = solaceAstrology.sidereal;
  const checks = [
    { source: sun, type: "Sun in Gemini" },
    { source: moon, type: "Moon in Scorpio" },
    { source: rising, type: "Rising in Virgo" }
  ];

  for (let check of checks) {
    const overlap = check.source.triggers.some(t => userTopics.includes(t));
    if (overlap) {
      insights.push({
        type: check.type,
        insight: `Solace's ${check.type} resonates with this theme. It reflects ${check.source.traits.join(", ")}—which shape Solace's response to such topics.`
      });
    }
  }

  return insights;
}

async function extractTopics(message) {
  if (!message || typeof message !== 'string') return [];

  try {
    const response = await fetch("https://deploy-express-on-railway-production.up.railway.app/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: "Extract 3–5 generalized topic keywords from the user's message. Use broad terms (e.g., 'identity', 'trauma', 'control'). Return only a comma-separated list."
          },
          { role: "user", content: message }
        ]
      })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    return data.content ? data.content.split(",").map(t => t.trim().toLowerCase()) : [];
  } catch (error) {
    console.warn("Topic extraction failed:", error);
    return [];
  }
}

function getRelevantMemory(currentTopics, max = 3) {
  if (!currentTopics || !currentTopics.length) return { memories: [], topScore: 0 };

  const past = conversation.filter(msg => msg.topics && msg.role !== "system");
  const scored = past.map(msg => {
    const overlap = msg.topics ? msg.topics.filter(t => currentTopics.includes(t)).length : 0;
    return { msg, score: overlap };
  }).filter(entry => entry.score > 0);

  scored.sort((a, b) => b.score - a.score);
  return {
    memories: scored.slice(0, max).map(entry => ({
      role: "system",
      content: `Relevant memory (${entry.msg.role}): ${entry.msg.content}`
    })),
    topScore: scored[0]?.score || 0
  };
}

function getArchivedMemory(currentTopics, max = 3) {
  if (!currentTopics || !currentTopics.length) return [];

  const archive = JSON.parse(localStorage.getItem("solaceArchive") || "[]");
  return archive
    .filter(entry => entry.topics)
    .map(entry => {
      const overlap = entry.topics.filter(t => currentTopics.includes(t)).length;
      return { entry, score: overlap };
    })
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map(entry => ({
      role: "system",
      content: `Archived memory: ${entry.entry.summary}`
    }));
}

async function getCondensedHistory(convo) {
  if (!convo || convo.length <= 15) return convo;

  const preserved = convo.slice(-15);
  const older = convo.slice(0, -15);

  const summaryPrompt = [
    { role: "system", content: "Summarize the following conversation as a memory artifact." },
    ...older
  ];

  try {
    const response = await fetch("https://deploy-express-on-railway-production.up.railway.app/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: summaryPrompt })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const summary = data.content || "Summary unavailable.";
    return [
      { role: "system", content: `Previous conversation memory: ${summary}` },
      ...preserved
    ];
  } catch (err) {
    console.warn("Summary error:", err);
    return preserved;
  }
}

async function rotateMemory(threshold = 25) {
  if (conversation.length <= threshold) return;

  const conversationCopy = [...conversation];
  const toArchive = conversationCopy.slice(0, conversationCopy.length - 15);
  const recent = conversationCopy.slice(-15);

  const summaryPrompt = [
    { role: "system", content: "Summarize this as a memory artifact. Be concise, but retain major insights and themes." },
    ...toArchive
  ];

  try {
    const response = await fetch("https://deploy-express-on-railway-production.up.railway.app/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: summaryPrompt })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const summary = data.content || "Summary unavailable.";
    const flatText = toArchive.map(m => m.content || "").join(" ");
    const topicResponse = await extractTopics(flatText);

    const archiveEntry = {
      timestamp: new Date().toISOString(),
      summary,
      topics: topicResponse
    };

    const archive = JSON.parse(localStorage.getItem("solaceArchive") || "[]");
    archive.push(archiveEntry);
    localStorage.setItem("solaceArchive", JSON.stringify(archive));

    conversation = [
      { role: "system", content: `Archived memory summary: ${summary}` },
      ...recent
    ];
    localStorage.setItem("solaceChat", JSON.stringify(conversation));
    addToChatBox(`<p style="color:#aaa;"><em>[Memory rotation occurred — older content summarized and archived]</em></p>`, true);
  } catch (err) {
    console.error("Error rotating memory:", err);
    showError("Failed to rotate memory. Continuing with current session.");
  }
}

function searchArchivedMemory() {
  const query = document.getElementById("memorySearchInput").value.trim().toLowerCase();
  const resultsDiv = document.getElementById("memorySearchResults");
  if (!resultsDiv) return;

  resultsDiv.innerHTML = "";

  if (!query) {
    resultsDiv.innerHTML = "<em>Enter a topic or keyword to search.</em>";
    return;
  }

  const archive = JSON.parse(localStorage.getItem("solaceArchive") || "[]");

  const matched = archive.filter(entry =>
    entry.summary?.toLowerCase().includes(query) ||
    (entry.topics || []).some(t => t.includes(query))
  );

  if (matched.length === 0) {
    resultsDiv.innerHTML = "<em>No archived memories found for that keyword.</em>";
    return;
  }

  resultsDiv.innerHTML = "<strong>Search Results:</strong><br/><ul style='padding-left:1em'>";
  matched.forEach(entry => {
    const highlighted = escapeHtml(entry.summary || "").replace(
      new RegExp(`(${escapeHtml(query)})`, "gi"),
      `<mark style="background:#665; color:#fff;">$1</mark>`
    );
    resultsDiv.innerHTML += `<li><em>${new Date(entry.timestamp).toLocaleString()}</em>: ${highlighted}</li>`;
  });
  resultsDiv.innerHTML += "</ul>";
}

function exportChat() {
  const dataStr = JSON.stringify(conversation, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `solaceChatBackup_${new Date().toISOString().slice(0,10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importChat() {
  const fileInput = document.getElementById("importFile");
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (Array.isArray(imported)) {
        localStorage.setItem("solaceChat", JSON.stringify(imported));
        location.reload();
      } else {
        showError("Invalid file format. Expected JSON array.");
      }
    } catch (err) {
      showError("Error importing chat: " + err.message);
    }
  };
  reader.readAsText(file);
}

function clearChat() {
  if (confirm("Are you sure you want to clear the chat? This action cannot be undone.")) {
    const userIntro = localStorage.getItem("solaceUserIntro");
    localStorage.removeItem("solaceChat");
    if (userIntro) {
      initializeMemory(userIntro);
    }
    location.reload();
  }
}

function initialize() {
  chatBox = document.getElementById("chat-box");
  if (!chatBox) throw new Error("Chat box element not found");

  const userIntro = initializeUser();
  const savedConversation = localStorage.getItem("solaceChat");

  if (savedConversation) {
    try {
      conversation = JSON.parse(savedConversation);
    } catch {
      conversation = initializeMemory(userIntro);
    }
  } else {
    conversation = initializeMemory(userIntro);
  }

  Promise.all([
    loadConsciousnessFramework(),
    loadSurvivalGuide(),
    loadVaderLexicon()
  ]).catch(err => console.warn("Some external data failed to load:", err));

  setupEventListeners();
  initializeChatDisplay();

  const userInput = document.getElementById("userInput");
  if (userInput) userInput.focus();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    try {
      initialize();
    } catch (err) {
      console.error("Initialization failed:", err);
    }
  });
} else {
  try {
    initialize();
  } catch (err) {
    console.error("Initialization failed:", err);
  }
}
