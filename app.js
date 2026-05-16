'use strict';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const val = id => ($(`#${id}`)?.value || '').trim();
const checked = id => Boolean($(`#${id}`)?.checked);

const state = {
  tab: 'pc',
  pc: '',
  previous: 'no',
  capacity: 'has',
  worsening: 'standard',
  conveyance: 'conveyed',
  oaFound: 'Greeted by patient',
  oaMobility: 'mobilised independently',
  character: new Set(),
  associated: new Set(),
  exacerbating: new Set(),
  relieving: new Set(),
  referrals: new Set(),
  ros: {},
};

const PC_OPTIONS = [
  'Chest Pain','Shortness of Breath','Abdominal Pain','Headache','Dizziness / Vertigo','Fall','Collapse / Syncope','Seizure','Stroke / FAST +ve','Trauma / Injury','Allergic Reaction','Diabetic Emergency','Cardiac Arrest','Overdose / Poisoning','Back Pain','Nausea & Vomiting','Palpitations','Fever / Pyrexia','Limb Pain / Swelling','Mental Health Crisis','Wound / Laceration','Other'
];

const PC_SOCRATES_TARGET = {
  'Chest Pain': 'cvs', Palpitations: 'cvs', 'Shortness of Breath': 'resp',
  'Abdominal Pain': 'gi', 'Nausea & Vomiting': 'gi', 'Back Pain': 'msk',
  Headache: 'neuro', 'Dizziness / Vertigo': 'neuro', 'Collapse / Syncope': 'neuro', Seizure: 'neuro', 'Stroke / FAST +ve': 'neuro',
  'Limb Pain / Swelling': 'msk', 'Trauma / Injury': 'msk', Fall: 'msk'
};

const CHIP_OPTIONS = {
  character: ['Sharp','Dull','Aching','Burning','Crushing / pressure','Stabbing','Throbbing','Colicky','Tearing','Tight','Cramping','Squeezing'],
  associated: ['Nausea','Vomiting','Sweating','Dizziness','SOB','Palpitations','Headache','Fever','Fatigue','Numbness','Tingling','Weakness','Visual changes','Syncope','Back pain','Chest tightness'],
  exacerbating: ['Movement','Deep breathing','Palpation','Eating','Exertion','Lying flat','Standing','Coughing','Swallowing','Heat','Cold','Stress'],
  relieving: ['Rest','Analgesia','Sitting forward','Antacids','Ice','Heat','Positional change','Eating','Vomiting','GTN'],
};

const ABCDE = [
  { key:'A', title:'Airway', chips:[['patent','Patent','normal'],['selfMaintained','Self-maintained','normal'],['obstructed','Obstructed','abnormal'],['airwaySounds','Airway sounds','abnormal']], notes:'airwayNotes' },
  { key:'B', title:'Breathing', chips:[['regular','Regular','normal'],['noCyanosis','No cyanosis','normal'],['sentences','Full sentences','normal'],['laboured','Laboured','abnormal'],['wheeze','Wheeze','abnormal']], vitals:[['rr','RR /min','16'],['spo2','SpO₂ %','98'],['o2Flow','O₂ L/min','—']], notes:'breathingNotes' },
  { key:'C', title:'Circulation', chips:[['goodColour','Good colour','normal'],['warm','Warm','normal'],['radial','Radial palpable','normal'],['crt','CRT <2s','normal'],['pale','Pale','abnormal'],['cold','Cold/clammy','abnormal'],['bleed','Haemorrhage','abnormal']], vitals:[['hr','HR bpm','72'],['bp','BP mmHg','120/80'],['bm','BM mmol','5.2']], notes:'circulationNotes' },
  { key:'D', title:'Disability', chips:[['gcs15','GCS 15','normal'],['aox4','AOx4','normal'],['pearl','PEARL','normal'],['speech','Speech clear','normal'],['mobile','Fully mobile','normal'],['confused','Confused','abnormal']], vitals:[['gcsScore','GCS /15','15'],['pupils','Pupils','3mm equal'],['avpu','AVPU','A']], notes:'disabilityNotes' },
  { key:'E', title:'Exposure', chips:[['apyrexial','Apyrexial','normal'],['noRigors','No rigors','normal'],['normalSkin','Normal colour','normal'],['notClammy','Not clammy','normal'],['notDiaphoretic','Not diaphoretic','normal'],['noInjuries','No injuries','normal'],['noRash','No rashes','normal'],['pyrexia','Pyrexia','abnormal'],['injury','Injury found','abnormal']], vitals:[['temp','Temp °C','36.8']], notes:'exposureNotes' },
];

const ROS = {
  resp: { icon:'🫁', title:'Respiratory', items:[
    ['brRate','Breathing rate','Normal rate','Breathing rate normal','Tachypnoea noted'], ['cyanosis','Cyanosis','No cyanosis','No cyanosis','Cyanosis present'], ['wheeze','Wheeze','No wheeze','No wheeze','Wheeze noted'], ['haemoptysis','Haemoptysis','None','No haemoptysis','Haemoptysis present'], ['sob','SOB','No SOB','No shortness of breath','Shortness of breath present'], ['iwob','Increased WOB','None','No increased work of breathing','Increased work of breathing noted'], ['accessory','Accessory muscles','Not in use','No use of accessory muscles','Accessory muscle use present']
  ], extras: '<label class="field-label" for="coughType">Cough</label><select id="coughType"><option>No cough</option><option>Dry cough present</option><option>Productive cough present</option></select><label class="field-label" for="respAus">On auscultation</label><input id="respAus" type="text" placeholder="Equal and clear bilateral air entry"><label class="field-label" for="respNotes">Additional notes</label><textarea id="respNotes" rows="2"></textarea>' },
  cvs: { icon:'🫀', title:'Cardiovascular', items:[
    ['colour','Colour','Good colour','Good colour','Poor colour noted'], ['warmTouch','Warm to touch','Warm peripheries','Warm to touch','Cool/cold peripheries'], ['pulse','Peripheral pulses','Palpable','Peripheral pulses palpable','Peripheral pulses weak/absent'], ['crt','CRT','<2 seconds','CRT <2s','CRT ≥2s'], ['chestPain','Chest pain','No chest pain','No chest pain','Chest pain present'], ['palpitations','Palpitations','No palpitations','No palpitations','Palpitations reported'], ['oedema','Oedema','No oedema','No oedema','Oedema present'], ['calfPain','Calf pain / DVT','No calf pain','No calf pain or tenderness','Calf pain/tenderness noted']
  ], extras: '<label class="field-label" for="bpStatus">Blood pressure status</label><select id="bpStatus"><option>Normotensive</option><option>Hypotensive</option><option>Hypertensive</option></select><label class="field-label" for="ecg">ECG findings</label><input id="ecg" type="text" placeholder="Sinus rhythm – nil acute / not performed"><label class="field-label" for="cvsNotes">Additional notes</label><textarea id="cvsNotes" rows="2"></textarea>' },
  neuro: { icon:'🧠', title:'Neurological', items:[
    ['aox4','AOx4','Fully orientated','Alert and orientated ×4','Not fully orientated'], ['gcs15','GCS 15','GCS 15/15','GCS 15/15','GCS reduced'], ['pearl','PEARL','Equal and reactive','PEARL','Pupils unequal/unreactive'], ['fast','FAST','Negative','FAST negative','FAST positive'], ['confusion','Confusion','No confusion','No confusion','Confusion noted'], ['headache','Headache','No headache','No headache','Headache present'], ['dizziness','Dizziness','No dizziness','No dizziness','Dizziness present'], ['weakness','Weakness','No weakness','No focal weakness','Weakness noted'], ['numbness','Numbness','No numbness','No numbness/altered sensation','Numbness/altered sensation noted'], ['loc','LOC','No LOC','No loss of consciousness','Loss of consciousness reported'], ['seizure','Seizure','No seizure','No seizure activity','Seizure activity reported'], ['speech','Speech','Clear','Speech clear and coherent','Speech difficulty noted']
  ], extras:'<label class="field-label" for="neuroNotes">Additional notes</label><textarea id="neuroNotes" rows="2"></textarea>' },
  gi: { icon:'🫃', title:'Gastrointestinal', items:[
    ['abdoPain','Abdominal pain','No pain','No abdominal pain','Abdominal pain present'], ['backPain','Back pain','No back pain','No back pain','Back pain present'], ['nausea','Nausea','No nausea','No nausea','Nausea present'], ['vomiting','Vomiting','No vomiting','No vomiting','Vomiting reported'], ['haematemesis','Haematemesis','None','No haematemesis','Haematemesis reported'], ['bowel','Bowel habits','Unchanged','Bowel habits unchanged','Change in bowel habit'], ['distension','Distension','No distension','No distension','Abdominal distension noted'], ['soft','Abdomen soft','Non-rigid','Abdomen soft','Abdomen rigid'], ['tender','Non-tender','No tenderness','Non-tender','Tenderness on palpation'], ['guarding','Guarding','Absent','No guarding','Guarding present'], ['rebound','Rebound tenderness','Absent','No rebound tenderness','Rebound tenderness present']
  ], extras:'<label class="field-label" for="bowelSounds">Bowel sounds</label><input id="bowelSounds" type="text" placeholder="Present and normal"><label class="field-label" for="giNotes">Additional notes</label><textarea id="giNotes" rows="2"></textarea>' },
  urine: { icon:'💧', title:'Urinary', items:[
    ['frequency','Frequency','No change','No change to urinary frequency','Change in urinary frequency'], ['volume','Volume','Unchanged','Volume unchanged','Change in urinary volume'], ['dysuria','Dysuria','No pain','No pain on micturition','Dysuria/pain on micturition'], ['haematuria','Haematuria','None','No haematuria','Haematuria present'], ['odour','Offensive odour','None','No offensive odour','Offensive urinary odour noted'], ['colour','Colour change','Unchanged','No change in urine colour','Change in urine colour noted'], ['incontinence','Incontinence','None','No urinary incontinence','Urinary incontinence reported']
  ], extras:'<label class="field-label" for="urineNotes">Additional notes</label><textarea id="urineNotes" rows="2"></textarea>' },
  integ: { icon:'🩺', title:'Integumentary', items:[
    ['fever','Fever','Apyrexial','No fever','Pyrexia present'], ['rigors','Rigors','No rigors','No rigors','Rigors reported'], ['fatigue','Fatigue','No fatigue','No fatigue','Fatigue reported'], ['colour','Colour','Normal','Normal colour','Abnormal colour noted'], ['clammy','Clammy','Not clammy','Not clammy','Clammy skin noted'], ['diaphoretic','Diaphoresis','Not diaphoretic','Not diaphoretic','Diaphoresis present'], ['bruising','Bruising','No bruising','No bruising','Bruising noted'], ['lacerations','Lacerations','None','No lacerations','Lacerations present'], ['rash','Rash','No rash','No rash','Rash noted'], ['turgor','Skin turgor','Normal','Normal skin turgor','Reduced skin turgor']
  ], extras:'<label class="field-label" for="integNotes">Additional notes</label><textarea id="integNotes" rows="2"></textarea>' },
  msk: { icon:'🦴', title:'Musculoskeletal', items:[
    ['jointPain','Joint pain','No pain','No joint pain','Joint pain present'], ['stiffness','Stiffness','No stiffness','No stiffness','Stiffness reported'], ['swelling','Swelling','No swelling','No swelling','Swelling noted'], ['injury','Signs of injury','None found','No obvious signs of injury','Signs of injury present'], ['rom','Range of motion','Full ROM','Full range of movement of all limbs','Reduced range of motion noted'], ['powerTone','Power and tone','Normal','Normal power and tone throughout','Reduced power/altered tone']
  ], extras:'<label class="field-label" for="mskNotes">Additional notes</label><textarea id="mskNotes" rows="2"></textarea>' },
};

function init() {
  buildPcChips();
  buildSocrates();
  buildAbcde();
  buildRos();
  bindEvents();
  placeSocrates(null);
}

document.addEventListener('DOMContentLoaded', init);

function buildPcChips() {
  const container = $('#pcChips');
  PC_OPTIONS.forEach(label => {
    const button = chip(label);
    button.addEventListener('click', () => {
      $$('.chip', container).forEach(item => item.classList.remove('selected'));
      button.classList.add('selected');
      state.pc = label;
      $('#pcCustom').value = '';
      placeSocrates(PC_SOCRATES_TARGET[label] || null);
    });
    container.append(button);
  });
}

function buildSocrates() {
  const template = $('#socratesTemplate').content.cloneNode(true);
  document.body.append(template);
  Object.entries(CHIP_OPTIONS).forEach(([key, options]) => {
    const container = $(`[data-state="${key}"]`, $('#socratesBlock'));
    options.forEach(option => container.append(chip(option)));
  });
}

function buildAbcde() {
  const root = $('#abcdeBlocks');
  ABCDE.forEach(section => {
    const wrapper = document.createElement('section');
    wrapper.className = 'abcde-section';
    wrapper.innerHTML = `<div class="abc-letter">${section.key}</div><div><label class="field-label">${section.title}</label><div class="chip-row abc-chips" data-abc="${section.key}"></div><div class="vital-grid"></div><label class="field-label" for="${section.notes}">Notes</label><input id="${section.notes}" type="text"></div>`;
    const chipRoot = $('.abc-chips', wrapper);
    section.chips.forEach(([id, label, type]) => {
      const button = chip(label);
      button.dataset.id = `${section.key}_${id}`;
      button.dataset.type = type;
      if (type === 'normal') button.classList.add('selected');
      button.addEventListener('click', () => {
        if (type === 'normal') button.classList.toggle('selected');
        else button.classList.toggle('abnormal');
      });
      chipRoot.append(button);
    });
    const vitalRoot = $('.vital-grid', wrapper);
    (section.vitals || []).forEach(([id, label, placeholder]) => {
      const box = document.createElement('div');
      box.className = 'vital';
      box.innerHTML = `<label for="${id}">${label}</label><input id="${id}" type="text" placeholder="${placeholder}">`;
      vitalRoot.append(box);
    });
    if (!section.vitals) vitalRoot.remove();
    root.append(wrapper);
  });
}

function buildRos() {
  const root = $('#rosSections');
  Object.entries(ROS).forEach(([key, section], index) => {
    const wrapper = document.createElement('section');
    wrapper.className = `ros-section${index === 0 ? ' open' : ''}`;
    wrapper.id = `ros-${key}`;
    wrapper.innerHTML = `<button class="ros-header" type="button"><span class="icon">${section.icon}</span><span>${section.title}</span><span class="badge" id="badge-${key}">All normal</span><span>⌄</span></button><div class="ros-body"><div id="socTarget-${key}"></div><div class="ros-grid"></div>${section.extras}</div>`;
    $('.ros-header', wrapper).addEventListener('click', () => wrapper.classList.toggle('open'));
    const grid = $('.ros-grid', wrapper);
    section.items.forEach(([id, label, sub, normal, abnormal]) => {
      const stateId = `${key}_${id}`;
      state.ros[stateId] = 'normal';
      const button = document.createElement('button');
      button.className = 'ros-chip';
      button.type = 'button';
      button.innerHTML = `<span class="mark">✓</span><span>${label}<small>${sub}</small></span>`;
      button.addEventListener('click', () => {
        const isAbnormal = state.ros[stateId] === 'abnormal';
        state.ros[stateId] = isAbnormal ? 'normal' : 'abnormal';
        button.classList.toggle('abnormal', !isAbnormal);
        $('.mark', button).textContent = isAbnormal ? '✓' : '!';
        $('small', button).textContent = isAbnormal ? sub : abnormal;
        updateRosBadge(key);
      });
      grid.append(button);
    });
    root.append(wrapper);
  });
}

function bindEvents() {
  $$('.tab').forEach(tab => tab.addEventListener('click', () => switchTab(tab.dataset.tab)));
  $('#pcCustom').addEventListener('input', () => {
    state.pc = '';
    $$('#pcChips .chip').forEach(item => item.classList.remove('selected'));
    placeSocrates(null);
  });
  document.addEventListener('click', event => {
    const choiceButton = event.target.closest('.choice-group .chip');
    if (choiceButton) return handleChoice(choiceButton);
    const multiButton = event.target.closest('.multi-group .chip');
    if (multiButton) return handleMulti(multiButton);
    const toggleButton = event.target.closest('[data-toggle]');
    if (toggleButton) return handleToggle(toggleButton);
  });
  $('#generateOeButton').addEventListener('click', generateOe);
  $('#clearOeButton').addEventListener('click', () => $('#oeText').value = '');
  $('#refreshButton').addEventListener('click', generateOutput);
  $('#copyButton').addEventListener('click', copyOutput);
  $('#resetButton').addEventListener('click', () => { if (confirm('Clear all data and start a new PRF?')) location.reload(); });
}

function placeSocrates(target) {
  const block = $('#socratesBlock');
  const parent = target ? $(`#socTarget-${target}`) : $('#socratesHome');
  parent.append(block);
  if (target) $(`#ros-${target}`)?.classList.add('open');
}

function chip(label) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'chip';
  button.textContent = label;
  button.dataset.value = label;
  return button;
}

function handleChoice(button) {
  const group = button.closest('.choice-group');
  $$('.chip', group).forEach(item => item.classList.remove('selected'));
  button.classList.add('selected');
  state[group.dataset.state] = button.dataset.value;
}

function handleMulti(button) {
  const key = button.closest('.multi-group').dataset.state;
  const value = button.dataset.value;
  button.classList.toggle('selected');
  if (state[key].has(value)) state[key].delete(value);
  else state[key].add(value);
}

function handleToggle(button) {
  const key = button.dataset.toggle;
  const value = button.dataset.value;
  $$(`[data-toggle="${key}"]`).forEach(item => item.classList.remove('selected', 'success', 'danger'));
  button.classList.add('selected');
  state[key] = value;
  if (key === 'previous') $('#prevDetails').classList.toggle('hidden', value !== 'yes');
  if (key === 'capacity') {
    $('#capacityChecks').classList.toggle('hidden', value !== 'has');
    $('#bestInterests').classList.toggle('hidden', value !== 'lacks');
  }
  if (key === 'worsening') $('#customWorsening').classList.toggle('hidden', value !== 'custom');
  if (key === 'conveyance') $('#nonConveyedFields').classList.toggle('hidden', value === 'conveyed');
}

function switchTab(tab) {
  state.tab = tab;
  $$('.tab').forEach(item => item.classList.toggle('active', item.dataset.tab === tab));
  $$('.panel').forEach(item => item.classList.toggle('active', item.id === `panel-${tab}`));
  if (tab === 'output') generateOutput();
}

function updateRosBadge(key) {
  const hasAbnormal = Object.keys(state.ros).some(id => id.startsWith(`${key}_`) && state.ros[id] === 'abnormal');
  const badge = $(`#badge-${key}`);
  badge.classList.toggle('abnormal', hasAbnormal);
  badge.textContent = hasAbnormal ? 'Abnormal' : 'All normal';
}

function selectedAbc(sectionKey) {
  return $$(`[data-abc="${sectionKey}"] .chip`).filter(button => button.classList.contains('selected') || button.classList.contains('abnormal')).map(button => button.textContent);
}

function buildOaText() {
  const parts = [state.oaFound];
  if (val('oaLocation')) parts[0] += ` at ${val('oaLocation')}`;
  parts.push(state.oaMobility);
  if (checked('oaNoABC')) parts.push('no immediate ABC concerns on arrival');
  if (checked('oaConsent')) parts.push('patient consented to assessment');
  if (val('oaNotes')) parts.push(val('oaNotes'));
  return `${parts.join('. ')}.`;
}

function buildAbcdeText() {
  const lines = [`OA: ${buildOaText()}`];
  ABCDE.forEach(section => {
    const findings = selectedAbc(section.key);
    let line = `${section.key} — ${section.title}: ${findings.length ? findings.join(', ') : 'assessed'}`;
    const vitals = (section.vitals || []).map(([id, label]) => val(id) ? `${label.replace(/\s.*$/, '')} ${val(id)}` : '').filter(Boolean);
    if (vitals.length) line += `. ${vitals.join(', ')}`;
    if (val(section.notes)) line += `. ${val(section.notes)}`;
    lines.push(`${line}.`);
  });
  return lines.join('\n');
}

function rosLine(key) {
  return ROS[key].items.map(([id,, , normal, abnormal]) => state.ros[`${key}_${id}`] === 'abnormal' ? abnormal : normal).join('. ') + '.';
}

function generateOe() {
  const gcs = val('gcsScore') || '15';
  const avpu = val('avpu') || 'A';
  const lines = [
    'OE:', '',
    `OA: ${buildOaText()}`, '',
    buildAbcdeText(), '',
    `General: Patient alert, ${state.ros.neuro_aox4 === 'abnormal' ? 'not fully orientated' : 'AOx4'}, GCS ${gcs}/15, AVPU ${avpu}.`,
    `Resp: ${rosLine('resp')} On auscultation: ${val('respAus') || 'equal and clear bilateral air entry'}.`,
    `CVS: ${rosLine('cvs')} ECG: ${val('ecg') || 'not documented'}.`,
    `Abdo/GI: ${rosLine('gi')} Bowel sounds ${val('bowelSounds') || 'not documented'}.`,
    `Neuro: ${rosLine('neuro')}`,
    `Skin: ${rosLine('integ')}`,
    `MSK: ${rosLine('msk')}`,
  ];
  $('#oeText').value = lines.join('\n');
}

function generateOutput() {
  const pc = val('pcCustom') || state.pc || '(not specified)';
  const output = [];
  output.push('PRESENTING COMPLAINT:', pc, '');
  output.push('HISTORY OF PRESENTING COMPLAINT:');
  output.push([val('hpcEvents'), checked('noTravel') ? 'No recent travel.' : ''].filter(Boolean).join(' ') || 'Not documented.');
  output.push('', 'SOCRATES:');
  output.push(`• Site: ${val('painSite') || 'Not documented'}`);
  output.push(`• Onset: ${[val('onsetType'), val('onsetDuration')].filter(Boolean).join(', ') || 'Not documented'}`);
  output.push(`• Character: ${list(state.character) || 'Not characterised'}`);
  output.push(`• Radiation: ${val('radiation') || 'Not documented'}`);
  output.push(`• Associated symptoms: ${list(state.associated) || 'None reported'}`);
  output.push(`• Timing: ${val('timing') || 'Not documented'}`);
  output.push(`• Exacerbating factors: ${list(state.exacerbating) || 'None identified'}`);
  output.push(`• Relieving factors: ${list(state.relieving) || 'None identified'}`);
  output.push(`• Severity: ${val('severity') || 'Not documented'}`);
  output.push('', `ALLERGIES: ${checked('nkda') ? 'NKDA' : val('allergies') || 'Not documented'}`);
  output.push(`MEDICATIONS: ${checked('noMeds') ? 'None reported' : val('medications') || 'Not documented'}`);
  output.push(`PAST MEDICAL HISTORY: ${checked('noPmh') ? 'No significant PMH reported' : val('pmh') || 'Not documented'}`);
  output.push(`LAST ORAL INTAKE: ${[val('loiWhat'), val('loiTime') && `at ${val('loiTime')}`].filter(Boolean).join(' ') || 'Not documented'}`);
  output.push(`PREVIOUS EPISODES: ${state.previous === 'yes' ? `Yes — ${val('prevDetails') || 'details not documented'}` : 'No'}`);
  output.push('', divider('PRIMARY SURVEY'), buildAbcdeText());
  output.push('', divider('REVIEW OF SYSTEMS'));
  Object.keys(ROS).forEach(key => {
    output.push('', `${ROS[key].title}:`, rosLine(key));
    const notesId = `${key === 'resp' ? 'resp' : key}Notes`;
    if (val(notesId)) output.push(val(notesId));
  });
  if (val('oeText')) output.push('', divider('SECONDARY SURVEY / ON EXAMINATION'), val('oeText'));
  output.push('', divider('WORSENING ADVICE'), worseningText());
  const capacity = capacityText();
  if (capacity) output.push('', divider('MENTAL CAPACITY ASSESSMENT'), capacity);
  output.push('', divider('CONVEYANCE DECISION'), conveyanceText());
  $('#outputText').textContent = output.join('\n');
}

function list(set) { return [...set].join(', '); }
function divider(label) { return `${'─'.repeat(46)}\n${label}\n${'─'.repeat(46)}`; }

function worseningText() {
  const standard = 'Patient advised that if any new or worsening symptoms develop — including increased pain, difficulty breathing, chest pain, severe dizziness/fainting, weakness, confusion, difficulty speaking, worsening consciousness, uncontrolled bleeding, or signs of infection — to seek further advice via 111 or call 999 in an emergency.';
  const head = 'Head injury advice given: call 999 for repeated vomiting, worsening headache, new confusion, increasing drowsiness/agitation, slurred speech, seizure, or new weakness/numbness.';
  if (state.worsening === 'head') return head;
  if (state.worsening === 'both') return `${standard}\n\n${head}`;
  if (state.worsening === 'none') return 'Not applicable / not given.';
  if (state.worsening === 'custom') return val('customWorsening') || 'Custom worsening advice given.';
  return standard;
}

function capacityText() {
  if (state.capacity === 'na') return '';
  if (state.capacity === 'lacks') return `Patient assessed as lacking capacity regarding this decision at this time. Best interests decision documented. ${val('bestInterests')}`.trim();
  const pass = checked('mcaUnderstand') && checked('mcaRetain') && checked('mcaWeigh') && checked('mcaCommunicate');
  return pass ? 'Patient assessed as having capacity for decisions regarding care: able to understand, retain, weigh/use relevant information, and communicate their decision.' : 'Capacity assessment incomplete/failed — review, escalate, and document rationale.';
}

function conveyanceText() {
  const notes = val('conveyanceNotes');
  if (state.conveyance === 'conveyed') return `Patient conveyed to hospital.${notes ? ' ' + notes : ''}`;
  const base = state.conveyance === 'declined' ? 'Patient declined conveyance after assessment and discussion of risks.' : 'Patient treated/assessed at scene and left at home following assessment.';
  const safety = [checked('riskExplained') && 'risks explained', checked('alternativesDiscussed') && 'alternatives discussed', checked('understandsRisk') && 'patient understands risks', checked('canRecontact') && 'advised may call 999/111 if needed'].filter(Boolean).join('; ');
  return [base, list(state.referrals) && `Referred/signposted to: ${list(state.referrals)}.`, val('followUp'), safety && `Safety netting: ${safety}.`, notes].filter(Boolean).join(' ');
}

async function copyOutput() {
  generateOutput();
  try { await navigator.clipboard.writeText($('#outputText').textContent); }
  catch {
    const box = document.createElement('textarea');
    box.value = $('#outputText').textContent;
    box.style.position = 'fixed'; box.style.opacity = '0';
    document.body.append(box); box.select(); document.execCommand('copy'); box.remove();
  }
  $('#toast').classList.add('show');
  setTimeout(() => $('#toast').classList.remove('show'), 1800);
}
