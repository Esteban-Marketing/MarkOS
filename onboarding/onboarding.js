// onboarding.js — MGSD Client Onboarding v2.0
// Handles 7-step form flow + AI draft generation + MIR publish

'use strict';

// ── Configuration & State ─────────────────────────────────────────────────────
const STORAGE_KEY  = 'mgsd-onboarding-draft';
const TOTAL_STEPS  = 7;
let currentStep    = 1;
let lastSeed       = null;   // seed built on step 6 submit
let lastSlug       = null;   // slug returned by server
let approvedDrafts = {};     // { section_key: content }
let draftContents  = {};     // { section_key: original content }

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
  try {
    const res = await fetch('/config');
    if (res.ok) {
      const config = await res.json();
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
      }
    }
  } catch (err) {
    console.warn('Could not load config from server, using defaults.');
  }
}

let isChromaOffline = false;

async function loadStatus() {
  try {
    const res = await fetch('/status');
    if (res.ok) {
      const status = await res.json();
      if (!status.chromadb) {
        isChromaOffline = true;
      }
    }
  } catch (err) {
    isChromaOffline = true;
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

  const percent = ((currentStep - 1) / TOTAL_STEPS) * 100;
  progressFill.style.width = `${percent}%`;
  currentStepNum.innerText = currentStep;

  btnBack.disabled = (currentStep === 1);

  if (currentStep === 6) {
    if (isChromaOffline) {
      btnNext.innerText = '⚠️ Vector DB Offline (Cannot Generate AI Drafts)';
      btnNext.disabled = true;
      btnNext.style.backgroundColor = '#6b7280';
    } else {
      btnNext.innerText = 'Generate AI Drafts →';
      btnNext.disabled = false;
    }
  } else if (currentStep === 7) {
    // Navigation hidden on step 7 — handled by draft cards + publish button
    navButtons.style.display = 'none';
    return;
  } else {
    btnNext.innerText = 'Save & Continue';
  }
  navButtons.style.display = 'flex';
}

function showStep(stepIndex) {
  if (stepIndex < 1) return;
  if (stepIndex > TOTAL_STEPS) return;

  if (stepIndex === 7) {
    handleDraftGeneration();
    return;
  }

  currentStep = stepIndex;
  updateUI();
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

  if (currentStep === 6) {
    const checkboxes = currentSection.querySelectorAll('.checkbox-input');
    const isChecked = Array.from(checkboxes).some(cb => cb.checked);
    if (!isChecked) {
      isValid = false;
      const container = currentSection.querySelector('.checkbox-grid').parentElement;
      container.style.color = '#ef4444';
      setTimeout(() => { container.style.color = ''; }, 2000);
    }
  }

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
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    const data = JSON.parse(saved);

    Object.keys(data).forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (el.type === 'checkbox' || el.type === 'radio') {
          el.checked = data[id];
        } else {
          el.value = data[id];
        }
      } else if (id === 'activeChannels') {
        const checkboxes = document.querySelectorAll(`input[name="${id}"]`);
        checkboxes.forEach(cb => {
          if (data[id].includes(cb.value)) cb.checked = true;
        });
      }
    });

    if (data.comp2Name) {
      addCompetitor();
      ['comp2Name','comp2Url','comp2Diff','comp2Gap'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = data[id] || '';
      });
    }
    if (data.comp3Name) {
      addCompetitor();
      ['comp3Name','comp3Url','comp3Diff','comp3Gap'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = data[id] || '';
      });
    }
  } catch (e) {}
}

// ── Form Data Collection ──────────────────────────────────────────────────────
function gatherFormData() {
  const data = {};
  document.querySelectorAll('input:not([type=checkbox]), textarea, select').forEach(input => {
    data[input.id] = input.value;
  });
  data['activeChannels'] = Array.from(
    document.querySelectorAll('input[name="activeChannels"]:checked')
  ).map(cb => cb.value);
  return data;
}

function buildSeed() {
  const d = gatherFormData();

  let score = 0;
  if (d.companyName && d.mission)          score++;
  if (d.productName && d.primaryBenefit)   score++;
  if (d.segmentName && d.painPoint1)       score++;
  if (d.comp1Name   && d.comp1Diff)        score++;
  if (d.marketMaturity && d.biggestTrend)  score++;
  if (d.activeChannels.length > 0)         score++;

  const seed = {
    metadata: {
      generated:          new Date().toISOString(),
      version:            '2.0',
      completeness_score: score,
    },
    company: {
      name:             d.companyName || '',
      industry:         d.industry || '',
      country:          d.country || '',
      founded:          d.founded || '',
      mission:          d.mission || '',
      brand_values:     [d.brandValue1, d.brandValue2, d.brandValue3].filter(v => v),
      tone_of_voice:    d.toneOfVoice || '',
      primary_language: d.primaryLanguage || '',
    },
    product: {
      name:             d.productName || '',
      category:         d.productCategory || '',
      primary_benefit:  d.primaryBenefit || '',
      top_features:     [d.productFeature1, d.productFeature2, d.productFeature3].filter(v => v),
      price_range:      d.priceRange || '',
      main_objection:   d.mainObjection || '',
    },
    audience: {
      segment_name:    d.segmentName || '',
      age_range:       d.ageRange || '',
      job_title:       d.jobTitle || '',
      pain_points:     [d.painPoint1, d.painPoint2, d.painPoint3].filter(v => v),
      online_hangouts: d.onlineHangouts || '',
      vocabulary:      d.vocabulary || '',
    },
    competition: { competitors: [] },
    market: {
      maturity:           d.marketMaturity || '',
      biggest_trend:      d.biggestTrend || '',
      seasonal_patterns:  d.seasonalPatterns || '',
      regulatory_concern: d.regulatoryConcern || '',
    },
    content: {
      best_piece_url: d.bestPieceUrl || '',
      active_channels: d.activeChannels || [],
      monthly_output:  d.monthlyOutput || '',
      best_format:     d.bestFormat || '',
    },
  };

  if (d.comp1Name) seed.competition.competitors.push({ name: d.comp1Name, url: d.comp1Url, differentiator: d.comp1Diff, gap: d.comp1Gap });
  if (d.comp2Name) seed.competition.competitors.push({ name: d.comp2Name, url: d.comp2Url, differentiator: d.comp2Diff, gap: d.comp2Gap });
  if (d.comp3Name) seed.competition.competitors.push({ name: d.comp3Name, url: d.comp3Url, differentiator: d.comp3Diff, gap: d.comp3Gap });

  return seed;
}

// ── Step 7: Draft Generation ───────────────────────────────────────────────────
async function handleDraftGeneration() {
  if (!validateCurrentStep()) return;
  saveDraft();

  lastSeed = buildSeed();

  // Show step 7
  currentStep = 7;
  updateUI();

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

    renderDraftCards(draftContents);
    localStorage.removeItem(STORAGE_KEY);

  } catch (err) {
    loadingOverlay.classList.remove('active');
    draftGrid.innerHTML = `
      <div style="text-align:center; padding: 2rem; color: #ef4444;">
        <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">⚠️</div>
        <strong>Draft generation failed</strong><br>
        <small style="color: #6b7280">${err.message}</small><br><br>
        <button class="btn-secondary" onclick="handleDraftGeneration()">Try Again</button>
      </div>`;
  }
}

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
    .replace(/>/g, '&gt;');
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
  } catch (err) {
    textarea.value = `[Error: ${err.message}]`;
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
      gateStatusBar.style.display = 'block';
      gateStatusBar.textContent   = `✓ ${written.length} MIR files written. STATE.md updated. Gate 1 is progressing.`;

      setTimeout(() => showCompletionScreen(written), 1200);
    } else {
      btnPublish.disabled    = false;
      btnPublish.textContent = '🚀 Publish & Activate MIR';
      const errors = (result.errors || []).join('\n');
      alert(`Publish encountered errors:\n${errors}`);
    }
  } catch (err) {
    btnPublish.disabled    = false;
    btnPublish.textContent = '🚀 Publish & Activate MIR';
    alert(`Publish failed: ${err.message}`);
  }
}

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

// ── Add Competitor ────────────────────────────────────────────────────────────
function addCompetitor() {
  if (competitorCount >= 3) return;
  competitorCount++;

  const div = document.createElement('div');
  div.className = 'repeatable-item';
  div.innerHTML = `
    <div class="repeatable-title">Competitor ${competitorCount}</div>
    <div class="form-group">
      <input type="text" id="comp${competitorCount}Name" class="form-input" placeholder="Competitor Name">
    </div>
    <div class="form-group">
      <input type="url" id="comp${competitorCount}Url" class="form-input" placeholder="Website URL (e.g. https://...)">
    </div>
    <div class="form-group">
      <input type="text" id="comp${competitorCount}Diff" class="form-input" placeholder="Our #1 differentiator against them">
    </div>
    <div class="form-group" style="margin-bottom: 0;">
      <input type="text" id="comp${competitorCount}Gap" class="form-input" placeholder="What are they missing in their messaging?">
    </div>
  `;
  competitorsContainer.appendChild(div);

  if (competitorCount === 3) {
    addCompetitorBtn.style.display = 'none';
  }
}

// ── Events ────────────────────────────────────────────────────────────────────
btnNext.addEventListener('click', () => {
  if (validateCurrentStep()) {
    saveDraft();
    showStep(currentStep + 1);
  }
});

btnBack.addEventListener('click', () => {
  if (currentStep === 7) {
    currentStep = 6;
    navButtons.style.display = 'flex';
    updateUI();
  } else {
    showStep(currentStep - 1);
  }
});

btnPublish.addEventListener('click', handlePublish);

addCompetitorBtn.addEventListener('click', addCompetitor);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && currentStep < 6) {
    e.preventDefault();
    btnNext.click();
  }
});

document.addEventListener('focusout', (e) => {
  if (e.target.matches('input, textarea, select') && currentStep < 7) {
    saveDraft();
  }
});

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadConfig();
  await loadStatus();
  restoreDraft();
  updateUI();
});
