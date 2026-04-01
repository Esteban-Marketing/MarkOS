// onboarding.js — MarkOS Client Onboarding v2.0
// Handles 7-step form flow + AI draft generation + MIR publish

'use strict';

// ── Configuration & State ─────────────────────────────────────────────────────
const STORAGE_KEY  = 'markos-onboarding-draft';
const LEGACY_STORAGE_KEY = 'markos-onboarding-draft'; // legacy fallback, do not remove
const PRIVACY_DISMISSED_KEY = 'markos_privacy_dismissed';
const LEGACY_PRIVACY_DISMISSED_KEY = 'markos_privacy_dismissed'; // legacy fallback, do not remove
const DEFAULT_PROJECT_SLUG = 'markos-client';
const TOTAL_STEPS  = 3;
let currentStep    = 0; // Starts at Step 0 (Omni-Input Gate)
let lastSeed       = null;   // seed built on step 6 submit
let lastSlug       = null;   // slug returned by server
let approvedDrafts = {};     // { section_key: content }
let draftContents  = {};     // { section_key: original content }
let omniExtractedText = '';  // raw text extracted from Step 0
let executionLoopCompleted = false;
let interviewQuestionCount = 0;
let interviewAutoProceedTriggered = false;

const INTERVIEW_MAX_QUESTIONS = 5;

// ── Elements ──────────────────────────────────────────────────────────────────
const stepSections       = document.querySelectorAll('.step-section');
const btnNext            = document.getElementById('btnNext');
const btnBack            = document.getElementById('btnBack');
const progressFill       = document.getElementById('progressFill');
const currentStepNum     = document.getElementById('currentStepNum');
const navButtons         = document.getElementById('navButtons');
const completionScreen   = document.getElementById('completionScreen');
const addCompetitorBtn   = document.getElementById('addCompetitorBtn');
const competitorsContainer = document.getElementById('competitorsContainer');
const loadingOverlay     = document.getElementById('loadingOverlay');
const loadingMessage     = document.getElementById('loadingMessage');
const draftGrid          = document.getElementById('draftGrid');
const publishBar         = document.getElementById('publishBar');
const btnPublish         = document.getElementById('btnPublish');
const publishSummary     = document.getElementById('publishSummary');
const gateStatusBar      = document.getElementById('gateStatusBar');

let competitorCount = 1;

function getOutcomeMessage(outcome, fallbackMessage) {
  if (!outcome || !outcome.state) return fallbackMessage;

  const warningText = (outcome.warnings || []).length > 0
    ? ` ${outcome.warnings.join(' | ')}`
    : '';

  if (outcome.state === 'success') {
    return `Success: ${outcome.message || fallbackMessage}`;
  }
  if (outcome.state === 'warning') {
    return `Warning: ${outcome.message || fallbackMessage}${warningText}`;
  }
  if (outcome.state === 'degraded') {
    return `Degraded: ${outcome.message || fallbackMessage}${warningText}`;
  }
  return `Failure: ${outcome.message || fallbackMessage}`;
}

function showOutcomeStatus(outcome, fallbackMessage) {
  if (!gateStatusBar) return;
  gateStatusBar.style.display = 'block';
  gateStatusBar.textContent = getOutcomeMessage(outcome, fallbackMessage);
}

function getStoredItem(primaryKey, fallbackKey) {
  return localStorage.getItem(primaryKey) || localStorage.getItem(fallbackKey);
}

// ── Draft card definitions ────────────────────────────────────────────────────
const DRAFT_CARDS = [
  { key: 'company_profile',  label: 'Company Profile',      icon: '🏢', mirFile: 'PROFILE.md' },
  { key: 'mission_values',   label: 'Mission, Vision & Values', icon: '🎯', mirFile: 'MISSION-VISION-VALUES.md' },
  { key: 'audience',         label: 'Audience Persona',     icon: '👥', mirFile: 'AUDIENCES.md' },
  { key: 'competitive',      label: 'Competitive Landscape',icon: '⚔️', mirFile: 'COMPETITIVE-LANDSCAPE.md' },
  { key: 'brand_voice',      label: 'Brand Voice Guide',    icon: '🎙️', mirFile: 'VOICE-TONE.md' },
  { key: 'channel_strategy', label: 'Channel Strategy',     icon: '📡', mirFile: 'MSP/Strategy' },
];

// ── Config Init ───────────────────────────────────────────────────────────────
async function loadConfig() {
  // Setup privacy notice dismiss
  const privacyNotice = document.getElementById('privacyNotice');
  const dismissPrivacy = document.getElementById('dismissPrivacy');
  if (privacyNotice && dismissPrivacy) {
    if (getStoredItem(PRIVACY_DISMISSED_KEY, LEGACY_PRIVACY_DISMISSED_KEY) === 'true') {
      privacyNotice.style.display = 'none';
    } else {
      dismissPrivacy.addEventListener('click', () => {
        privacyNotice.classList.add('dismissed');
        localStorage.setItem(PRIVACY_DISMISSED_KEY, 'true');
        setTimeout(() => privacyNotice.style.display = 'none', 300);
      });
    }
  }

  try {
    const res = await fetch('/config');
    if (res.ok) {
      const config = await res.json();
      if (config.posthog_api_key) {
        posthog.init(config.posthog_api_key, { api_host: config.posthog_host });
      }
      if (window.posthog && posthog.capture) {
        posthog.capture('onboarding_started', { url: window.location.href });
      }

      if (config.primary_color) {
        document.documentElement.style.setProperty('--primary', config.primary_color);
      }
      if (config.logo_url) {
        const logo = document.getElementById('brandLogo');
        logo.src = config.logo_url;
        logo.style.display = 'inline-block';
      }
      if (config.form_title) {
        document.getElementById('formTitle').innerText = config.form_title;
        document.title = config.form_title;
      } else {
        document.title = 'MarkOS Onboarding';
      }
    }
  } catch (err) {
    console.warn('Could not load config from server, using defaults.');
  }
}

function onBusinessModelChange() {
  const model  = document.getElementById('businessModel')?.value || '';
  if (window.posthog && posthog.capture && model) {
    posthog.capture('business_model_selected', { business_model: model });
  }
}

let isVectorMemoryOffline = false;

async function loadStatus() {
  try {
    const res = await fetch('/status');
    if (res.ok) {
      const status = await res.json();
      if (!status.vector_memory) {
        isVectorMemoryOffline = true;
      }
    }
  } catch (err) {
    isVectorMemoryOffline = true;
  }
}

// ── Navigation ────────────────────────────────────────────────────────────────
function updateUI() {
  stepSections.forEach(section => {
    section.classList.remove('active');
    if (parseInt(section.getAttribute('data-step')) === currentStep) {
      section.classList.add('active');
    }
  });

  const percent = currentStep === 0 ? 0 : ((currentStep - 1) / TOTAL_STEPS) * 100;
  progressFill.style.width = `${percent}%`;
  
  if (currentStep > 0 && currentStep <= TOTAL_STEPS) {
    currentStepNum.innerText = currentStep;
  }

  btnBack.disabled = (currentStep === 1 || currentStep === 0);

  if (currentStep === 0) {
    navButtons.style.display = 'none'; // Use custom Omni-Gate buttons instead
    return;
  }

  if (currentStep === 2) {
    if (isVectorMemoryOffline) {
      btnNext.innerText = '⚠️ Vector Memory Offline (Cannot Generate AI Drafts)';
      btnNext.disabled = true;
      btnNext.style.backgroundColor = '#6b7280';
    } else {
      btnNext.innerText = 'Generate AI Drafts →';
      btnNext.disabled = false;
    }
  } else if (currentStep === 3) {
    // Navigation hidden on step 3 — handled by draft cards + publish button
    navButtons.style.display = 'none';
    return;
  } else {
    btnNext.innerText = 'Save & Continue';
  }
  navButtons.style.display = 'flex';
}

function showStep(stepIndex) {
  if (stepIndex < 0) return;
  if (stepIndex > TOTAL_STEPS) return;

  if (stepIndex === 3) {
    currentStep = 3;
    updateUI();
    switchTab('schema');
    return;
  }

  currentStep = stepIndex;
  updateUI();
  
  if (currentStep === 2) {
    startInterview();
  }
}

// ── Validation ────────────────────────────────────────────────────────────────
function validateCurrentStep() {
  const currentSection = document.querySelector(`.step-section[data-step="${currentStep}"]`);
  const requiredInputs = currentSection.querySelectorAll('input[required], textarea[required], select[required]');
  let isValid = true;

  currentSection.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));

  requiredInputs.forEach(input => {
    if (!input.value.trim()) {
      isValid = false;
      input.classList.add('invalid');
      input.addEventListener('input', () => input.classList.remove('invalid'), { once: true });
    }
  });

  return isValid;
}

// ── Draft Persistence ─────────────────────────────────────────────────────────
function saveDraft() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gatherFormData()));
  } catch (e) {}
}

function restoreDraft() {
  try {
    const saved = getStoredItem(STORAGE_KEY, LEGACY_STORAGE_KEY);
    if (!saved) return;
    const data = JSON.parse(saved);

    Object.keys(data).forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.value = data[id];
      }
    });
  } catch (e) {}
}

// ── Form Data Collection ──────────────────────────────────────────────────────
function gatherFormData() {
  const data = {};
  document.querySelectorAll('input:not([type=checkbox]), textarea, select').forEach(input => {
    if (input.id) data[input.id] = input.value;
  });
  return data;
}

function getMissingFields(scoresObj, prefix = '') {
  let missing = [];
  for (const [key, meta] of Object.entries(scoresObj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (meta && typeof meta === 'object' && meta.score !== undefined) {
      if (meta.score === 'Red' || meta.score === 'Yellow') {
        missing.push(path);
      }
    } else if (meta && typeof meta === 'object') {
      missing = missing.concat(getMissingFields(meta, path));
    }
  }
  return missing;
}

function buildSeed() {
  const d = gatherFormData();
  const seed = window.extractedSchema || {};
  
  if (!seed.company) seed.company = {};
  if (d.companyName) seed.company.name = d.companyName;
  if (d.businessModel) seed.company.business_model = d.businessModel;

  if (!seed.metadata) seed.metadata = { version: '2.1' };
  seed.metadata.generated = new Date().toISOString();
  
  if (window.fieldScores) {
    const missing = getMissingFields(window.fieldScores);
    seed.metadata.completeness_score = missing.length === 0 ? 100 : Math.round(((30 - missing.length) / 30) * 100);
  } else {
    seed.metadata.completeness_score = 10;
  }

  return seed;
}

// ── Step 3: Draft Generation & Final Submit ──────────────────────────────────
async function handleDraftGeneration() {
  if (!validateCurrentStep()) return;
  saveDraft();

  lastSeed = buildSeed();
  
  if (lastSeed.metadata.completeness_score < 80) {
      if (!confirm(`Your profile completeness is only ${lastSeed.metadata.completeness_score}%. The generated drafts may be low quality. Do you want to proceed?`)) {
          return;
      }
  }

  // Swap to drafts tab
  document.getElementById('tabBtnSchema').classList.remove('active');
  document.getElementById('tabContentSchema').classList.remove('active');
  document.getElementById('tabBtnDrafts').classList.add('active');
  document.getElementById('tabContentDrafts').classList.add('active');

  // Show loading overlay
  loadingOverlay.classList.add('active');
  loadingMessage.textContent = 'Generating AI drafts...';

  try {
    const response = await fetch('/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lastSeed),
    });

    const result = await response.json();
    loadingOverlay.classList.remove('active');

    if (!result.success) {
      throw new Error(result.error || 'Server returned an error');
    }

    lastSlug = result.slug;
    draftContents = result.drafts || {};

    if (window.posthog && posthog.capture) {
      const businessModel = lastSeed?.company?.business_model || lastSeed?.company?.businessModel || 'B2B';
      posthog.capture('onboarding_completed', { project_slug: lastSlug, business_model: businessModel });
    }

    renderDraftCards(draftContents);
    localStorage.removeItem(STORAGE_KEY);

  } catch (err) {
    loadingOverlay.classList.remove('active');
    draftGrid.innerHTML = `
      <div style="text-align:center; padding: 2rem; color: #ef4444;">
        <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">⚠️</div>
        <strong>Draft generation failed</strong><br>
        <small style="color: #6b7280">${err.message}</small><br><br>
        <div style="display:flex; gap:1rem; justify-content:center;">
          <button class="btn-secondary" onclick="handleDraftGeneration()">Try Again</button>
          <button class="btn-secondary" onclick="proceedToManualEntry()">Skip to Manual Entry</button>
        </div>
      </div>`;
  }
}

/**
 * Fallback to manual entry if AI drafts fail.
 */
window.proceedToManualEntry = function() {
    lastSlug = lastSlug || `${DEFAULT_PROJECT_SLUG}-` + Math.random().toString(36).substring(2, 7);
    draftContents = {
        company_profile: '[ENTER COMPANY PROFILE MANUALLY]',
        mission_values: '[ENTER MISSION/VALUES MANUALLY]',
        audience: '[ENTER AUDIENCE PERSONA MANUALLY]',
        competitive: '[ENTER COMPETITIVE LANDSCAPE MANUALLY]',
        brand_voice: '[ENTER BRAND VOICE MANUALLY]',
        channel_strategy: '[ENTER CHANNEL STRATEGY MANUALLY]'
    };
    renderDraftCards(draftContents);
};

// ── Render Draft Cards ────────────────────────────────────────────────────────
function renderDraftCards(drafts) {
  approvedDrafts = {};

  draftGrid.innerHTML = '';

  DRAFT_CARDS.forEach(card => {
    const content = drafts[card.key] || '[Content unavailable — regenerate to try again]';

    const el = document.createElement('div');
    el.className = 'draft-card';
    el.id = `draft-card-${card.key}`;
    el.innerHTML = `
      <div class="draft-card-header">
        <div class="draft-card-title">
          <span class="icon">${card.icon}</span>
          ${card.label}
          <span class="approved-badge">✓ Approved</span>
        </div>
        <div class="draft-card-actions">
          <button class="btn-regenerate" id="regen-${card.key}" onclick="regenerateSection('${card.key}')">↻ Re-generate</button>
          <button class="btn-approve" id="approve-${card.key}" onclick="approveSection('${card.key}')">✓ Approve</button>
        </div>
      </div>
      <div class="draft-card-body">
        <textarea class="draft-textarea" id="draft-content-${card.key}">${escapeHtml(content)}</textarea>
      </div>
    `;
    draftGrid.appendChild(el);
  });

  publishBar.style.display = 'block';
  updatePublishBar();
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Approve Section ───────────────────────────────────────────────────────────
function approveSection(key) {
  const content = document.getElementById(`draft-content-${key}`).value;
  approvedDrafts[key] = content;

  const card    = document.getElementById(`draft-card-${key}`);
  const btn     = document.getElementById(`approve-${key}`);
  card.classList.add('approved');
  btn.classList.add('approved');
  btn.textContent = '✓ Approved';

  updatePublishBar();
}

// ── Re-generate Section ───────────────────────────────────────────────────────
async function regenerateSection(key) {
  const regenBtn = document.getElementById(`regen-${key}`);
  const textarea = document.getElementById(`draft-content-${key}`);
  const card     = document.getElementById(`draft-card-${key}`);

  regenBtn.disabled    = true;
  regenBtn.textContent = '↻ Generating...';
  textarea.value       = '...';
  card.classList.remove('approved');
  document.getElementById(`approve-${key}`).classList.remove('approved');
  document.getElementById(`approve-${key}`).textContent = '✓ Approve';
  delete approvedDrafts[key];
  updatePublishBar();

  try {
    const response = await fetch('/regenerate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: key, seed: lastSeed, slug: lastSlug }),
    });

    const result = await response.json();
    textarea.value = result.content || '[Regeneration failed]';

    if (!response.ok || !result.success) {
      showOutcomeStatus(result.outcome, result.error || 'Section regeneration failed.');
      return;
    }

    showOutcomeStatus(result.outcome, 'Section regenerated.');
  } catch (err) {
    textarea.value = `[Error: ${err.message}]`;
    showOutcomeStatus(null, `Failure: ${err.message}`);
  } finally {
    regenBtn.disabled    = false;
    regenBtn.textContent = '↻ Re-generate';
  }
}

// ── Publish Bar Update ────────────────────────────────────────────────────────
function updatePublishBar() {
  const total    = DRAFT_CARDS.length;
  const approved = Object.keys(approvedDrafts).length;

  if (approved === 0) {
    publishSummary.textContent = `Approve sections to publish to your MIR. (0 / ${total} approved)`;
    btnPublish.disabled = true;
  } else if (approved < total) {
    publishSummary.textContent = `${approved} of ${total} sections approved. Approve all to publish, or publish partial.`;
    btnPublish.disabled = false;
  } else {
    publishSummary.textContent = `All ${total} sections approved! Ready to activate your MIR.`;
    btnPublish.disabled = false;
  }
}

// ── Publish ───────────────────────────────────────────────────────────────────
async function handlePublish() {
  btnPublish.disabled    = true;
  btnPublish.textContent = '⏳ Publishing...';

  try {
    const response = await fetch('/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvedDrafts, slug: lastSlug }),
    });

    const result = await response.json();

    if (result.success) {
      const written = result.written || [];
      const readinessStatus = result.handoff?.execution_readiness?.status || 'blocked';
      showOutcomeStatus(result.outcome, `${written.length} MIR files written. STATE.md updated.`);

      if (window.posthog && posthog.capture) {
        posthog.capture('approval_completed', {
          project_slug: lastSlug,
          written_count: written.length,
          readiness_status: readinessStatus,
        });
        posthog.capture(
          readinessStatus === 'ready' ? 'execution_readiness_ready' : 'execution_readiness_blocked',
          {
            project_slug: lastSlug,
            blocking_count: (result.handoff?.execution_readiness?.blocking_checks || []).length,
          }
        );
        if (readinessStatus === 'ready') {
          posthog.capture('execution_loop_completed', {
            project_slug: lastSlug,
          });
        }
      }

      executionLoopCompleted = readinessStatus === 'ready';

      setTimeout(() => showCompletionScreen(written), 1200);
    } else {
      btnPublish.disabled    = false;
      btnPublish.textContent = '🚀 Publish & Activate MIR';
      showOutcomeStatus(result.outcome, result.error || 'Publish encountered errors.');
      const errors = (result.errors || []).join('\n');
      alert(`Publish encountered errors:\n${errors}`);
    }
  } catch (err) {
    btnPublish.disabled    = false;
    btnPublish.textContent = '🚀 Publish & Activate MIR';
    showOutcomeStatus(null, `Failure: ${err.message}`);
    alert(`Publish failed: ${err.message}`);
  }
}

// ── Tabs & Schema Grid ────────────────────────────────────────────────────────

window.switchTab = function(tabName) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  
  if (tabName === 'schema') {
    document.getElementById('tabBtnSchema').classList.add('active');
    document.getElementById('tabContentSchema').classList.add('active');
    renderSchemaGrid(); // refresh it
  } else {
    document.getElementById('tabBtnDrafts').classList.add('active');
    document.getElementById('tabContentDrafts').classList.add('active');
    
    // Trigger draft generation if we are on the drafts tab and they aren't loaded yet
    const draftGrid = document.getElementById('draftGrid');
    if (draftGrid && draftGrid.children.length <= 1) { 
        handleDraftGeneration();
    }
  }
};

function renderSchemaGrid() {
  const schemaGrid = document.getElementById('schemaGrid');
  if (!schemaGrid) return;
  schemaGrid.innerHTML = '';
  
  const seed = lastSeed || buildSeed();
  
  const renderField = (path, value, title) => {
    const card = document.createElement('div');
    card.className = 'schema-card';
    
    let sourceStr = 'File/Web';
    let sourceCls = 'badge-source-web';
    let isRed = false;

    const pathKeys = path.split('.');
    let scoreMeta = window.fieldScores;
    for (let k of pathKeys) {
        if(scoreMeta) scoreMeta = scoreMeta[k];
    }
    
    if (scoreMeta && scoreMeta.score) {
        if (scoreMeta.score === 'Green') sourceStr = 'Valid';
        if (scoreMeta.score === 'Yellow') sourceStr = 'Partial';
        if (scoreMeta.score === 'Red') { sourceStr = 'Missing'; isRed = true; }
        
        if (scoreMeta.source === 'User Chat') { sourceStr = 'Chat'; sourceCls = 'badge-source-chat'; }
        else if (scoreMeta.source === 'Manual') { sourceStr = 'Manual'; sourceCls = 'badge-source-manual'; }
        else if (scoreMeta.source === 'Extraction') { sourceStr = 'Web/File'; sourceCls = 'badge-source-web'; }
    } else {
        if (!value || value === '' || (Array.isArray(value) && value.length === 0)) {
            sourceStr = 'Missing';
            isRed = true;
        }
    }
    
    let displayValue = value;
    if (Array.isArray(value)) displayValue = value.map(x => typeof x === 'object' ? JSON.stringify(x) : x).join(', ');
    else if (typeof value === 'object' && value !== null) displayValue = JSON.stringify(value);

    card.innerHTML = `
      <div class="schema-card-header">
        <span class="schema-title">${title}</span>
        <span class="badge-source ${sourceCls} ${isRed ? 'badge-score-red' : ''}" id="badge-${path.replace(/\./g, '-')}">${sourceStr}</span>
      </div>
      <div class="schema-value" contenteditable="true" data-path="${path}">${escapeHtml(displayValue || '')}</div>
    `;
    
    const valEl = card.querySelector('.schema-value');
    valEl.addEventListener('blur', (e) => {
        const newVal = e.target.innerText.trim();
        updateSeedValue(path, newVal);
        const badge = document.getElementById(`badge-${path.replace(/\./g, '-')}`);
        if(badge) {
            badge.className = 'badge-source badge-source-manual';
            badge.innerText = 'Manual';
        }
    });

    schemaGrid.appendChild(card);
  };
  
  const categories = ['company', 'product', 'audience', 'competition', 'market', 'content'];
  categories.forEach(cat => {
    if (seed[cat]) {
      Object.entries(seed[cat]).forEach(([k, v]) => {
          renderField(`${cat}.${k}`, v, `${cat} - ${k.replace(/_/g, ' ')}`);
      });
    }
  });
}

window.updateSeedValue = function(path, newValue) {
    const keys = path.split('.');
    let current = lastSeed;
    if (!current) current = lastSeed = buildSeed();
    
    for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
    }
    
    let parsedVal = newValue;
    try {
        if ((newValue.startsWith('[') && newValue.endsWith(']')) || 
            (newValue.startsWith('{') && newValue.endsWith('}'))) {
            parsedVal = JSON.parse(newValue);
        }
    } catch(e) {}
    
    current[keys[keys.length - 1]] = parsedVal;
    
    if (!window.fieldScores) window.fieldScores = {};
    let scoreCur = window.fieldScores;
    for (let i = 0; i < keys.length - 1; i++) {
        if (!scoreCur[keys[i]]) scoreCur[keys[i]] = {};
        scoreCur = scoreCur[keys[i]];
    }
    scoreCur[keys[keys.length - 1]] = { score: 'Green', source: 'Manual' };
};

function showCompletionScreen(written) {
  document.querySelectorAll('.step-section').forEach(el => el.style.display = 'none');
  navButtons.style.display   = 'none';
  publishBar.style.display   = 'none';
  progressFill.style.width   = '100%';
  currentStepNum.innerText   = 7;

  document.getElementById('completionMessage').textContent =
    `${written.length} MIR files populated with AI-generated content. Your agents are now context-aware and can begin executing marketing plans.`;

  completionScreen.style.display = 'block';
  document.getElementById('btnCloseWindow').style.display = 'inline-block';
}

function updateInterviewProgress() {
  const progressEl = document.getElementById('interviewProgress');
  if (!progressEl) return;
  progressEl.textContent = `Question ${interviewQuestionCount} of ${INTERVIEW_MAX_QUESTIONS}`;
}

function triggerInterviewAutoProceed(message) {
  if (interviewAutoProceedTriggered) return;
  interviewAutoProceedTriggered = true;

  const container = document.getElementById('interviewContainer');
  const btnSend = document.getElementById('btnSendAnswer');
  const inputEl = document.getElementById('interviewInput');
  const progressEl = document.getElementById('interviewProgress');

  if (btnSend) btnSend.disabled = true;
  if (inputEl) inputEl.disabled = true;
  if (progressEl) {
    progressEl.textContent = `Question ${INTERVIEW_MAX_QUESTIONS} of ${INTERVIEW_MAX_QUESTIONS}`;
  }

  container.innerHTML += `<div class="chat-msg agent">${message || 'Interview complete.'} Generating your drafts automatically...</div>`;
  container.scrollTop = container.scrollHeight;

  setTimeout(() => {
    handleDraftGeneration();
  }, 700);
}

// ── Conversational Interview Logic ──────────────────────────────────────────────
async function startInterview() {
  const container = document.getElementById('interviewContainer');
  const inputEl = document.getElementById('interviewInput');
  const btnSend = document.getElementById('btnSendAnswer');
  const btnSkip = document.getElementById('btnSkipChat');
  interviewQuestionCount = 0;
  interviewAutoProceedTriggered = false;
  updateInterviewProgress();

  const seed = buildSeed(); // merges current schema and form values
  
  if (!window.chatStarted) {
    container.innerHTML = `<div class="chat-msg agent">Hi! I'm reviewing what we have so far... give me a second.</div>`;
    window.chatStarted = true;
    
    btnSend.onclick = handleSendAnswer;
    btnSkip.onclick = () => {
      showStep(3); // Skip straight to Draft Generation
    };
    
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendAnswer();
      }
    });

    try {
      // 1. Check for competitor discovery
      const hasCompetitors = seed.competition?.competitors?.length > 0;
      if (!hasCompetitors) {
        container.innerHTML += `<div class="chat-msg agent typing-indicator">Searching the web for competitors...</div>`;
        container.scrollTop = container.scrollHeight;
        
        const compRes = await fetch('/api/competitor-discovery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyName: seed.company?.name || 'Unknown',
            industry: seed.company?.industry || seed.company?.business_model || ''
          })
        });

        document.querySelector('.typing-indicator')?.remove();

        const compData = await compRes.json();
        if (compData.success && compData.enrichedData && compData.enrichedData.competitors) {
          const comps = compData.enrichedData.competitors;
          window._tempComps = comps;
          
          container.innerHTML += `
            <div class="chat-msg agent" id="compCard">
              <p>We did some quick research and found these likely competitors. Please review and edit if needed:</p>
              <div style="margin-top:0.5rem; display:flex; flex-direction:column; gap:0.5rem;">
                <input type="text" id="aiComp0" value="${escapeHtml(comps[0]?.name || '')}" class="form-input" style="padding:0.4rem; color: #000;">
                <input type="text" id="aiComp1" value="${escapeHtml(comps[1]?.name || '')}" class="form-input" style="padding:0.4rem; color: #000;">
                <input type="text" id="aiComp2" value="${escapeHtml(comps[2]?.name || '')}" class="form-input" style="padding:0.4rem; color: #000;">
                <button class="btn-primary" id="btnConfirmComps" style="align-self: flex-start; padding: 0.5rem 1rem;">Confirm</button>
              </div>
            </div>`;
          
          container.scrollTop = container.scrollHeight;
          btnSend.disabled = true;
          inputEl.disabled = true;

          // Attach confirmation event handler
          document.getElementById('btnConfirmComps').onclick = async () => {
            const confirmed0 = document.getElementById('aiComp0').value;
            const confirmed1 = document.getElementById('aiComp1').value;
            const confirmed2 = document.getElementById('aiComp2').value;

            // Merge into local window.extractedSchema
            if (!window.extractedSchema) window.extractedSchema = {};
            if (!window.extractedSchema.competition) window.extractedSchema.competition = { competitors: [] };
            
            if (confirmed0) window.extractedSchema.competition.competitors.push({ name: confirmed0, differentiator: comps[0]?.differentiator || '' });
            if (confirmed1) window.extractedSchema.competition.competitors.push({ name: confirmed1, differentiator: comps[1]?.differentiator || '' });
            if (confirmed2) window.extractedSchema.competition.competitors.push({ name: confirmed2, differentiator: comps[2]?.differentiator || '' });

            if (compData.enrichedData.biggest_trend) {
                if (!window.extractedSchema.market) window.extractedSchema.market = {};
                window.extractedSchema.market.biggest_trend = compData.enrichedData.biggest_trend;
            }

            document.getElementById('compCard').innerHTML = `<p>Competitors confirmed! Moving on...</p>`;
            btnSend.disabled = false;
            inputEl.disabled = false;
            
            // Now start the normal gap-filling
            await proceedWithNextQuestion(buildSeed());
          };
          
          return; // Wait for user interaction
        }
      }

      // 2. Normal progression if no competitors found or already has them
      await proceedWithNextQuestion(seed);

    } catch (err) {
      document.querySelector('.typing-indicator')?.remove();
      container.innerHTML += `<div class="chat-msg agent" style="color:var(--danger)">Error connecting to AI: ${err.message}. You can skip to drafts.</div>`;
    }
    
    container.scrollTop = container.scrollHeight;
  }
}

async function proceedWithNextQuestion(currentSeed) {
  const container = document.getElementById('interviewContainer');
  const btnSend = document.getElementById('btnSendAnswer');
  const inputEl = document.getElementById('interviewInput');
  
  try {
    const response = await fetch('/api/generate-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schema: currentSeed,
        scores: window.fieldScores || {},
        questionCount: interviewQuestionCount,
      })
    });
    
    const resJSON = await response.json();
    if (resJSON.success && resJSON.question) {
      interviewQuestionCount += 1;
      updateInterviewProgress();
      window.currentMissingFields = resJSON.missingFields || [];
      container.innerHTML += `<div class="chat-msg agent">${resJSON.question}</div>`;
    } else {
      const reason = resJSON.completionReason === 'max_questions_reached'
        ? 'We hit the 5-question cap.'
        : 'It looks like we have everything we need!';
      triggerInterviewAutoProceed(reason);
    }
  } catch (err) {
    container.innerHTML += `<div class="chat-msg agent" style="color:var(--danger)">Error connecting to AI: ${err.message}. You can skip to drafts.</div>`;
  }
  container.scrollTop = container.scrollHeight;
}

async function handleSendAnswer() {
  const container = document.getElementById('interviewContainer');
  const inputEl = document.getElementById('interviewInput');
  const answer = inputEl.value.trim();
  const btnSend = document.getElementById('btnSendAnswer');
  
  if (!answer) return;
  
  // Add user message to chat
  container.innerHTML += `<div class="chat-msg user">${escapeHtml(answer)}</div>`;
  inputEl.value = '';
  container.scrollTop = container.scrollHeight;
  
  btnSend.disabled = true;
  inputEl.disabled = true;
  container.innerHTML += `<div class="chat-msg agent typing-indicator">Thinking...</div>`;
  container.scrollTop = container.scrollHeight;
  
  try {
    const seed = buildSeed();
    const response = await fetch('/api/parse-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schema: seed,
        missingFields: window.currentMissingFields,
        answer: answer
        // Note: keeping context history minimal for this wave, just passing the updated schema back
      })
    });
    
    const resJSON = await response.json();
    document.querySelector('.typing-indicator')?.remove();
    
    if (resJSON.success) {
      // Update our stored extracted schema and scores!
      window.extractedSchema = resJSON.updatedSchema;
      window.fieldScores = resJSON.scores;
      
      // Determine next question
      const qRes = await fetch('/api/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schema: window.extractedSchema,
          scores: window.fieldScores,
          questionCount: interviewQuestionCount,
        })
      });
      const qJSON = await qRes.json();
      if (qJSON.success && qJSON.question) {
        interviewQuestionCount += 1;
        updateInterviewProgress();
        window.currentMissingFields = qJSON.missingFields || [];
        container.innerHTML += `<div class="chat-msg agent">Got it! ${qJSON.question}</div>`;
      } else {
        const reason = qJSON.completionReason === 'max_questions_reached'
          ? 'We hit the 5-question cap.'
          : 'Awesome, I think I have a complete picture now!';
        triggerInterviewAutoProceed(reason);
      }
    } else {
      container.innerHTML += `<div class="chat-msg agent" style="color:var(--danger)">I couldn't quite process that. Could you clarify?</div>`;
    }
  } catch (err) {
    document.querySelector('.typing-indicator')?.remove();
    container.innerHTML += `<div class="chat-msg agent" style="color:var(--danger)">Network error: ${err.message}</div>`;
  }
  
  btnSend.disabled = false;
  inputEl.disabled = false;
  inputEl.focus();
  container.scrollTop = container.scrollHeight;
}

// ── Events ────────────────────────────────────────────────────────────────────
btnNext.addEventListener('click', () => {
  if (validateCurrentStep()) {
    saveDraft();
    if (window.posthog && posthog.capture) {
      posthog.capture('onboarding_step_completed', { step: currentStep });
    }
    showStep(currentStep + 1);
  }
});

btnBack.addEventListener('click', () => {
  if (currentStep === 3) {
    currentStep = 2;
    navButtons.style.display = 'flex';
    updateUI();
  } else {
    showStep(currentStep - 1);
  }
});

btnPublish.addEventListener('click', handlePublish);

window.addEventListener('beforeunload', () => {
  const hasDrafts = Object.keys(draftContents || {}).length > 0;
  const hasApprovals = Object.keys(approvedDrafts || {}).length > 0;
  if (!executionLoopCompleted && hasDrafts && hasApprovals && window.posthog && posthog.capture) {
    posthog.capture('execution_loop_abandoned', {
      project_slug: lastSlug,
      approved_count: Object.keys(approvedDrafts || {}).length,
    });
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && currentStep < 2) {
    e.preventDefault();
    btnNext.click();
  }
});

document.addEventListener('focusout', (e) => {
  if (e.target.matches('input, textarea, select') && currentStep < 3) {
    saveDraft();
  }
});

// ── Spark Popover Logic ───────────────────────────────────────────────────────
function initSparkButtons() {
  const sparkPopover = document.getElementById('sparkPopover');
  const sparkSuggestions = document.getElementById('sparkSuggestions');
  const sparkLoading = document.getElementById('sparkLoading');

  document.querySelectorAll('.spark-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const targetId = btn.getAttribute('data-target');
      const targetInput = document.getElementById(targetId);
      if (!targetInput) return;

      const rect = btn.getBoundingClientRect();
      const popoverWidth = 300; // matches CSS width
      
      let topPos = rect.bottom + window.scrollY + 5;
      let leftPos = rect.left + window.scrollX - (popoverWidth - rect.width);
      
      // Prevent bleeding off the left edge
      if (leftPos < 10) leftPos = 10;
      
      // Prevent bleeding off the right edge
      if (leftPos + popoverWidth > window.innerWidth - 10) {
        leftPos = window.innerWidth - popoverWidth - 10;
      }
      
      sparkPopover.style.top = `${topPos}px`;
      sparkPopover.style.left = `${leftPos}px`;
      sparkPopover.style.display = 'block';
      
      sparkSuggestions.innerHTML = '';
      sparkSuggestions.style.display = 'none';
      sparkLoading.style.display = 'block';
      
      try {
        const seed = buildSeed();
        const response = await fetch('/api/spark-suggestion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fieldName: targetInput.previousElementSibling?.textContent || targetId,
            currentState: seed
          })
        });
        
        const resJSON = await response.json();
        sparkLoading.style.display = 'none';
        
        if (response.status === 503 || resJSON.error === 'NO_AI_AVAILABLE') {
            btn.title = "Enable AI: add an API key or install Ollama";
            btn.style.opacity = '0.5';
            sparkPopover.style.display = 'none';
            alert('AI Models unavailable. Fallback missing. Please check your .env or start Ollama local server.');
            return;
        }

        if (resJSON.success && resJSON.suggestions) {
          sparkSuggestions.style.display = 'flex';
          resJSON.suggestions.forEach(sug => {
            const row = document.createElement('div');
            row.style.padding = '0.5rem';
            row.style.background = 'rgba(255,255,255,0.05)';
            row.style.borderRadius = '4px';
            row.style.cursor = 'pointer';
            row.style.fontSize = '0.9rem';
            row.textContent = sug;
            row.addEventListener('click', () => {
              targetInput.value = sug;
              sparkPopover.style.display = 'none';
            });
            row.addEventListener('mouseenter', () => row.style.background = 'rgba(255,255,255,0.1)');
            row.addEventListener('mouseleave', () => row.style.background = 'rgba(255,255,255,0.05)');
            sparkSuggestions.appendChild(row);
          });
        }
      } catch (err) {
        sparkLoading.style.display = 'none';
        sparkSuggestions.style.display = 'block';
        sparkSuggestions.innerHTML = `<div style="color:red; font-size: 0.9rem;">Error: ${err.message}</div>`;
      }
    });
  });

  document.addEventListener('click', (e) => {
    if (!sparkPopover.contains(e.target) && !e.target.classList.contains('spark-btn')) {
      sparkPopover.style.display = 'none';
    }
  });
}

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadConfig();
  await loadStatus();
  restoreDraft();
  updateUI();
  initOmniGate();
  initSparkButtons();
});

// ── Step 0: Omni-Gate Logic ───────────────────────────────────────────────────
function initOmniGate() {
  const dropzone = document.getElementById('omniDropzone');
  const fileInput = document.getElementById('omniFileInput');
  const filesList = document.getElementById('omniFilesList');
  const btnExtract = document.getElementById('btnExtract');
  const btnSkip = document.getElementById('btnSkipExtract');
  const terminal = document.getElementById('omniTerminal');
  const terminalLines = document.getElementById('terminalLines');
  const omniUrl = document.getElementById('omniUrl');

  let selectedFiles = [];

  dropzone.addEventListener('click', () => fileInput.click());

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
      handleFiles(Array.from(e.target.files));
    }
  });

  function handleFiles(files) {
    selectedFiles = [...selectedFiles, ...files];
    renderFiles();
  }

  function renderFiles() {
    filesList.innerHTML = selectedFiles.map((f, i) => 
      `<div>📄 ${f.name} <span style="color:var(--danger); cursor:pointer;" onclick="removeFile(${i})">✕</span></div>`
    ).join('');
  }

  window.removeFile = (idx) => {
    selectedFiles.splice(idx, 1);
    renderFiles();
  };

  btnSkip.addEventListener('click', () => {
    showStep(1);
  });

  btnExtract.addEventListener('click', async () => {
    const url = omniUrl.value.trim();
    if (!url && selectedFiles.length === 0) {
      alert("Please provide a URL or upload documents first.");
      return;
    }

    terminal.style.display = 'block';
    terminalLines.innerHTML = '';
    btnExtract.disabled = true;
    btnSkip.disabled = true;
    
    const addLog = (msg) => {
      const p = document.createElement('p');
      p.textContent = `> ${msg}`;
      terminalLines.appendChild(p);
      terminal.scrollTop = terminal.scrollHeight;
    };

    addLog('Initializing Omni-Input Extractions...');
    
    const formData = new FormData();
    if (url) {
      formData.append('url', url);
      addLog(`Connecting to ${new URL(url).hostname}...`);
    }

    selectedFiles.forEach(file => {
      formData.append('files', file);
      addLog(`Parsing ${file.name}...`);
    });

    try {
      const res = await fetch('/api/extract-sources', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      addLog('Extraction complete. [Done]');
      
      addLog('Analyzing and scoring schema fields...');
      const scoreRes = await fetch('/api/extract-and-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          webText: data.webText,
          fileText: data.fileText
        })
      });
      const scoreData = await scoreRes.json();
      
      if (!scoreData.success) throw new Error(scoreData.error);
      
      // Temporary storage for testing/review during Wave 2
      window.extractedSchema = scoreData.data || {};
      window.fieldScores = scoreData.scores || {};
      
      // Pre-fill Step 1
      if (window.extractedSchema?.company?.name) {
        const cNameEl = document.getElementById('companyName');
        if (cNameEl) cNameEl.value = window.extractedSchema.company.name;
      }
      if (window.extractedSchema?.company?.business_model) {
        const bModelEl = document.getElementById('businessModel');
        if (bModelEl) {
          // find matching option
          const val = window.extractedSchema.company.business_model;
          Array.from(bModelEl.options).forEach(opt => {
            if (opt.value.toLowerCase() === val.toLowerCase()) {
              bModelEl.value = opt.value;
            }
          });
        }
      }
      
      addLog('Smart mapping complete. Moving to intelligent gap-fill mode...');
      setTimeout(() => {
        showStep(1);
      }, 1500);

    } catch (err) {
      addLog(`Error: ${err.message}`);
      btnExtract.disabled = false;
      btnSkip.disabled = false;
    }
  });
}
