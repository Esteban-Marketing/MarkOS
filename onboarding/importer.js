'use strict';

const DEFAULT_SLUG = 'markos-client';

const brandLogo = document.getElementById('brandLogo');
const importerTitle = document.getElementById('importerTitle');
const importerSubtitle = document.getElementById('importerSubtitle');
const projectSlugInput = document.getElementById('projectSlug');
const vaultRootHint = document.getElementById('vaultRootHint');
const btnScanImport = document.getElementById('btnScanImport');
const btnApplyImport = document.getElementById('btnApplyImport');
const importerStatus = document.getElementById('importerStatus');
const reportCard = document.getElementById('reportCard');
const reportNotePath = document.getElementById('reportNotePath');
const resultsCard = document.getElementById('resultsCard');
const summaryGrid = document.getElementById('summaryGrid');
const resultList = document.getElementById('resultList');
const completionCard = document.getElementById('completionCard');
const completionCopy = document.getElementById('completionCopy');
const stepScan = document.getElementById('stepScan');
const stepApply = document.getElementById('stepApply');

let lastScanPayload = null;

function getQuerySlug() {
  const params = new URLSearchParams(window.location.search);
  return params.get('project_slug') || params.get('slug') || '';
}

function setStatus(message) {
  importerStatus.textContent = message;
}

function setBusy(scanBusy, applyBusy) {
  btnScanImport.disabled = scanBusy || applyBusy;
  btnApplyImport.disabled = applyBusy || !lastScanPayload;
  btnScanImport.textContent = scanBusy ? 'Scanning...' : 'Scan Legacy Files';
  btnApplyImport.textContent = applyBusy ? 'Applying...' : 'Apply Import';
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderSummary(totals = {}) {
  const cards = [
    { label: 'Eligible', value: totals.eligible || 0, helper: 'Imported or imported with warnings' },
    { label: 'Blocked', value: totals.blocked || 0, helper: 'Need manual review before import' },
    { label: 'Warnings', value: totals.imported_with_warnings || 0, helper: 'Imported, but review outcome details' },
    { label: 'Total Files', value: totals.total || 0, helper: 'Legacy markdown files inspected' },
  ];

  summaryGrid.innerHTML = cards.map((card) => `
    <article class="importer-summary-card">
      <strong>${escapeHtml(card.value)}</strong>
      <div>${escapeHtml(card.label)}</div>
      <p class="form-helper">${escapeHtml(card.helper)}</p>
    </article>
  `).join('');
}

function renderItems(items = []) {
  resultList.innerHTML = items.map((item) => {
    const outcome = item.outcome || 'skipped';
    const reason = item.reason || (Array.isArray(item.warnings) && item.warnings.length > 0 ? item.warnings.join(' | ') : '');
    return `
      <article class="importer-row outcome-${escapeHtml(outcome)}">
        <div class="importer-row-grid">
          <div class="importer-path-block">
            <span class="importer-path-label">Legacy Source</span>
            <span class="importer-path-value">${escapeHtml(item.source_path || item.source_key || 'Unknown source')}</span>
          </div>
          <div class="importer-path-block">
            <span class="importer-path-label">Canonical Destination</span>
            <span class="importer-path-value">${escapeHtml(item.destination_path || 'No destination')}</span>
          </div>
          <div>
            <span class="outcome-badge ${escapeHtml(outcome)}">${escapeHtml(outcome.replace(/_/g, ' '))}</span>
          </div>
        </div>
        ${reason ? `<p class="importer-reason">${escapeHtml(reason)}</p>` : ''}
      </article>
    `;
  }).join('');
}

function renderResult(payload, phase) {
  resultsCard.classList.remove('d-none');
  renderSummary(payload.totals || {});
  renderItems(payload.items || []);

  const reportPath = payload.report_note_path;
  if (reportPath) {
    reportCard.classList.remove('d-none');
    reportNotePath.textContent = `Report note: ${reportPath}`;
  } else {
    reportCard.classList.add('d-none');
    reportNotePath.textContent = 'A durable report note will appear here after import is applied.';
  }

  if (phase === 'apply') {
    completionCard.classList.remove('d-none');
    completionCopy.textContent = payload.outcome?.message || 'Import applied. Review the report note for any blocked items.';
    stepApply.classList.add('active');
  } else {
    completionCard.classList.add('d-none');
    stepApply.classList.remove('active');
  }
}

async function postImporter(endpoint) {
  const slug = projectSlugInput.value.trim() || DEFAULT_SLUG;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug }),
  });
  const payload = await response.json();
  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || payload.error || 'Importer request failed.');
  }
  return payload;
}

async function handleScan() {
  try {
    setBusy(true, false);
    setStatus('Scanning compatibility folders for importable markdown...');
    const payload = await postImporter('/api/importer/scan');
    lastScanPayload = payload;
    btnApplyImport.disabled = false;
    stepScan.classList.add('active');
    renderResult(payload, 'scan');
    setStatus(payload.outcome?.message || 'Scan complete. Review eligible and blocked items below.');
  } catch (error) {
    setStatus(error.message);
  } finally {
    setBusy(false, false);
  }
}

async function handleApply() {
  try {
    setBusy(false, true);
    setStatus('Applying legacy import into canonical vault notes...');
    const payload = await postImporter('/api/importer/apply');
    renderResult(payload, 'apply');
    setStatus(payload.outcome?.message || 'Import applied successfully.');
  } catch (error) {
    setStatus(error.message);
  } finally {
    setBusy(false, false);
  }
}

async function loadConfig() {
  try {
    const response = await fetch('/config');
    if (!response.ok) return;
    const payload = await response.json();
    const config = payload.config || payload;
    if (config.form_title) {
      importerTitle.textContent = `${config.form_title} Legacy Importer`;
    }
    if (config.brand_logo_url) {
      brandLogo.src = config.brand_logo_url;
      brandLogo.style.display = 'inline-block';
    }
    importerSubtitle.textContent = 'Scan MIR and MSP markdown, then import eligible notes into the canonical vault.';
    vaultRootHint.textContent = `Canonical vault root: ${config.canonical_vault?.root_path || config.vault_root_path || 'MarkOS-Vault'}`;
    projectSlugInput.value = getQuerySlug() || payload.slug || config.project_slug || DEFAULT_SLUG;
  } catch (_error) {
    projectSlugInput.value = getQuerySlug() || DEFAULT_SLUG;
  }
}

btnScanImport.addEventListener('click', handleScan);
btnApplyImport.addEventListener('click', handleApply);

loadConfig();