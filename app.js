const STORAGE_KEY = 'sniffle-data-v2';
const MEDICINES = [
  { id: 'sumatriptan-20', name: 'Sumatriptan', form: 'Nasal spray', unit: 'mg', defaultDose: 20, concentration: 200, density: 1.02 },
  { id: 'zolmitriptan-5', name: 'Zolmitriptan', form: 'Nasal spray', unit: 'mg', defaultDose: 5, concentration: 50, density: 1.01 },
  { id: 'desmopressin-10', name: 'Desmopressin', form: 'Nasal spray', unit: 'mcg', defaultDose: 10, concentration: 100, density: 1 },
  { id: 'saline', name: 'Saline', form: 'Nasal spray', unit: 'mL', defaultDose: 0.1, concentration: null, density: 1 }
];
const defaults = { profile: null, medication: { id: 'sumatriptan-20', dose: 20 }, history: [] };
let data;
try { data = { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; } catch { data = { ...defaults }; }
const $ = selector => document.querySelector(selector);
const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
const medicine = () => MEDICINES.find(item => item.id === data.medication.id) || MEDICINES[0];
const formatNumber = value => Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 });
const showOverlay = (selector, show) => { const el = $(selector); el.classList.toggle('show', show); el.setAttribute('aria-hidden', String(!show)); };
const toast = message => { const el = $('#toast'); el.textContent = message; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2200); };

function approximateVolumeMl(item, dose) {
  if (item.unit === 'mL') return dose;
  if (!item.concentration || !item.density) return null;
  // Derive solution mass from concentration and density, then convert it back to volume.
  // This visualises a prescribed dose; it never recommends one.
  const activeFractionPerGram = item.concentration / item.density;
  const solutionMassGrams = dose / activeFractionPerGram;
  return solutionMassGrams / item.density;
}

function lineGeometry() {
  const item = medicine();
  const volumeMl = approximateVolumeMl(item, Number(data.medication.dose));
  if (!volumeMl) return { width: 250, height: 12, volumeMl: null };
  // 1 mL = 1,000 mm³. Model a 4 mm-high, semicircular bead: area = πr²/2.
  const crossSectionMm2 = Math.PI * 2 * 2 / 2;
  const physicalLengthMm = volumeMl * 1000 / crossSectionMm2;
  // Scale physical millimetres for legibility while retaining relative medicine volumes.
  return { width: Math.max(90, Math.min(300, physicalLengthMm * 3)), height: 14, volumeMl };
}

function renderMedication() {
  const item = medicine();
  const dose = formatNumber(data.medication.dose);
  $('#home-medication').textContent = item.name;
  $('#home-medication-detail').textContent = `${item.form} · As prescribed`;
  $('#home-dose').textContent = dose; $('#home-unit').textContent = item.unit;
  $('#guide-dose').textContent = `${dose} ${item.unit}`; $('#guide-medication').textContent = `${item.name} ${item.form.toLowerCase()}`;
  const geometry = lineGeometry();
  document.documentElement.style.setProperty('--dose-line-width', `${geometry.width}px`);
  document.documentElement.style.setProperty('--dose-line-height', `${geometry.height}px`);
  $('#volume-note').textContent = geometry.volumeMl ? `Approx. ${formatNumber(geometry.volumeMl)} mL visualised as a 4 mm-high line` : 'Approximate visual guide';
}

function renderProfile() {
  if (!data.profile) return;
  $('#user-name').textContent = data.profile.name;
  $('#name').value = data.profile.name; $('#gender').value = data.profile.gender;
  $('#weight').value = data.profile.weight; $('#height').value = data.profile.height;
}

function renderHistory() {
  const entries = [...data.history].sort((a, b) => new Date(b.date) - new Date(a.date));
  $('#week-total').textContent = entries.length;
  $('#history-list').innerHTML = entries.length ? entries.map(entry => {
    const date = new Date(entry.date);
    return `<article class="history-entry"><time>${date.getDate()}</time><div><strong>${entry.medication}</strong><p>${date.toLocaleDateString('en-US', { weekday: 'long' })} · ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p></div><b>${entry.amount}</b></article>`;
  }).join('') : '<p class="subtitle">No confirmed doses yet.</p>';
}

function navigate(name) {
  document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
  $(`#${name}-view`).classList.add('active');
  $('.bottom-nav').style.display = name === 'guide' ? 'none' : 'flex';
  document.querySelectorAll('[data-nav]').forEach(button => button.classList.toggle('active', button.dataset.nav === name));
  if (name === 'history') renderHistory();
  scrollTo({ top: 0, behavior: 'smooth' });
}

function populateMedicationForm() {
  $('#medication-select').innerHTML = MEDICINES.map(item => `<option value="${item.id}">${item.name} — ${item.form}</option>`).join('');
  $('#medication-select').value = data.medication.id;
  updateMedicationFields(false);
}
function updateMedicationFields(useDefault = true) {
  const item = MEDICINES.find(entry => entry.id === $('#medication-select').value);
  if (useDefault) $('#dose-input').value = item.defaultDose;
  else $('#dose-input').value = data.medication.dose;
  $('#dose-unit').value = item.unit;
  $('#medicine-info').textContent = item.concentration ? `Visual model: ${item.concentration} ${item.unit}/mL concentration · ${item.density} g/mL density` : `Visual model density: ${item.density} g/mL`;
}

document.querySelectorAll('[data-nav]').forEach(button => button.addEventListener('click', () => navigate(button.dataset.nav)));
$('#start-guide').addEventListener('click', () => navigate('guide'));
$('#close-guide').addEventListener('click', () => navigate('home'));
$('#edit-medication').addEventListener('click', () => { populateMedicationForm(); showOverlay('#medication-overlay', true); });
$('#close-medication').addEventListener('click', () => showOverlay('#medication-overlay', false));
$('#medication-select').addEventListener('change', () => updateMedicationFields(true));
$('#medication-form').addEventListener('submit', event => { event.preventDefault(); data.medication = { id: $('#medication-select').value, dose: Number($('#dose-input').value) }; save(); renderMedication(); showOverlay('#medication-overlay', false); toast('Medication updated ✓'); });

$('#setup-form').addEventListener('submit', event => {
  event.preventDefault();
  data.profile = { name: $('#setup-name').value.trim(), gender: $('#setup-gender').value, weight: Number($('#setup-weight').value), height: Number($('#setup-height').value) };
  save(); renderProfile(); showOverlay('#setup-overlay', false); populateMedicationForm(); showOverlay('#medication-overlay', true);
});
$('#profile-form').addEventListener('submit', event => { event.preventDefault(); data.profile = { name: $('#name').value.trim(), gender: $('#gender').value, weight: Number($('#weight').value), height: Number($('#height').value) }; save(); renderProfile(); toast('Saved on this device ✓'); });

$('#ready-button').addEventListener('click', async () => {
  $('#ready-button').disabled = true; const cue = $('#cues').checked;
  $('#guide-title').textContent = 'Here we go'; $('#guide-subtitle').textContent = 'Follow along with your guide.';
  for (const step of ['3', '2', '1', 'GO!']) { $('#countdown').textContent = step; if (cue && navigator.vibrate) navigator.vibrate(step === 'GO!' ? [70, 40, 100] : 45); await new Promise(resolve => setTimeout(resolve, step === 'GO!' ? 650 : 720)); }
  $('#countdown').textContent = ''; $('#vacuum').classList.add('go'); $('#track-fill').classList.add('consume');
  await new Promise(resolve => setTimeout(resolve, 3400)); showOverlay('#completion', true);
});
function resetGuide() { showOverlay('#completion', false); $('#vacuum').classList.remove('go'); $('#track-fill').classList.remove('consume'); $('#ready-button').disabled = false; $('#guide-title').textContent = 'Ready when you are'; $('#guide-subtitle').textContent = 'Take a breath. There’s no rush.'; navigate('home'); }
$('#log-dose').addEventListener('click', () => { const item = medicine(); data.history.push({ medication: item.name, amount: `${formatNumber(data.medication.dose)} ${item.unit}`, date: new Date().toISOString() }); save(); resetGuide(); toast('Dose logged privately ✓'); });
$('#not-taken').addEventListener('click', resetGuide);
$('#clear-history').addEventListener('click', () => { data.history = []; save(); renderHistory(); toast('Local history cleared'); });

$('#week-row').innerHTML = ['M','T','W','T','F','S','S'].map((day, i) => `<div class="day ${i < 3 ? 'done' : i === 3 ? 'today' : ''}">${day}<span>${i < 3 ? '✓' : 10 + i}</span></div>`).join('');
renderMedication(); renderProfile(); renderHistory(); save();
if (!data.profile?.name) showOverlay('#setup-overlay', true);
