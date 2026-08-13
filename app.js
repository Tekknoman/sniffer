const STORAGE_KEY = 'sniffle-data-v1';
const defaults = { profile: { gender: 'Prefer not to say', weight: 68, height: 172 }, history: [{ medication: 'Sumatriptan', amount: '20 mg', date: '2026-08-12T09:04:00' }] };
let data = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || defaults;
const $ = (selector) => document.querySelector(selector);
const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
const toast = (message) => { const el = $('#toast'); el.textContent = message; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2200); };

function renderWeek() {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  $('#week-row').innerHTML = days.map((day, i) => `<div class="day ${i < 3 ? 'done' : i === 3 ? 'today' : ''}">${day}<span>${i < 3 ? '✓' : 10 + i}</span></div>`).join('');
}

function renderHistory() {
  const entries = [...data.history].sort((a,b) => new Date(b.date) - new Date(a.date));
  $('#week-total').textContent = Math.max(5, entries.length);
  $('#history-list').innerHTML = entries.length ? entries.map(entry => {
    const date = new Date(entry.date);
    return `<article class="history-entry"><time>${date.getDate()}</time><div><strong>${entry.medication}</strong><p>${date.toLocaleDateString('en-US',{weekday:'long'})} · ${date.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}</p></div><b>${entry.amount}</b></article>`;
  }).join('') : '<p class="subtitle">No confirmed doses yet.</p>';
}

function navigate(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  $(`#${name}-view`).classList.add('active');
  $('.bottom-nav').style.display = name === 'guide' ? 'none' : 'flex';
  document.querySelectorAll('[data-nav]').forEach(b => b.classList.toggle('active', b.dataset.nav === name));
  if (name === 'history') renderHistory();
  scrollTo({top: 0, behavior: 'smooth'});
}

document.querySelectorAll('[data-nav]').forEach(button => button.addEventListener('click', () => navigate(button.dataset.nav)));
$('#start-guide').addEventListener('click', () => navigate('guide'));
$('#close-guide').addEventListener('click', () => navigate('home'));

$('#ready-button').addEventListener('click', async () => {
  const button = $('#ready-button');
  button.disabled = true;
  const cue = $('#cues').checked;
  $('#guide-title').textContent = 'Here we go'; $('#guide-subtitle').textContent = 'Follow along with your guide.';
  for (const step of ['3','2','1','GO!']) {
    $('#countdown').textContent = step;
    if (cue && navigator.vibrate) navigator.vibrate(step === 'GO!' ? [70,40,100] : 45);
    await new Promise(resolve => setTimeout(resolve, step === 'GO!' ? 650 : 720));
  }
  $('#countdown').textContent = '';
  $('#vacuum').classList.add('go'); $('#track-fill').classList.add('consume');
  await new Promise(resolve => setTimeout(resolve, 3400));
  $('#completion').classList.add('show'); $('#completion').setAttribute('aria-hidden','false');
});

function resetGuide() { $('#completion').classList.remove('show'); $('#completion').setAttribute('aria-hidden','true'); $('#vacuum').classList.remove('go'); $('#track-fill').classList.remove('consume'); $('#ready-button').disabled = false; $('#guide-title').textContent = 'Ready when you are'; $('#guide-subtitle').textContent = 'Take a breath. There’s no rush.'; navigate('home'); }
$('#log-dose').addEventListener('click', () => { data.history.push({ medication: 'Sumatriptan', amount: '20 mg', date: new Date().toISOString() }); save(); resetGuide(); toast('Dose logged privately ✓'); });
$('#not-taken').addEventListener('click', resetGuide);
$('#clear-history').addEventListener('click', () => { data.history = []; save(); renderHistory(); toast('Local history cleared'); });
$('#profile-form').addEventListener('submit', event => { event.preventDefault(); data.profile = { gender: $('#gender').value, weight: Number($('#weight').value), height: Number($('#height').value) }; save(); toast('Saved on this device ✓'); });
$('#gender').value = data.profile.gender; $('#weight').value = data.profile.weight; $('#height').value = data.profile.height;
renderWeek(); renderHistory(); save();
