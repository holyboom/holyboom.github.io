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
 // These pairings illustrate how a business workflow relates to HolyMind concepts.
 // They do not run any agents, models, or third-party services.
 const stageSkills = {
  operations: [
   ["workflow-blueprint", "Workflow blueprint"],
   ["constraint-discovery-loop", "Constraint discovery"],
   ["workflow-executor", "Workflow execution"],
   ["decision-card", "Decision card"]
  ],
  knowledge: [
   ["spec-before-build", "Spec before build"],
   ["seed-expansion-via-search", "Seed expansion"],
   ["source-grounded-synthesis", "Grounded synthesis"],
   ["chain-of-verification", "Chain of verification"]
  ],
  venture: [
   ["goal-driven-execution", "Goal-driven execution"],
   ["workflow-blueprint", "Workflow blueprint"],
   ["evaluator-optimizer", "Evaluate and improve"],
   ["decision-card", "Decision card"]
  ]
 };
 const byId = id => document.getElementById(id);
 const setText = (id, text) => { const node = byId(id); if (node) node.textContent = text; };
 const tabs = [...document.querySelectorAll("[data-challenge]")];
 const stepButtons = [...document.querySelectorAll("[data-step]")];
 const panel = byId("strategy-panel");
 const brief = byId("project-brief");
 const drawer = byId("brief-drawer");
 document.documentElement.classList.add("js");
 let current = "operations", currentStep = 0, renderedStage = "";

 // Owner-selected always-active showcase policy. No persisted or OS setting gates it.
 const motionEnabled = true;
 function applyMotion() {
  document.body.dataset.motion = 'on';
  document.body.dataset.motionProfile = 'full';
  document.body.dataset.motionPolicy = 'always';
  document.dispatchEvent(new CustomEvent('holymind:motion', {detail:{enabled:true,profile:'full',policy:'always'}}));
 }
 applyMotion();

 function selectStep(index) {
  const row = challenges[current].stages[index];
  if (!row) return;
  const stamp = current + ":" + index;
  if (stamp === renderedStage) return;
  renderedStage = stamp;
  currentStep = index;
  stepButtons.forEach((button, i) => button.setAttribute("aria-pressed", String(i === index)));
  setText("step-title", row[1]);
  setText("step-description", row[2]);
  const skill = stageSkills[current][index];
  const stageIcon = byId("stage-icon");
  if (stageIcon) { stageIcon.src = "assets/skills/" + skill[0] + ".webp"; stageIcon.alt = ""; }
  setText("workbench-skill-name", skill[1]);
  document.dispatchEvent(new CustomEvent("holymind:step", { detail: { index, challenge: current, skill: skill[0] } }));
 }
 function makeBrief() {
  const c = challenges[current];
  const text = ["Project: " + c.title, "Goal: " + c.goal, "Workflow: " + c.stages.map(s => s[0]).join(" → ") + ".", "Guardrail: " + c.guardrail, "Measure: " + c.measure, "To establish: Systems, permissions, volume, budget, and baseline performance.", "Discuss with Boom: https://www.linkedin.com/in/boom-theerawee", "Illustrative planning brief. No information is sent by this page."].join("\n");
  return window.HolyMindJourney?.enrichBrief(text) || text;
 }
 function selectChallenge(key, focus = false) {
  if (!Object.prototype.hasOwnProperty.call(challenges, key)) return;
  current = key;
  tabs.forEach(tab => {
   const selected = tab.dataset.challenge === key;
   tab.setAttribute("aria-selected", String(selected));
   tab.tabIndex = selected ? 0 : -1;
   if (selected && focus) tab.focus();
  });
  panel?.setAttribute("aria-labelledby", "tab-" + key);
  const c = challenges[key];
  setText("scenario-title", c.title);
  setText("scenario-question", c.question);
  setText("scenario-count", (Object.keys(challenges).indexOf(key) + 1) + " of 3");
  setText("guardrail", c.guardrail);
  setText("measure", c.measure);
  stepButtons.forEach((button, index) => {
   const label = button.querySelector(".step-label");
   if (label) label.textContent = c.stages[index][0];
  });
  selectStep(0);
  if (brief) brief.value = makeBrief();
  setText("copy-status", "Nothing is sent. The brief stays in your browser.");
 }
 tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectChallenge(tab.dataset.challenge));
  tab.addEventListener("keydown", event => {
   let target = null;
   if (event.key === "ArrowDown" || event.key === "ArrowRight") target = (index + 1) % tabs.length;
   else if (event.key === "ArrowUp" || event.key === "ArrowLeft") target = (index + tabs.length - 1) % tabs.length;
   else if (event.key === "Home") target = 0;
   else if (event.key === "End") target = tabs.length - 1;
   if (target !== null) { event.preventDefault(); selectChallenge(tabs[target].dataset.challenge, true); }
  });
 });
 stepButtons.forEach((button, index) => button.addEventListener("click", () => selectStep(index)));
 byId("open-brief")?.addEventListener("click", () => {
  if (!drawer || !brief) return;
  drawer.open = true;
  brief.value = makeBrief();
  drawer.scrollIntoView({ behavior: motionEnabled ? "smooth" : "auto", block: "center" });
  drawer.querySelector("summary")?.focus({ preventScroll: true });
 });
 byId("copy-brief")?.addEventListener("click", async () => {
  if (!brief) return;
  const text = makeBrief();
  brief.value = text;
  try {
   if (!navigator.clipboard || !window.isSecureContext) throw new Error("Clipboard unavailable");
   await navigator.clipboard.writeText(text);
   setText("copy-status", "Project brief copied. Ready to paste into your notes or a conversation.");
  } catch (_) {
   brief.focus();
   brief.select();
   setText("copy-status", "Automatic copy is unavailable. The brief is selected — use your device’s Copy command.");
  }
 });
 function updateOrientation() {
  if (tabs.length < 2) return;
  const first = tabs[0].getBoundingClientRect();
  const second = tabs[1].getBoundingClientRect();
  document.querySelector(".challenge-picker")?.setAttribute("aria-orientation", Math.abs(first.top - second.top) < 4 ? "horizontal" : "vertical");
 }
 window.addEventListener("resize", updateOrientation, { passive: true });
 updateOrientation();
 selectChallenge("operations");
 window.HolyMindWorkbench=Object.freeze({selectChallenge,selectStep,brief:makeBrief,snapshot:()=>({challenge:current,step:currentStep,...challenges[current],stages:challenges[current].stages.map(s=>[...s]),skills:stageSkills[current].map(s=>[...s])})});

 // The compact navigation has the same links and destinations as the desktop version.
 const menuToggle = byId("menu-toggle");
 const primaryNav = byId("primary-nav");
 function setMenu(open, restoreFocus = false) {
  if (!menuToggle || !primaryNav) return;
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  primaryNav.classList.toggle("is-open", open);
  primaryNav.dataset.open = String(open);
  const label = menuToggle.querySelector(".menu-label");
  if (label) label.textContent = open ? "Close" : "Menu";
  if (restoreFocus) menuToggle.focus();
 }
 menuToggle?.addEventListener("click", () => setMenu(menuToggle.getAttribute("aria-expanded") !== "true"));
 primaryNav?.querySelectorAll("a").forEach(link => link.addEventListener("click", () => setMenu(false)));
 document.addEventListener("keydown", event => {
  if (event.key === "Escape" && menuToggle?.getAttribute("aria-expanded") === "true") setMenu(false, true);
 });
 document.addEventListener("click", event => {
  if (menuToggle?.getAttribute("aria-expanded") !== "true") return;
  if (!primaryNav?.contains(event.target) && !menuToggle.contains(event.target)) setMenu(false);
 });
 window.matchMedia("(min-width: 681px)").addEventListener("change", event => { if (event.matches) setMenu(false); });

 // Small orientation cues, with no continuous animation loop.
 const progress = byId("scroll-progress");
 let progressQueued = false;
 function updateProgress() {
  const length = document.documentElement.scrollHeight - window.innerHeight;
  const fraction = length > 0 ? Math.max(0, Math.min(1, window.scrollY / length)) : 0;
  if (progress) progress.style.transform = "scaleX(" + fraction + ")";
  progressQueued = false;
 }
 function queueProgress() {
  if (!progressQueued) { progressQueued = true; requestAnimationFrame(updateProgress); }
 }
 window.addEventListener("scroll", queueProgress, { passive: true });
 window.addEventListener("resize", queueProgress, { passive: true });
 updateProgress();
 const navLinks = [...(primaryNav?.querySelectorAll('a[href^="#"]') || [])];
 if ("IntersectionObserver" in window && navLinks.length) {
  const visibleSections = new Set();
  const navObserver = new IntersectionObserver(entries => {
   entries.forEach(entry => entry.isIntersecting ? visibleSections.add(entry.target.id) : visibleSections.delete(entry.target.id));
   const currentLink = navLinks.filter(link => visibleSections.has(link.hash.slice(1))).pop();
   navLinks.forEach(link => {
    if (link === currentLink) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
   });
  }, { rootMargin: "-10% 0px -55% 0px", threshold: 0 });
  navLinks.forEach(link => { const target = byId(link.hash.slice(1)); if (target) navObserver.observe(target); });
 }

 // Skill explorer: public concept summaries, loaded from the site's own static file.
 const grid = byId("skills-grid");
 const search = byId("skill-search");
 const filters = [...document.querySelectorAll("[data-filter]")];
 const showSkills = byId("show-skills");
 const empty = byId("skills-empty");
 const dialog = byId("skill-dialog");
 const categoryLabels = { reason: "Reason", build: "Build", verify: "Verify" };
 let skills = [];
 let category = "all";
 let expanded = true;
 let dialogOpener = null;
 let dialogNavigation = false;
 let previousOverflow = "";

 function openSkill(skill, opener) {
  if (!dialog || typeof dialog.showModal !== "function") return;
  dialog.dataset.skill=skill.id;
  const carried=window.HolyMindJourney?.snapshot().skill===skill.id;
  byId("carry-skill")?.setAttribute("aria-pressed",String(carried));
  setText("carry-skill-status",carried?skill.name+" is carried in your brief.":"");
  dialogOpener = opener;
  dialogNavigation = false;
  const icon = byId("skill-dialog-icon");
  if (icon) { icon.src = "assets/skills/" + skill.id + ".webp"; icon.alt = ""; }
  setText("skill-dialog-category", categoryLabels[skill.category]);
  setText("skill-dialog-title", skill.name);
  setText("skill-dialog-description", skill.description);
  setText("skill-dialog-example", skill.example);
  const source = byId("skill-source");
  if (source) { source.href = "#workbench"; source.textContent = "Try a business scenario"; }
  previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  dialog.showModal();
  byId("close-skill-dialog")?.focus();
 }
 document.addEventListener("holymind:open-skill", event => {
  const skill = skills.find(item => item.id === event.detail?.id);
  if (skill && event.detail?.opener instanceof HTMLElement) openSkill(skill, event.detail.opener);
 });
 byId("close-skill-dialog")?.addEventListener("click", () => dialog?.close());
 byId("skill-source")?.addEventListener("click", () => { dialogNavigation = true; dialog?.close(); });
 dialog?.addEventListener("click", event => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
 });
 dialog?.addEventListener("close", () => {
  document.body.style.overflow = previousOverflow;
  if (!dialogNavigation && dialogOpener?.isConnected) dialogOpener.focus({ preventScroll: true });
  if (dialogNavigation) {
   const workbench = byId("workbench");
   if (workbench) {
    workbench.tabIndex = -1;
    workbench.focus({ preventScroll: true });
   }
  }
 });
 function normalize(value) { return String(value).normalize("NFKC").toLocaleLowerCase().trim(); }
 function makeCard(skill) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "skill-card";
  card.dataset.skill = skill.id;
  card.setAttribute("aria-haspopup", "dialog");
  const icon = document.createElement("img");
  icon.src = "assets/skills/" + skill.id + ".webp";
  icon.alt = "";
  icon.width = 128;
  icon.height = 128;
  icon.loading = "lazy";
  icon.decoding = "async";
  card.append(icon);
  [["skill-category", categoryLabels[skill.category]], ["skill-name", skill.name], ["skill-purpose", skill.purpose]].forEach(([className, text]) => {
   const element = document.createElement("span");
   element.className = className;
   element.textContent = text;
   card.append(element);
  });
  card.addEventListener("click", () => openSkill(skill, card));
  return card;
 }
 function renderSkills() {
  if (!grid) return;
  const terms = normalize(search?.value || "").split(/\s+/).filter(Boolean);
  const matches = skills.filter(skill => {
   if (category !== "all" && skill.category !== category) return false;
   const haystack = normalize([skill.id.replaceAll("-", " "), skill.name, skill.purpose, skill.concept, skill.concept_th, categoryLabels[skill.category]].join(" "));
   return terms.every(term => haystack.includes(term));
  });
  const limited = !expanded && category === "all" && terms.length === 0;
  const displayed = limited ? matches.slice(0, 8) : matches;
  const fragment = document.createDocumentFragment();
  displayed.forEach(skill => fragment.append(makeCard(skill)));
  grid.replaceChildren(fragment);
  if (empty) empty.hidden = displayed.length > 0;
  if (showSkills) {
   showSkills.hidden = category !== "all" || terms.length > 0 || skills.length <= 8;
   showSkills.setAttribute("aria-expanded", String(expanded));
   showSkills.textContent = expanded ? "Show featured skills" : "Explore all " + skills.length + " skills";
  }
  const total = matches.length;
  setText("skills-count", limited ? "8 featured · " + skills.length + " skills to explore" : total + (total === 1 ? " skill" : " skills") + (category === "all" ? "" : " · " + categoryLabels[category]));
  document.dispatchEvent(new CustomEvent("holymind:skills-rendered"));
  queueProgress();
 }
 search?.addEventListener("input", renderSkills);
 filters.forEach(button => button.addEventListener("click", () => {
  const key = button.dataset.filter;
  if (key !== "all" && !Object.prototype.hasOwnProperty.call(categoryLabels, key)) return;
  category = key;
  filters.forEach(filter => filter.setAttribute("aria-pressed", String(filter === button)));
  renderSkills();
 }));
 showSkills?.addEventListener("click", () => {
  expanded = !expanded;
  renderSkills();
  if (!expanded) byId("framework")?.scrollIntoView({ behavior: motionEnabled ? "smooth" : "auto", block: "start" });
 });
 byId("clear-search")?.addEventListener("click", () => {
  if (search) search.value = "";
  category = "all";
  expanded = true;
  filters.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.filter === "all")));
  renderSkills();
  search?.focus();
 });
 if (grid) {
  grid.setAttribute("aria-busy", "true");
  fetch("assets/skills.json")
   .then(response => { if (!response.ok) throw new Error("Skill summaries unavailable"); return response.json(); })
   .then(data => {
    if (!Array.isArray(data) || !data.every(skill => typeof skill.id === "string" && /^[a-z0-9-]+$/.test(skill.id) && Object.prototype.hasOwnProperty.call(categoryLabels, skill.category) && [skill.name, skill.purpose, skill.description, skill.example].every(value => typeof value === "string"))) throw new Error("Invalid skill summaries");
    skills = data;
    window.HolyMindSkills=Object.freeze({list:()=>skills.map(s=>({...s}))});
    document.dispatchEvent(new CustomEvent("holymind:skills-ready"));
    byId("instrument-open")?.removeAttribute("disabled");
    renderSkills();
   })
   .catch(() => {
    setText("skills-count", "The skill explorer could not load. Refresh this page to try again.");
    if (showSkills) showSkills.hidden = true;
    if (search) search.disabled = true;
    filters.forEach(button => { button.disabled = true; });
   })
   .finally(() => grid.setAttribute("aria-busy", "false"));
 }
})();
