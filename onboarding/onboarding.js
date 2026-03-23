// Configuration & State
const STORAGE_KEY = 'mgsd-onboarding-draft';
const TOTAL_STEPS = 6;
let currentStep = 1;

// Elements
const stepSections = document.querySelectorAll('.step-section');
const btnNext = document.getElementById('btnNext');
const btnBack = document.getElementById('btnBack');
const progressFill = document.getElementById('progressFill');
const currentStepNum = document.getElementById('currentStepNum');
const navButtons = document.getElementById('navButtons');
const completionScreen = document.getElementById('completionScreen');
const addCompetitorBtn = document.getElementById('addCompetitorBtn');
const competitorsContainer = document.getElementById('competitorsContainer');

// State for dynamic fields
let competitorCount = 1;

// Config Init
async function loadConfig() {
    try {
        const res = await fetch('onboarding-config.json');
        if (res.ok) {
            const config = await res.json();
            
            // Apply config
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
            if (config.completion_message) {
                document.getElementById('completionMessage').innerText = config.completion_message;
            }
        }
    } catch (err) {
        console.warn('Could not load onboarding-config.json, using defaults.');
    }
}

// Navigation Logic
function updateUI() {
    // Hide all steps, show current
    stepSections.forEach(section => {
        section.classList.remove('active');
        if (parseInt(section.getAttribute('data-step')) === currentStep) {
            section.classList.add('active');
        }
    });

    // Update Progress Bar
    const percent = ((currentStep - 1) / TOTAL_STEPS) * 100;
    progressFill.style.width = `${percent}%`;
    currentStepNum.innerText = currentStep;

    // Buttons
    btnBack.disabled = (currentStep === 1);
    
    if (currentStep === TOTAL_STEPS) {
        btnNext.innerText = 'Submit Intelligence';
    } else {
        btnNext.innerText = 'Save & Continue';
    }
}

function showStep(stepIndex) {
    if (stepIndex > TOTAL_STEPS) {
        handleSubmit();
        return;
    }
    if (stepIndex < 1) return;
    
    currentStep = stepIndex;
    updateUI();
}

function validateCurrentStep() {
    const currentSection = document.querySelector(`.step-section[data-step="${currentStep}"]`);
    const requiredInputs = currentSection.querySelectorAll('input[required], textarea[required], select[required]');
    let isValid = true;

    // Clear previous invalid classes
    currentSection.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));

    requiredInputs.forEach(input => {
        if (!input.value.trim()) {
            isValid = false;
            input.classList.add('invalid');
            // Remove invalid class on typing
            input.addEventListener('input', () => input.classList.remove('invalid'), { once: true });
        }
    });

    // Custom Validation (e.g. at least one checkbox in step 6 if required)
    if (currentStep === 6) {
        const checkboxes = currentSection.querySelectorAll('.checkbox-input');
        const isChecked = Array.from(checkboxes).some(cb => cb.checked);
        if (!isChecked) {
            isValid = false;
            // Optionally blink the group
            const container = currentSection.querySelector('.checkbox-grid').parentElement;
            container.style.color = '#ef4444';
            setTimeout(() => { container.style.color = ''; }, 2000);
        }
    }

    return isValid;
}

// Persist Drafts
function saveDraft() {
    const formData = gatherFormData();
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch (e) {
        console.warn("Could not save to localStorage");
    }
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
            } else if (id === "activeChannels") {
                const checkboxes = document.querySelectorAll(`input[name="${id}"]`);
                checkboxes.forEach(cb => {
                    if (data[id].includes(cb.value)) {
                        cb.checked = true;
                    }
                });
            }
        });
        
        // Handling dynamic repeatable competitor rows isn't strictly necessary for MVP, but to be robust:
        if (data.comp2Name) {
            addCompetitor();
            document.getElementById('comp2Name').value = data.comp2Name || '';
            document.getElementById('comp2Url').value = data.comp2Url || '';
            document.getElementById('comp2Diff').value = data.comp2Diff || '';
            document.getElementById('comp2Gap').value = data.comp2Gap || '';
        }
        if (data.comp3Name) {
            addCompetitor();
            document.getElementById('comp3Name').value = data.comp3Name || '';
            document.getElementById('comp3Url').value = data.comp3Url || '';
            document.getElementById('comp3Diff').value = data.comp3Diff || '';
            document.getElementById('comp3Gap').value = data.comp3Gap || '';
        }
    } catch (e) {
        console.warn("Could not restore from localStorage", e);
    }
}

function gatherFormData() {
    const data = {};
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        if (input.type === 'checkbox') {
            // Checkboxes are handled grouped by name natively in buildSeed
        } else {
            data[input.id] = input.value;
        }
    });
    
    // Checkboxes
    const channels = Array.from(document.querySelectorAll('input[name="activeChannels"]:checked')).map(cb => cb.value);
    data["activeChannels"] = channels;

    return data;
}

function buildSeed() {
    const d = gatherFormData();

    // Determine completeness score based on some non-empty metrics per section
    let score = 0;
    if (d.companyName && d.mission) score++;
    if (d.productName && d.primaryBenefit) score++;
    if (d.segmentName && d.painPoint1) score++;
    if (d.comp1Name && d.comp1Diff) score++;
    if (d.marketMaturity && d.biggestTrend) score++;
    if (d.activeChannels.length > 0) score++;

    const seed = {
        "metadata": {
            "generated": new Date().toISOString(),
            "version": "1.0",
            "completeness_score": score
        },
        "company": {
            "name": d.companyName || "",
            "industry": d.industry || "",
            "country": d.country || "",
            "founded": d.founded || "",
            "mission": d.mission || "",
            "brand_values": [d.brandValue1, d.brandValue2, d.brandValue3].filter(v => v),
            "tone_of_voice": d.toneOfVoice || "",
            "primary_language": d.primaryLanguage || ""
        },
        "product": {
            "name": d.productName || "",
            "category": d.productCategory || "",
            "primary_benefit": d.primaryBenefit || "",
            "top_features": [d.productFeature1, d.productFeature2, d.productFeature3].filter(v => v),
            "price_range": d.priceRange || "",
            "main_objection": d.mainObjection || ""
        },
        "audience": {
            "segment_name": d.segmentName || "",
            "age_range": d.ageRange || "",
            "job_title": d.jobTitle || "",
            "pain_points": [d.painPoint1, d.painPoint2, d.painPoint3].filter(v => v),
            "online_hangouts": d.onlineHangouts || "",
            "vocabulary": d.vocabulary || ""
        },
        "competition": {
            "competitors": []
        },
        "market": {
            "maturity": d.marketMaturity || "",
            "biggest_trend": d.biggestTrend || "",
            "seasonal_patterns": d.seasonalPatterns || "",
            "regulatory_concern": d.regulatoryConcern || ""
        },
        "content": {
            "best_piece_url": d.bestPieceUrl || "",
            "active_channels": d.activeChannels || [],
            "monthly_output": d.monthlyOutput || "",
            "best_format": d.bestFormat || ""
        }
    };

    // Competitive Intel Additions
    if (d.comp1Name) seed.competition.competitors.push({ name: d.comp1Name, url: d.comp1Url, differentiator: d.comp1Diff, gap: d.comp1Gap });
    if (d.comp2Name) seed.competition.competitors.push({ name: d.comp2Name, url: d.comp2Url, differentiator: d.comp2Diff, gap: d.comp2Gap });
    if (d.comp3Name) seed.competition.competitors.push({ name: d.comp3Name, url: d.comp3Url, differentiator: d.comp3Diff, gap: d.comp3Gap });

    return seed;
}

function handleSubmit() {
    if (!validateCurrentStep()) return;
    
    // Save to localstorage
    saveDraft();
    
    // Build Payload
    const data = buildSeed();
    const jsonStr = JSON.stringify(data, null, 2);

    // Download Logic
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = "onboarding-seed.json";
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);

    // If serving via node POST route is needed in the future, we can add a fetch POST here.
    // For now, downloading locally places it via browser, or the server handles it if POST is supported.

    // Show completion UI
    document.querySelectorAll('.step-section, .step-indicator').forEach(el => el.style.display = 'none');
    navButtons.style.display = 'none';
    progressFill.style.width = '100%';
    
    completionScreen.style.display = 'block';
    
    // Clear draft storage
    localStorage.removeItem(STORAGE_KEY);
}

// Add competitor form rows dynamically
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

// Events
btnNext.addEventListener('click', () => {
    if (validateCurrentStep()) {
        saveDraft();
        showStep(currentStep + 1);
    }
});

btnBack.addEventListener('click', () => {
    showStep(currentStep - 1);
});

addCompetitorBtn.addEventListener('click', addCompetitor);

document.addEventListener('keydown', (e) => {
    // Only intercept enter on non-textarea fields
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        if (currentStep < TOTAL_STEPS) {
            btnNext.click();
        }
    }
});

// Auto-save on blur 
document.addEventListener('focusout', (e) => {
    if (e.target.matches('input, textarea, select')) {
        saveDraft();
    }
});

// Boot
document.addEventListener('DOMContentLoaded', async () => {
    await loadConfig();
    restoreDraft();
    updateUI();
});
