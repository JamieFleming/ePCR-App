'use strict';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const val = id => ($(`#${id}`)?.value || '').trim();
const isChecked = id => Boolean($(`#${id}`)?.checked);

const state = {
  mapMode: 'site',
  siteParts: new Set(),
  radiationParts: new Set(),
  character: new Set(),
  associated: new Set(),
  exacerbating: new Set(),
  relieving: new Set(),
  referrals: new Set(),
  ros: {},
};

const OPTIONS = {
  character: ['Sharp','Dull','Aching','Burning','Crushing / pressure','Stabbing','Throbbing','Colicky','Tearing','Tight','Cramping','Squeezing'],
  associated: ['Nausea','Vomiting','Sweating','Dizziness','Shortness of breath','Palpitations','Headache','Fever','Fatigue','Numbness','Tingling','Weakness','Visual change','Syncope','Back pain','Chest tightness'],
  exacerbating: ['Movement','Deep breathing','Palpation','Eating','Exertion','Lying flat','Standing','Coughing','Swallowing','Heat','Cold','Stress'],
  relieving: ['Rest','Analgesia','Sitting forward','Antacids','Ice','Heat','Position change','Eating','Vomiting','GTN'],
  referrals: ['GP','111','Urgent treatment centre','Pharmacy','Community nursing','Self-care','Falls team','Mental health crisis team','Safeguarding referral'],
};

const ABCDE = [
  { key:'A', title:'Airway', chips:[['Patent','normal'],['Self-maintained','normal'],['Obstructed','abnormal'],['Airway sounds','abnormal']], vitals:[], notes:'airwayNotes' },
  { key:'B', title:'Breathing', chips:[['Regular','normal'],['No cyanosis','normal'],['Full sentences','normal'],['Laboured','abnormal'],['Wheeze','abnormal']], vitals:[['rr','RR /min','16'],['spo2','SpO2 %','98'],['o2Flow','O2 L/min','']], notes:'breathingNotes' },
  { key:'C', title:'Circulation', chips:[['Good colour','normal'],['Warm to touch','normal'],['Radial palpable','normal'],['CRT <2s','normal'],['Pale','abnormal'],['Cold / clammy','abnormal'],['Haemorrhage','abnormal']], vitals:[['hr','HR bpm','72'],['bp','BP mmHg','120/80'],['bm','BM mmol/L','5.2']], notes:'circulationNotes' },
  { key:'D', title:'Disability', chips:[['GCS 15','normal'],['AOx4','normal'],['PEARL','normal'],['Speech clear','normal'],['Fully mobile','normal'],['Confused','abnormal']], vitals:[['gcsScore','GCS /15','15'],['pupils','Pupils','3mm equal'],['avpu','AVPU','A']], notes:'disabilityNotes' },
  { key:'E', title:'Exposure', chips:[['Apyrexial','normal'],['No rigors','normal'],['Normal colour','normal'],['Not clammy','normal'],['Not diaphoretic','normal'],['No injuries','normal'],['No rashes','normal'],['Pyrexia','abnormal'],['Injury found','abnormal']], vitals:[['temp','Temp C','36.8']], notes:'exposureNotes' },
];

const ROS = {
  resp: { title:'Respiratory', items:[
    ['breathingRate','Breathing rate normal','Tachypnoea noted'],['cyanosis','No cyanosis','Cyanosis present'],['wheeze','No wheeze','Wheeze noted'],['haemoptysis','No haemoptysis','Haemoptysis present'],['sob','No shortness of breath','Shortness of breath present'],['iwob','No increased work of breathing','Increased work of breathing noted'],['accessory','No accessory muscle use','Accessory muscle use present']
  ], extras:'<label class="field-label" for="coughType">Cough</label><select id="coughType"><option>No cough</option><option>Dry cough present</option><option>Productive cough present</option></select><label class="field-label" for="respAus">On auscultation</label><input id="respAus" type="text" placeholder="Equal and clear bilateral air entry"><label class="field-label" for="respNotes">Additional notes</label><textarea id="respNotes" rows="2"></textarea>' },
  cvs: { title:'Cardiovascular', items:[
    ['colour','Good colour','Poor colour noted'],['warm','Warm to touch','Cool / cold peripheries'],['pulses','Peripheral pulses palpable','Peripheral pulses weak / absent'],['crt','CRT <2s','CRT >=2s'],['chestPain','No chest pain','Chest pain present'],['palpitations','No palpitations','Palpitations reported'],['oedema','No oedema','Oedema present'],['calfPain','No calf pain or tenderness','Calf pain / tenderness noted']
  ], extras:'<label class="field-label" for="bpStatus">Blood pressure status</label><select id="bpStatus"><option>Normotensive</option><option>Hypotensive</option><option>Hypertensive</option></select><label class="field-label" for="ecg">ECG findings</label><input id="ecg" type="text" placeholder="Sinus rhythm - nil acute / not performed"><label class="field-label" for="cvsNotes">Additional notes</label><textarea id="cvsNotes" rows="2"></textarea>' },
  neuro: { title:'Neurological', items:[
    ['aox4','Alert and orientated x4','Not fully orientated'],['gcs15','GCS 15/15','GCS reduced'],['pearl','PEARL','Pupils unequal / unreactive'],['fast','FAST negative','FAST positive'],['confusion','No confusion','Confusion noted'],['headache','No headache','Headache present'],['dizziness','No dizziness','Dizziness present'],['weakness','No focal weakness','Weakness noted'],['numbness','No numbness / altered sensation','Numbness / altered sensation noted'],['loc','No loss of consciousness','Loss of consciousness reported'],['seizure','No seizure activity','Seizure activity reported'],['speech','Speech clear and coherent','Speech difficulty noted']
  ], extras:'<label class="field-label" for="neuroNotes">Additional notes</label><textarea id="neuroNotes" rows="2"></textarea>' },
  gi: { title:'Gastrointestinal', items:[
    ['abdoPain','No abdominal pain','Abdominal pain present'],['backPain','No back pain','Back pain present'],['nausea','No nausea','Nausea present'],['vomiting','No vomiting','Vomiting reported'],['haematemesis','No haematemesis','Haematemesis reported'],['bowelHabit','Bowel habits unchanged','Change in bowel habit'],['distension','No distension','Abdominal distension noted'],['soft','Abdomen soft','Abdomen rigid'],['tender','Non-tender','Tenderness on palpation'],['guarding','No guarding','Guarding present'],['rebound','No rebound tenderness','Rebound tenderness present']
  ], extras:'<label class="field-label" for="bowelSounds">Bowel sounds</label><input id="bowelSounds" type="text" placeholder="Present and normal"><label class="field-label" for="giNotes">Additional notes</label><textarea id="giNotes" rows="2"></textarea>' },
  urine: { title:'Urinary', items:[
    ['frequency','No change to urinary frequency','Change in urinary frequency'],['volume','Volume unchanged','Change in urinary volume'],['dysuria','No pain on micturition','Dysuria / pain on micturition'],['haematuria','No haematuria','Haematuria present'],['odour','No offensive odour','Offensive urinary odour noted'],['colour','No change in urine colour','Change in urine colour noted'],['incontinence','No urinary incontinence','Urinary incontinence reported']
  ], extras:'<label class="field-label" for="urineNotes">Additional notes</label><textarea id="urineNotes" rows="2"></textarea>' },
  integ: { title:'Integumentary', items:[
    ['fever','No fever','Pyrexia present'],['rigors','No rigors','Rigors reported'],['fatigue','No fatigue','Fatigue reported'],['colour','Normal colour','Abnormal colour noted'],['clammy','Not clammy','Clammy skin noted'],['diaphoresis','Not diaphoretic','Diaphoresis present'],['bruising','No bruising','Bruising noted'],['laceration','No lacerations','Lacerations present'],['rash','No rash','Rash noted'],['turgor','Normal skin turgor','Reduced skin turgor']
  ], extras:'<label class="field-label" for="integNotes">Additional notes</label><textarea id="integNotes" rows="2"></textarea>' },
  msk: { title:'Musculoskeletal', items:[
    ['jointPain','No joint pain','Joint pain present'],['stiffness','No stiffness','Stiffness reported'],['swelling','No swelling','Swelling noted'],['injury','No obvious signs of injury','Signs of injury present'],['rom','Full range of movement of all limbs','Reduced range of movement noted'],['powerTone','Normal power and tone throughout','Reduced power / altered tone']
  ], extras:'<label class="field-label" for="mskNotes">Additional notes</label><textarea id="mskNotes" rows="2"></textarea>' },
};

document.addEventListener('DOMContentLoaded', init);

function init() {
  buildOptionButtons();
  buildAbcde();
  buildRos();
  bindEvents();
  updateMapTags();
}

function buildOptionButtons() {
  Object.entries(OPTIONS).forEach(([key, options]) => {
    const container = $(`[data-state="${key}"]`);
    if (!container) return;
    options.forEach(option => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'square-btn';
      button.textContent = option;
      button.dataset.value = option;
      container.append(button);
    });
  });
}

function buildAbcde() {
  const root = $('#abcdeContainer');
  ABCDE.forEach((section, index) => {
    const details = document.createElement('details');
    details.className = 'section-card';
    if (index === 0) details.open = true;
    details.innerHTML = `<summary><span>${section.key} - ${section.title}</span><small>${section.key}</small></summary><div class="section-body"><div class="square-grid abc-grid"></div><div class="vital-grid"></div><label class="field-label" for="${section.notes}">Notes</label><input id="${section.notes}" type="text" /></div>`;
    const chipRoot = $('.abc-grid', details);
    section.chips.forEach(([label, type]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `square-btn abc-chip ${type === 'normal' ? 'selected' : ''}`;
      button.textContent = label;
      button.dataset.abc = section.key;
      button.dataset.value = label;
      button.dataset.type = type;
      chipRoot.append(button);
    });
    const vitalRoot = $('.vital-grid', details);
    section.vitals.forEach(([id, label, placeholder]) => {
      const box = document.createElement('div');
      box.className = 'vital';
      box.innerHTML = `<label for="${id}">${label}</label><input id="${id}" type="text" placeholder="${placeholder}">`;
      vitalRoot.append(box);
    });
    if (!section.vitals.length) vitalRoot.remove();
    root.append(details);
  });
}

function buildRos() {
  const root = $('#rosContainer');
  Object.entries(ROS).forEach(([key, section], index) => {
    const details = document.createElement('details');
    details.className = 'section-card';
    if (index === 0) details.open = true;
    details.innerHTML = `<summary><span>${section.title}</span><small id="badge-${key}" class="status-pill">All normal</small></summary><div class="section-body"><div class="square-grid ros-grid"></div>${section.extras}</div>`;
    const grid = $('.ros-grid', details);
    section.items.forEach(([id, normal, abnormal]) => {
      const stateId = `${key}_${id}`;
      state.ros[stateId] = 'normal';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'square-btn ros-chip selected';
      button.textContent = normal;
      button.dataset.section = key;
      button.dataset.stateId = stateId;
      button.dataset.normal = normal;
      button.dataset.abnormal = abnormal;
      grid.append(button);
    });
    root.append(details);
  });
}

function bindEvents() {
  $$('.tab').forEach(tab => tab.addEventListener('click', () => switchTab(tab.dataset.tab)));
  $('#resetButton').addEventListener('click', () => { if (confirm('Clear all data and start a new PRF?')) location.reload(); });
  $('#pcSelect').addEventListener('change', () => $('#pcOtherWrap').classList.toggle('hidden', val('pcSelect') !== 'Other'));
  $('#capacityStatus').addEventListener('change', handleCapacityDisplay);
  $('#worseningMode').addEventListener('change', () => $('#customWorsening').classList.toggle('hidden', val('worseningMode') !== 'Custom'));
  $('#conveyanceDecision').addEventListener('change', () => $('#nonConveyedFields').classList.toggle('hidden', val('conveyanceDecision') === 'Conveyed'));
  $('#generateOeButton').addEventListener('click', generateOe);
  $('#clearOeButton').addEventListener('click', () => $('#oeText').value = '');
  $('#refreshButton').addEventListener('click', generateOutput);
  $('#copyButton').addEventListener('click', copyOutput);

  document.addEventListener('click', event => {
    const option = event.target.closest('.multi-group .square-btn');
    if (option) return toggleMulti(option);
    const abc = event.target.closest('.abc-chip');
    if (abc) return toggleAbc(abc);
    const ros = event.target.closest('.ros-chip');
    if (ros) return toggleRos(ros);
    const mapTab = event.target.closest('[data-map-mode]');
    if (mapTab) return setMapMode(mapTab.dataset.mapMode);
    const part = event.target.closest('.body-part');
    if (part) return toggleBodyPart(part);
    const remove = event.target.closest('[data-remove-part]');
    if (remove) return removeBodyPart(remove.dataset.removePart, remove.dataset.partType);
  });
}

function switchTab(tabName) {
  $$('.tab').forEach(tab => tab.classList.toggle('active', tab.dataset.tab === tabName));
  $$('.panel').forEach(panel => panel.classList.toggle('active', panel.id === `panel-${tabName}`));
  if (tabName === 'output') generateOutput();
}

function toggleMulti(button) {
  const stateKey = button.closest('.multi-group').dataset.state;
  const set = state[stateKey];
  const value = button.dataset.value;
  if (set.has(value)) { set.delete(value); button.classList.remove('selected'); }
  else { set.add(value); button.classList.add('selected'); }
}

function toggleAbc(button) {
  if (button.dataset.type === 'normal') button.classList.toggle('selected');
  else button.classList.toggle('abnormal');
}

function toggleRos(button) {
  const isAbnormal = state.ros[button.dataset.stateId] === 'abnormal';
  state.ros[button.dataset.stateId] = isAbnormal ? 'normal' : 'abnormal';
  button.classList.toggle('abnormal', !isAbnormal);
  button.classList.toggle('selected', isAbnormal);
  button.textContent = isAbnormal ? button.dataset.normal : button.dataset.abnormal;
  updateRosBadge(button.dataset.section);
}

function updateRosBadge(section) {
  const hasAbnormal = Object.entries(state.ros).some(([key, value]) => key.startsWith(`${section}_`) && value === 'abnormal');
  const badge = $(`#badge-${section}`);
  badge.textContent = hasAbnormal ? 'Findings' : 'All normal';
  badge.classList.toggle('flagged', hasAbnormal);
}

function setMapMode(mode) {
  state.mapMode = mode;
  $$('.mini-tab').forEach(btn => btn.classList.toggle('active', btn.dataset.mapMode === mode));
}

function toggleBodyPart(part) {
  const targetSet = state.mapMode === 'site' ? state.siteParts : state.radiationParts;
  const otherSet = state.mapMode === 'site' ? state.radiationParts : state.siteParts;
  const id = part.id;
  if (targetSet.has(id)) targetSet.delete(id);
  else { targetSet.add(id); otherSet.delete(id); }
  part.classList.toggle('site', state.siteParts.has(id));
  part.classList.toggle('radiation', state.radiationParts.has(id));
  updateMapTags();
}

function removeBodyPart(id, type) {
  const set = type === 'site' ? state.siteParts : state.radiationParts;
  set.delete(id);
  $(`#${CSS.escape(id)}`)?.classList.remove(type);
  updateMapTags();
}

function updateMapTags() {
  renderPartTags('siteTags', state.siteParts, 'site', 'Not selected');
  renderPartTags('radiationTags', state.radiationParts, 'radiation', 'No radiation selected');
}

function renderPartTags(containerId, set, type, emptyText) {
  const container = $(`#${containerId}`);
  container.innerHTML = '';
  if (!set.size) { container.textContent = emptyText; return; }
  set.forEach(id => {
    const part = $(`#${CSS.escape(id)}`);
    const tag = document.createElement('span');
    tag.className = `tag ${type}`;
    tag.innerHTML = `${part?.dataset.label || id}<button type="button" data-remove-part="${id}" data-part-type="${type}" aria-label="Remove ${part?.dataset.label || id}">×</button>`;
    container.append(tag);
  });
}

function handleCapacityDisplay() {
  const status = val('capacityStatus');
  $('#capacityChecks').classList.toggle('hidden', status === 'Lacks capacity' || status === 'Not applicable');
  $('#bestInterests').classList.toggle('hidden', status !== 'Lacks capacity');
}

function getSelectedParts(set) {
  return [...set].map(id => $(`#${CSS.escape(id)}`)?.dataset.label || id).join(', ');
}

function rosLine(section) {
  return ROS[section].items.map(([id, normal, abnormal]) => state.ros[`${section}_${id}`] === 'abnormal' ? abnormal : normal).join('. ') + '.';
}

function abcLine(section) {
  const values = $$(`[data-abc="${section.key}"]`).filter(button => button.classList.contains('selected') || button.classList.contains('abnormal')).map(button => button.textContent);
  const vitals = section.vitals.map(([id, label]) => val(id) ? `${label}: ${val(id)}` : null).filter(Boolean);
  const notes = val(section.notes);
  return `${section.key} - ${section.title}: ${[...values, ...vitals, notes].filter(Boolean).join(', ') || 'assessed'}.`;
}

function generateOe() {
  const oe = [
    'OE:',
    '',
    `OA: ${val('oaFound')}${val('oaLocation') ? ` at ${val('oaLocation')}` : ''}; ${val('oaMobility').toLowerCase()}. ${isChecked('oaConsent') ? 'Consented to assessment. ' : ''}${isChecked('oaNoABC') ? 'No immediate ABC concerns. ' : ''}${val('oaNotes')}`.trim(),
    '',
    ABCDE.map(abcLine).join('\n'),
    '',
    `Resp: ${rosLine('resp')} ${val('respAus') ? `Auscultation: ${val('respAus')}.` : ''}`,
    `CVS: ${rosLine('cvs')} ${val('ecg') ? `ECG: ${val('ecg')}.` : ''}`,
    `Neuro: ${rosLine('neuro')}`,
    `Abdo/GI: ${rosLine('gi')} ${val('bowelSounds') ? `Bowel sounds: ${val('bowelSounds')}.` : ''}`,
    `Urinary: ${rosLine('urine')}`,
    `Skin: ${rosLine('integ')}`,
    `MSK: ${rosLine('msk')}`,
  ].join('\n');
  $('#oeText').value = oe;
}

function generateOutput() {
  const pc = val('pcSelect') === 'Other' ? val('pcOther') || 'Other' : val('pcSelect') || 'Not specified';
  const site = getSelectedParts(state.siteParts) || 'Not localised';
  const radiation = getSelectedParts(state.radiationParts) || 'No radiation selected';
  const worseningText = buildWorseningText();
  const output = [];

  output.push(`PRESENTING COMPLAINT:\n${pc}`);
  output.push(`HISTORY OF PRESENTING COMPLAINT:\n${val('hpcEvents') || 'Not documented'}${isChecked('noTravel') ? '\nNo recent travel.' : ''}`);
  output.push(`PAIN ASSESSMENT / SOCRATES:\nSite: ${site}\nOnset: ${val('onsetType') || 'Not documented'}${val('onsetDuration') ? `, duration ${val('onsetDuration')}` : ''}\nCharacter: ${listSet(state.character, 'Not characterised')}\nRadiation: ${radiation}\nAssociated symptoms: ${listSet(state.associated, 'None reported')}\nTiming: ${val('timingSelect') || 'Not documented'}\nExacerbating factors: ${listSet(state.exacerbating, 'None identified')}\nRelieving factors: ${listSet(state.relieving, 'None identified')}\nSeverity: ${val('severity') || 'Not documented'}`);
  output.push(`BACKGROUND:\nAllergies: ${isChecked('nkda') ? 'NKDA' : val('allergies') || 'Not documented'}\nMedications: ${isChecked('noMeds') ? 'No regular medications' : val('medications') || 'Not documented'}\nPMH: ${isChecked('noPmh') ? 'No significant past medical history' : val('pmh') || 'Not documented'}\nLast oral intake: ${[val('loiWhat'), val('loiTime')].filter(Boolean).join(' at ') || 'Not documented'}\nPrevious episodes: ${val('prevDetails') || 'Not documented'}`);
  output.push(`PRIMARY SURVEY:\nOA: ${val('oaFound')}${val('oaLocation') ? ` at ${val('oaLocation')}` : ''}; ${val('oaMobility').toLowerCase()}.\n${ABCDE.map(abcLine).join('\n')}`);
  output.push(`REVIEW OF SYSTEMS:\nRespiratory: ${rosLine('resp')} ${val('coughType')}. ${val('respAus') ? `Auscultation: ${val('respAus')}.` : ''} ${val('respNotes')}\nCardiovascular: ${rosLine('cvs')} ${val('bpStatus')}. ${val('ecg') ? `ECG: ${val('ecg')}.` : ''} ${val('cvsNotes')}\nNeurological: ${rosLine('neuro')} ${val('neuroNotes')}\nGastrointestinal: ${rosLine('gi')} ${val('bowelSounds') ? `Bowel sounds: ${val('bowelSounds')}.` : ''} ${val('giNotes')}\nUrinary: ${rosLine('urine')} ${val('urineNotes')}\nIntegumentary: ${rosLine('integ')} ${val('integNotes')}\nMusculoskeletal: ${rosLine('msk')} ${val('mskNotes')}`);
  if (val('oeText')) output.push(`SECONDARY SURVEY / ON EXAMINATION:\n${val('oeText')}`);
  output.push(`WORSENING ADVICE:\n${worseningText}`);
  output.push(`MENTAL CAPACITY / CONSENT:\n${buildCapacityText()}`);
  output.push(`CONVEYANCE DECISION:\n${buildConveyanceText()}`);

  $('#outputText').textContent = output.join('\n\n' + '─'.repeat(46) + '\n\n');
}

function listSet(set, fallback) {
  return set.size ? [...set].join(', ') : fallback;
}

function buildWorseningText() {
  const mode = val('worseningMode');
  const standard = 'Patient given safety-netting advice and advised to seek further help via 111 or 999 if symptoms worsen or new concerning symptoms develop.';
  const head = 'Head injury advice given, including to call 999 for repeated vomiting, worsening headache, confusion, drowsiness, seizure, slurred speech, or new limb weakness.';
  if (mode === 'Head injury') return head;
  if (mode === 'Standard and head injury') return `${standard}\n${head}`;
  if (mode === 'Not applicable') return 'Not applicable.';
  if (mode === 'Custom') return val('customWorsening') || 'Custom worsening advice given.';
  return standard;
}

function buildCapacityText() {
  const status = val('capacityStatus');
  if (status === 'Not applicable') return 'Not applicable.';
  if (status === 'Lacks capacity') return `Patient assessed as lacking capacity for the relevant decision at this time. Best interests decision documented. ${val('bestInterests')}`.trim();
  const tests = [isChecked('mcaUnderstand') && 'understand', isChecked('mcaRetain') && 'retain', isChecked('mcaWeigh') && 'weigh/use', isChecked('mcaCommunicate') && 'communicate'].filter(Boolean);
  return `Patient assessed as having capacity for the relevant decision. MCA elements documented: able to ${tests.join(', ')} information.`;
}

function buildConveyanceText() {
  const decision = val('conveyanceDecision');
  const notes = val('conveyanceNotes');
  if (decision === 'Conveyed') return `Patient conveyed to hospital.${notes ? ' ' + notes : ''}`;
  const checks = [isChecked('riskExplained') && 'risks explained', isChecked('alternativesDiscussed') && 'alternatives discussed', isChecked('understandsRisk') && 'patient understands risks', isChecked('canRecontact') && 'advised they can recontact 999/111'].filter(Boolean).join('; ');
  return `${decision}. Referred/signposted to: ${listSet(state.referrals, 'not documented')}. ${val('followUp') ? val('followUp') + '. ' : ''}${checks ? `Safety netting: ${checks}.` : ''}${notes ? ' ' + notes : ''}`.trim();
}

async function copyOutput() {
  generateOutput();
  try { await navigator.clipboard.writeText($('#outputText').textContent); }
  catch {
    const textArea = document.createElement('textarea');
    textArea.value = $('#outputText').textContent;
    document.body.append(textArea);
    textArea.select();
    document.execCommand('copy');
    textArea.remove();
  }
  $('#toast').classList.add('show');
  setTimeout(() => $('#toast').classList.remove('show'), 1800);
}
