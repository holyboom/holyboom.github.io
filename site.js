"use strict";
(() => {
 const challenges = {
  operations: {
   title: "A calmer operations queue.",
   question: "“Could routine requests move forward without someone copying the same information between tools?”",
   goal: "Move routine requests forward without duplicate manual entry.",
   stages: [
    ["Capture", "Start with one reliable input.", "Collect a request from an approved form or inbox. Keep its source, owner, and required fields together."],
    ["Check", "Know when not to automate.", "Validate required fields and access permissions. Route missing, conflicting, or sensitive information to a person."],
    ["Draft", "Prepare the next action.", "Use rules or an AI model where appropriate to prepare a response or system update. Keep the evidence attached."],
    ["Approve", "Let the owner make the call.", "Ask an authorized person to approve external actions. Record the decision and keep a manual path available."]
   ],
   guardrail: "Approval before external actions. Log the decision and provide a manual fallback.",
   measure: "Handling time, correction rate, and successful handoffs against the current workflow."
  },
  knowledge: {
   title: "An answer with a source.",
   question: "“Could a team find what it needs across its documents without losing permissions or context?”",
   goal: "Make approved internal knowledge easier to find while preserving access rules.",
   stages: [
    ["Scope", "Draw the permission boundary first.", "Identify approved document sources and who can access each one. Keep sensitive or unsupported sources outside the system."],
    ["Retrieve", "Find the relevant evidence.", "Use keyword or semantic retrieval suited to the material. Preserve document identifiers and source passages."],
    ["Answer", "Make the source inspectable.", "Draft a response grounded in retrieved material. Show sources and acknowledge when the available evidence is insufficient."],
    ["Evaluate", "Test the difficult questions.", "Check factual support, access boundaries, and unanswered questions against a reviewed evaluation set before a wider rollout."]
   ],
   guardrail: "Preserve source permissions. Cite evidence and abstain when the material cannot support an answer.",
   measure: "Source-supported answer quality, retrieval coverage, and permission-boundary tests."
  },
  venture: {
   title: "A smaller first bet.",
   question: "“Could an ambitious business idea become something we can test before investing in the full platform?”",
   goal: "Test the riskiest assumption with a small, usable prototype before committing to a larger build.",
   stages: [
    ["Frame", "Choose the assumption that matters.", "Define the user, business problem, and riskiest assumption. Agree on what would make the first experiment useful."],
    ["Prototype", "Build the smallest useful version.", "Design a focused workflow with clear integration boundaries. Use approved data and label any simulated behavior."],
    ["Observe", "Watch the actual task.", "Test with intended users. Record where the task succeeds, where it fails, and what still needs human intervention."],
    ["Decide", "Expand only on evidence.", "Review usability, operating cost, and the original hypothesis. Decide whether to improve, pause, or expand the system."]
   ],
   guardrail: "Keep experiments bounded. Label simulated behavior and agree on data handling before testing.",
   measure: "Task completion, user feedback, operating cost, and evidence for the original assumption."
  }
 };
 const tabs = [...document.querySelectorAll("[data-challenge]")];
 const stepButtons = [...document.querySelectorAll("[data-step]")];
 const panel = document.getElementById("strategy-panel");
 const brief = document.getElementById("project-brief");
 const drawer = document.getElementById("brief-drawer");
 const status = document.getElementById("copy-status");
 const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
 let current = "operations";
 const setText = (id, text) => { const node = document.getElementById(id); if(node) node.textContent = text; };
 function selectStep(index) {
  const row = challenges[current].stages[index];
  stepButtons.forEach((button, i) => button.setAttribute("aria-pressed", String(i === index)));
  setText("step-title", row[1]); setText("step-description", row[2]);
 }
 function makeBrief() {
  const c = challenges[current];
  return ["Project: " + c.title, "Goal: " + c.goal, "Workflow: " + c.stages.map(s => s[0]).join(" → ") + ".", "Guardrail: " + c.guardrail, "Measure: " + c.measure, "To establish: Systems, permissions, volume, budget, and baseline performance.", "Discuss with Boom: https://www.instagram.com/holyboom/", "Illustrative planning brief. No information is sent by this page."].join("\n");
 }
 function selectChallenge(key, focus = false) {
  if (!Object.prototype.hasOwnProperty.call(challenges, key)) return;
  current = key;
  tabs.forEach((tab) => {const selected = tab.dataset.challenge === key; tab.setAttribute("aria-selected", String(selected)); tab.tabIndex = selected ? 0 : -1; if (selected && focus) tab.focus(); });
  panel.setAttribute("aria-labelledby", "tab-" + key);
  const c = challenges[key];
  setText("scenario-title", c.title); setText("scenario-question", c.question);
  setText("scenario-count", (Object.keys(challenges).indexOf(key) + 1) + " of 3");
  setText("guardrail", c.guardrail); setText("measure", c.measure);
  stepButtons.forEach((button, index) => {button.querySelector(".step-label").textContent = c.stages[index][0];});
  selectStep(0); brief.value = makeBrief();
  setText("copy-status", "Nothing is sent. The brief stays in your browser.");
 }
 tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectChallenge(tab.dataset.challenge));
  tab.addEventListener("keydown", (event) => {
   let target = null;
   if (event.key === "ArrowDown" || event.key === "ArrowRight") target = (index + 1) % tabs.length;
   else if (event.key === "ArrowUp" || event.key === "ArrowLeft") target = (index + tabs.length - 1) % tabs.length;
   else if (event.key === "Home") target = 0;
   else if (event.key === "End") target = tabs.length - 1;
   if (target !== null) {event.preventDefault(); selectChallenge(tabs[target].dataset.challenge, true);}
  });
 });
 stepButtons.forEach((button, index) => button.addEventListener("click", () => selectStep(index)));
 document.getElementById("open-brief").addEventListener("click", () => {drawer.open = true; brief.value = makeBrief(); drawer.scrollIntoView({behavior: reduced.matches ? "auto" : "smooth", block: "center"}); drawer.querySelector("summary").focus({preventScroll:true});});
 document.getElementById("copy-brief").addEventListener("click", async () => {
  const text = makeBrief(); brief.value = text;
  try {
   if (!navigator.clipboard || !window.isSecureContext) throw new Error("Clipboard unavailable");
   await navigator.clipboard.writeText(text);
   setText("copy-status", "Project brief copied. Ready to paste into your notes or a conversation.");
  } catch (_) {
   brief.focus(); brief.select();
   setText("copy-status", "Automatic copy is unavailable. The brief is selected — use your device’s Copy command.");
  }
 });
 const updateOrientation = () => {document.querySelector(".challenge-picker").setAttribute("aria-orientation", matchMedia("(min-width:541px) and (max-width:780px)").matches ? "horizontal" : "vertical");};
 window.addEventListener("resize",updateOrientation,{passive:true});
 updateOrientation(); selectChallenge("operations");
})();
