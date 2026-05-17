"use strict";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const val = (id) => ($(`#${id}`)?.value || "").trim();
const isChecked = (id) => Boolean($(`#${id}`)?.checked);

const state = {
	mapMode: "site",
	siteParts: new Set(),
	radiationParts: new Set(),
	character: new Set(),
	associated: new Set(),
	exacerbating: new Set(),
	relieving: new Set(),
	referrals: new Set(),
	fallsSymptoms: new Set(),
	fallsActivity: new Set(),
	fallsInjuries: new Set(),
	headMechanism: new Set(),
	headSymptoms: new Set(),
	headSigns: new Set(),
	injuryEntries: [],
	abdoRegions: new Set(),
	ivEntries: [],
	drugEntries: [],
	seizureType: new Set(),
	seizureFeatures: new Set(),
	seizureFindings: new Set(),
	seizurePrecipitants: new Set(),
	aedCompliance: new Set(),
	mhIntent: new Set(),
	mhPlanning: new Set(),
	odPrescribed: new Set(),
	shMethod: new Set(),
	shDepth: new Set(),
	airwayInterventions: new Set(),
	woundInterventions: new Set(),
	manualHandling: new Set(),
	otherInterventions: new Set(),
	clinicalChanges: [],
	ros: {},
	respAusc: { normal: true, entries: [] },
	worseningAuto: true,
};

/** When one disability chip is set abnormal, linked chips flip too. */
const ABC_DISABILITY_LINKS = [["GCS 15", "AOx4"]];

const CONVEY_TRANSFER = [
	["Consent to conveyance obtained", "Consent not obtained / BI pathway only"],
	["Continuous monitoring and reassessment", "Monitoring not maintained"],
	["Remained stable throughout", "Unstable / deteriorated during transfer"],
	[
		"Communicated appropriately throughout",
		"Communication concerns during transfer",
	],
	["Handover completed with receiving team", "Handover incomplete / delayed"],
	["Pre-alert not given", "Pre-alert given to receiving unit"],
	["No escalation en route", "Care escalated en route"],
	["No clinical change", "Clinical change during conveyance"],
];

const WORSENING_GENERIC = [
	"chest pain or pressure",
	"sudden difficulty breathing or shortness of breath",
	"FAST symptoms — face drooping, arm weakness, or difficulty speaking",
	"loss of consciousness or collapse",
	"new seizure or fitting",
	"severe allergic reaction — throat swelling or breathing difficulty",
	"heavy uncontrolled bleeding",
];

const WORSENING_PC = {
	"Chest pain": {
		items: [
			"return or worsening of chest pain",
			"pain spreading to jaw, left arm, or back",
			"sweating, nausea, or vomiting alongside chest pain",
			"worsening breathlessness or palpitations",
		],
	},
	Palpitations: {
		items: [
			"palpitations becoming more frequent or prolonged",
			"chest pain or breathlessness with palpitations",
			"dizziness or collapse during palpitations",
		],
	},
	"Shortness of breath": {
		items: [
			"worsening breathlessness or inability to speak in full sentences",
			"new or worsening blue lips or fingertips",
			"increasing confusion or drowsiness",
		],
	},
	"Asthma / COPD exacerbation": {
		items: [
			"wheeze or breathlessness not responding to inhaler",
			"unable to speak in full sentences",
			"using accessory muscles to breathe",
			"oxygen saturation falling below their usual level",
		],
	},
	Headache: {
		items: [
			"sudden severe 'thunderclap' headache — worst headache of their life",
			"headache with fever and neck stiffness",
			"headache with a non-blanching rash",
			"headache with vision changes, vomiting, or new neurological symptoms",
		],
	},
	"Head injury": {
		items: [
			"repeated vomiting after the injury",
			"worsening or new severe headache",
			"increasing confusion, drowsiness, or difficulty staying awake",
			"slurred speech or difficulty speaking",
			"new weakness in face, arms, or legs",
			"clear fluid from nose or ear",
			"unequal pupils",
		],
	},
	Seizure: {
		items: [
			"further seizure activity",
			"seizure lasting more than 5 minutes",
			"consciousness not recovering after a seizure",
			"injury sustained during a seizure",
			"breathing difficulty after a seizure",
		],
	},
	"Stroke / FAST positive": {
		items: [
			"any return of FAST symptoms — facial drooping, arm weakness, speech difficulty",
			"new or worsening weakness, numbness, or vision changes",
			"sudden severe headache",
			"confusion or reduced consciousness",
		],
	},
	"Dizziness / vertigo": {
		items: [
			"worsening dizziness or inability to mobilise safely",
			"FAST symptoms — face, arm, or speech changes",
			"persistent vomiting or inability to keep fluids down",
		],
	},
	"Collapse / syncope": {
		items: [
			"further episodes of blackout or near-collapse",
			"chest pain or palpitations before collapsing",
			"prolonged loss of consciousness",
			"injury from a collapse",
		],
	},
	"Reduced consciousness": {
		items: [
			"any further reduction in level of consciousness",
			"new neurological symptoms",
			"breathing difficulty",
		],
	},
	"Abdominal pain": {
		items: [
			"worsening or severe abdominal pain",
			"rigid or board-like abdomen",
			"vomiting blood or passing black or tarry stools",
			"fever above 38°C with abdominal pain",
			"inability to pass urine",
		],
	},
	"Nausea / vomiting": {
		items: [
			"unable to keep any fluids down for more than 6 hours",
			"blood in the vomit",
			"signs of dehydration — dry mouth, dizziness on standing, reduced urine output",
		],
	},
	"Haematemesis / melaena": {
		items: [
			"further blood in vomit or black tarry stools",
			"dizziness on standing or feeling faint",
			"severe or worsening abdominal pain",
		],
	},
	"Urinary symptoms": {
		items: [
			"worsening pain or fever with urinary symptoms",
			"inability to pass urine",
			"confusion — especially in older patients",
			"blood in urine with loin or back pain",
		],
	},
	"Allergic reaction": {
		items: [
			"return of rash, hives, or swelling",
			"swelling of lips, tongue, or throat",
			"wheeze or difficulty breathing",
			"dizziness or collapse",
			"if adrenaline auto-injector (EpiPen) used — call 999 immediately regardless",
		],
	},
	"Diabetic emergency": {
		items: [
			"recurrence of hypoglycaemia symptoms — shakiness, sweating, confusion",
			"blood glucose not responding to treatment",
			"vomiting preventing oral intake",
			"confusion, drowsiness, or unresponsiveness",
		],
	},
	Fall: {
		items: [
			"another fall",
			"inability to bear weight or mobilise",
			"new or worsening weakness or numbness in the legs",
			"loss of bladder or bowel control — call 999 immediately",
			"numbness or tingling in the saddle area (inner thighs, groin, or back passage) — call 999 immediately",
			"severe worsening pain at any injury site",
		],
		redFlags:
			"Cauda equina red flags explained: loss of bladder or bowel control, saddle anaesthesia (numbness of inner thighs, genitals, or back passage), progressive bilateral leg weakness or numbness — these require an immediate 999 call and should not be waited on.",
	},
	"Back pain": {
		items: [
			"worsening pain not responding to prescribed analgesia",
			"loss of bladder or bowel control — call 999 immediately",
			"numbness or tingling in the saddle area (inner thighs, groin, or back passage) — call 999 immediately",
			"new or worsening weakness or numbness in both legs",
			"inability to stand or walk",
		],
		redFlags:
			"Cauda equina red flags explained: loss of bladder or bowel control, saddle anaesthesia (numbness of inner thighs, genitals, or back passage), progressive bilateral leg weakness or numbness — these require an immediate 999 call.",
	},
	"Trauma / injury": {
		items: [
			"increasing pain, swelling, or bruising at the injury site",
			"loss of sensation or movement below the injury",
			"severe increasing pain with tightness in a limb — possible compartment syndrome, call 999",
			"signs of wound infection — redness, warmth, discharge, or fever",
		],
	},
	"Limb pain / swelling": {
		items: [
			"worsening swelling, redness, or warmth in the limb",
			"new numbness, weakness, or colour change",
			"severe pain with tightness — possible compartment syndrome, call 999",
			"calf swelling or redness with breathlessness — possible DVT/PE, call 999",
		],
	},
	"Wound / laceration": {
		items: [
			"wound re-opening or bleeding not controlled with direct pressure",
			"signs of infection — redness, warmth, swelling, discharge, or fever",
			"loss of sensation or movement near the wound",
		],
	},
	"Sepsis concern": {
		items: [
			"worsening fever, rigors, or feeling very unwell",
			"increasing confusion or agitation",
			"rapid breathing or difficulty breathing",
			"mottled, pale, or blue-tinged skin",
			"reduced urine output or dark urine",
		],
	},
	"Fever / pyrexia": {
		items: [
			"temperature above 39.5°C not responding to analgesia",
			"rigors, severe confusion, or very rapid breathing",
			"non-blanching rash with fever — call 999 immediately",
			"signs of sepsis: rapid breathing, mottled skin, confusion, reduced urine",
		],
	},
	"Overdose / poisoning": {
		items: [
			"any deterioration in consciousness or breathing",
			"further substances taken",
			"confusion, agitation, or hallucinations",
		],
	},
	"Mental health crisis": {
		items: [
			"risk to self or others escalating",
			"feeling unable to keep themselves safe",
			"any immediate risk to life — call 999",
		],
		extra:
			"Samaritans helpline: 116 123 (free, 24/7). Local crisis line signposted if available.",
	},
	"Confusion / delirium": {
		items: [
			"worsening confusion or agitation",
			"fever, rigors, or new physical symptoms",
			"inability to keep safe at home",
		],
	},
};

const OPTIONS = {
	character: [
		"Sharp",
		"Dull",
		"Aching",
		"Burning",
		"Crushing / pressure",
		"Stabbing",
		"Throbbing",
		"Colicky",
		"Tearing",
		"Tight",
		"Cramping",
		"Squeezing",
	],
	associated: [
		"Nausea",
		"Vomiting",
		"Sweating",
		"Dizziness",
		"Shortness of breath",
		"Palpitations",
		"Headache",
		"Fever",
		"Fatigue",
		"Numbness",
		"Tingling",
		"Weakness",
		"Visual change",
		"Syncope",
		"Back pain",
		"Chest tightness",
	],
	exacerbating: [
		"Movement",
		"Deep breathing",
		"Palpation",
		"Eating",
		"Exertion",
		"Lying flat",
		"Standing",
		"Coughing",
		"Swallowing",
		"Heat",
		"Cold",
		"Stress",
		"Other",
	],
	relieving: [
		"Rest",
		"Analgesia",
		"Sitting forward",
		"Antacids",
		"Ice",
		"Heat",
		"Position change",
		"Eating",
		"Vomiting",
		"GTN",
		"Other",
	],
	referrals: [
		"GP",
		"111",
		"Urgent treatment centre",
		"Pharmacy",
		"Community nursing",
		"Self-care",
		"Falls team",
		"Mental health crisis team",
		"Safeguarding referral",
	],
	fallsSymptoms: [
		"Dizziness",
		"Pre-syncope",
		"Palpitations",
		"Chest pain",
		"Shortness of breath",
		"Sudden weakness",
		"Leg gave way",
		"Blurred vision",
		"Tripped",
		"Slipped",
		"Mechanical",
		"No warning",
		"Cannot recall",
	],
	fallsActivity: [
		"Walking",
		"Getting up from chair",
		"Getting up from bed",
		"Going to toilet",
		"On stairs",
		"Reaching / bending",
		"Exertion",
		"Standing still",
		"Unknown",
	],
	headMechanism: [
		"RTC — pedestrian",
		"RTC — cyclist",
		"RTC — vehicle occupant",
		"Fall from height",
		"Fall on stairs",
		"Assault",
		"Sports injury",
		"Object struck head",
	],
	headSymptoms: [
		"Headache",
		"Nausea",
		"Vomiting",
		"Dizziness",
		"Visual disturbance",
		"Confusion",
		"Limb weakness / numbness",
		"Slurred speech",
		"Seizure",
	],
	headSigns: [
		"Scalp laceration",
		"Scalp haematoma",
		"Periorbital bruising (panda eyes)",
		"Battle's sign",
		"Haemotympanum",
		"CSF rhinorrhoea",
		"CSF otorrhoea",
		"Suspected open fracture",
		"Suspected depressed fracture",
		"Focal neurological deficit",
	],
	fallsInjuries: [
		"Head",
		"Face",
		"Neck / spine",
		"Upper back",
		"Lower back",
		"Shoulder",
		"Chest / ribs",
		"Wrist",
		"Hip",
		"Pelvis",
		"Knee",
		"Lower leg",
		"No injury found",
	],
	abdoRegions: [
		"RUQ", "Epigastric", "LUQ",
		"R flank", "Umbilical", "L flank",
		"RIF", "Suprapubic", "LIF",
	],
};

const ABCDE = [
	{
		key: "A",
		title: "Airway",
		chips: [
			["Patent", "Obstructed"],
			["Self-maintained", "Airway support required"],
			["No abnormal sounds", "Airway sounds present"],
		],
		vitals: [],
		notes: "airwayNotes",
	},
	{
		key: "B",
		title: "Breathing",
		chips: [
			["Regular", "Laboured / irregular"],
			["No cyanosis", "Cyanosis present"],
			["Full sentences", "Unable to complete full sentences"],
			["No wheeze", "Wheeze present"],
		],
		vitals: [
			["rr", "RR /min", "16"],
			["spo2", "SpO2 %", "98"],
			["o2Flow", "O2 L/min", ""],
		],
		notes: "breathingNotes",
	},
	{
		key: "C",
		title: "Circulation",
		chips: [
			["Good colour", "Pale / flushed"],
			["Warm to touch", "Cold / clammy"],
			["Radial pulse palpable", "Radial pulse weak / absent"],
			["Regular pulse rhythm", "Irregular pulses"],
			["CRT <2s", "CRT ≥2s"],
			["No haemorrhage", "Haemorrhage"],
		],
		vitals: [
			["hr", "HR bpm", "72"],
			["bp", "BP mmHg", "120/80"],
			["bm", "BM mmol/L", "5.2"],
		],
		notes: "circulationNotes",
	},
	{
		key: "D",
		title: "Disability",
		chips: [
			["GCS 15", "GCS reduced"],
			["AOx4", "Not orientated x4"],
			["PEARL", "Pupils unequal / unreactive"],
			["Speech clear", "Speech impaired"],
			["Fully mobile", "Reduced mobility"],
		],
		vitals: [
			["gcsScore", "GCS /15", "15"],
			["pupils", "Pupils", "3mm equal"],
			["avpu", "AVPU", "A"],
		],
		notes: "disabilityNotes",
	},
	{
		key: "E",
		title: "Exposure",
		chips: [
			["Apyrexial", "Pyrexia"],
			["No rigors", "Rigors present"],
			["Normal skin colour", "Abnormal skin colour"],
			["Not clammy", "Clammy"],
			["Not diaphoretic", "Diaphoretic"],
			["No injuries", "Injury found"],
			["No rash", "Rash present"],
		],
		vitals: [["temp", "Temp C", "36.8"]],
		notes: "exposureNotes",
	},
];

const ROS = {
	resp: {
		title: "Respiratory",
		items: [
			["breathingRate", "Breathing rate normal", "Tachypnoea noted"],
			["cyanosis", "No cyanosis", "Cyanosis present"],
			["wheeze", "No wheeze", "Wheeze noted"],
			["haemoptysis", "No haemoptysis", "Haemoptysis present"],
			["sob", "No shortness of breath", "Shortness of breath present"],
			[
				"iwob",
				"No increased work of breathing",
				"Increased work of breathing noted",
			],
			["accessory", "No accessory muscle use", "Accessory muscle use present"],
		],
		extras:
			'<div class="auscultation-block"><label class="field-label">Auscultation findings</label><div class="square-grid ausc-grid" id="auscSoundGrid"></div><div id="auscLocationPanel" class="hidden"><div id="auscOtherWrap" class="hidden"><label class="field-label" for="auscOtherText">Describe finding</label><input id="auscOtherText" type="text" placeholder="e.g. pleural rub" /></div><label class="field-label">Location <span class="field-hint" style="display:inline;font-size:11px">(tap one or more, then add)</span></label><div class="square-grid ausc-loc-grid" id="auscLocGrid"></div><button id="auscAddButton" type="button" class="secondary-action" style="margin-top:8px">Add finding</button></div><div id="auscEntries" class="ausc-entries"></div><input id="respAus" type="hidden" /><p id="auscPreview" class="ausc-preview">Equal and clear bilateral air entry</p></div><label class="field-label" for="coughType">Cough</label><select id="coughType"><option>No cough</option><option>Dry cough present</option><option>Productive cough present</option></select><label class="field-label" for="respNotes">Additional notes</label><textarea id="respNotes" rows="2"></textarea>',
	},
	cvs: {
		title: "Cardiovascular",
		items: [
			["colour", "Good colour", "Poor colour noted"],
			["warm", "Warm to touch", "Cool / cold peripheries"],
			[
				"pulses",
				"Peripheral pulses palpable",
				"Peripheral pulses weak / absent",
			],
			["crt", "CRT <2s", "CRT >=2s"],
			["chestPain", "No chest pain", "Chest pain present"],
			["palpitations", "No palpitations", "Palpitations reported"],
			["oedema", "No oedema", "Oedema present"],
			[
				"calfPain",
				"No calf pain or tenderness",
				"Calf pain / tenderness noted",
			],
		],
		extras:
			'<label class="field-label" for="bpStatus">Blood pressure status</label><select id="bpStatus"><option>Normotensive</option><option>Hypotensive</option><option>Hypertensive</option></select><label class="field-label" for="ecg">ECG findings</label><input id="ecg" type="text" placeholder="Sinus rhythm - nil acute / not performed"><label class="field-label" for="cvsNotes">Additional notes</label><textarea id="cvsNotes" rows="2"></textarea>',
	},
	neuro: {
		title: "Neurological",
		items: [
			["aox4", "Alert and orientated x4", "Not fully orientated"],
			["gcs15", "GCS 15/15", "GCS reduced"],
			["pearl", "PEARL", "Pupils unequal / unreactive"],
			["fast", "FAST negative", "FAST positive"],
			["confusion", "No confusion", "Confusion noted"],
			["headache", "No headache", "Headache present"],
			["dizziness", "No dizziness", "Dizziness present"],
			["weakness", "No focal weakness", "Weakness noted"],
			[
				"numbness",
				"No numbness / altered sensation",
				"Numbness / altered sensation noted",
			],
			["loc", "No loss of consciousness", "Loss of consciousness reported"],
			["seizure", "No seizure activity", "Seizure activity reported"],
			["speech", "Speech clear and coherent", "Speech difficulty noted"],
		],
		extras:
			'<label class="field-label" for="neuroNotes">Additional notes</label><textarea id="neuroNotes" rows="2"></textarea>',
	},
	gi: {
		title: "Gastrointestinal",
		items: [
			["abdoPain", "No abdominal pain", "Abdominal pain present"],
			["backPain", "No back pain", "Back pain present"],
			["nausea", "No nausea", "Nausea present"],
			["vomiting", "No vomiting", "Vomiting reported"],
			["haematemesis", "No haematemesis", "Haematemesis reported"],
			["bowelHabit", "Bowel habits unchanged", "Change in bowel habit"],
			["distension", "No distension", "Abdominal distension noted"],
			["soft", "Abdomen soft", "Abdomen rigid"],
			["tender", "Non-tender", "Tenderness on palpation"],
			["guarding", "No guarding", "Guarding present"],
			["rebound", "No rebound tenderness", "Rebound tenderness present"],
		],
		extras:
			'<label class="field-label">Palpation findings by region</label><div class="multi-group abdo-grid" data-state="abdoRegions"></div><div class="grid-2" style="margin-top:12px"><div><label class="field-label" for="giFluidIntake">Fluid intake</label><select id="giFluidIntake"><option value="">Not assessed</option><option value="Normal">Normal</option><option value="Increased">Increased</option><option value="Reduced">Reduced</option></select></div><div><label class="field-label" for="giAppetite">Appetite</label><select id="giAppetite"><option value="">Not assessed</option><option value="Normal">Normal</option><option value="Increased">Increased</option><option value="Reduced">Reduced</option></select></div></div><label class="field-label" for="bowelSounds">Bowel sounds</label><input id="bowelSounds" type="text" placeholder="Present and normal"><label class="field-label" for="giNotes">Additional notes</label><textarea id="giNotes" rows="2"></textarea>',
	},
	urine: {
		title: "Urinary",
		items: [
			[
				"frequency",
				"No change to urinary frequency",
				"Change in urinary frequency",
			],
			["volume", "Volume unchanged", "Change in urinary volume"],
			["dysuria", "No pain on micturition", "Dysuria / pain on micturition"],
			["haematuria", "No haematuria", "Haematuria present"],
			["odour", "No offensive odour", "Offensive urinary odour noted"],
			["colour", "No change in urine colour", "Change in urine colour noted"],
			[
				"incontinence",
				"No urinary incontinence",
				"Urinary incontinence reported",
			],
		],
		extras:
			'<label class="field-label" for="urineNotes">Additional notes</label><textarea id="urineNotes" rows="2"></textarea>',
	},
	integ: {
		title: "Integumentary",
		items: [
			["fever", "No fever", "Pyrexia present"],
			["rigors", "No rigors", "Rigors reported"],
			["fatigue", "No fatigue", "Fatigue reported"],
			["colour", "Normal colour", "Abnormal colour noted"],
			["clammy", "Not clammy", "Clammy skin noted"],
			["diaphoresis", "Not diaphoretic", "Diaphoresis present"],
			["bruising", "No bruising", "Bruising noted"],
			["laceration", "No lacerations", "Lacerations present"],
			["rash", "No rash", "Rash noted"],
			["turgor", "Normal skin turgor", "Reduced skin turgor"],
		],
		extras:
			'<label class="field-label" for="integNotes">Additional notes</label><textarea id="integNotes" rows="2"></textarea>',
	},
	psych: {
		title: "Mental Health",
		items: [
			["moodAppropriate", "Mood appropriate", "Mood low or elevated"],
			["affectAppropriate", "Affect appropriate", "Flat or blunted affect"],
			["thoughtCoherent", "Thought process coherent", "Disorganised / tangential thinking"],
			["noHallucinations", "No hallucinations reported", "Hallucinations reported"],
			["noDelusions", "No delusions expressed", "Delusions expressed"],
			["oriented", "Oriented to person, place and time", "Disoriented"],
			["insight", "Insight present", "Impaired insight"],
			["noSuicidalIdeation", "No suicidal ideation expressed", "Suicidal ideation expressed"],
			["noSelfHarmEvident", "No self-harm evident on examination", "Self-harm evident on examination"],
		],
		extras:
			'<label class="field-label" for="psychBehaviour">Appearance and behaviour</label><input id="psychBehaviour" type="text" placeholder="e.g. Appropriately dressed, cooperative"><label class="field-label" for="psychSpeech">Speech</label><input id="psychSpeech" type="text" placeholder="e.g. Normal rate and volume"><label class="field-label" for="psychRisk">Risk level</label><select id="psychRisk"><option value="">Not assessed</option><option>Low</option><option>Medium</option><option>High</option><option>Very high</option></select><label class="field-label" for="psychProtective">Protective factors</label><input id="psychProtective" type="text" placeholder="e.g. Family support, future plans, engagement with services"><label class="field-label" for="psychNotes">Notes</label><textarea id="psychNotes" rows="2"></textarea>',
	},
	msk: {
		title: "Musculoskeletal",
		items: [
			["jointPain", "No joint pain", "Joint pain present"],
			["stiffness", "No stiffness", "Stiffness reported"],
			["swelling", "No swelling", "Swelling noted"],
			["injury", "No obvious signs of injury", "Signs of injury present"],
			[
				"rom",
				"Full range of movement of all limbs",
				"Reduced range of movement noted",
			],
			[
				"powerTone",
				"Normal power and tone throughout",
				"Reduced power / altered tone",
			],
		],
		extras:
			'<label class="field-label" for="mskNotes">Additional notes</label><textarea id="mskNotes" rows="2"></textarea>',
	},
};

document.addEventListener("DOMContentLoaded", () => {
	init();
	initDashboard();
});

function showDashboard() {
	$("#dashboard")?.classList.remove("hidden");
	$("#prf-tool")?.classList.add("hidden");
	$("#backButton")?.classList.add("hidden");
	$("#resetButton")?.classList.add("hidden");
}

function showFeature(feature) {
	if (feature === "eprf") {
		$("#dashboard")?.classList.add("hidden");
		$("#prf-tool")?.classList.remove("hidden");
		$("#backButton")?.classList.remove("hidden");
		$("#resetButton")?.classList.remove("hidden");
	}
}

function initDashboard() {
	$$(".feature-card:not(.coming-soon)").forEach((card) => {
		card.addEventListener("click", () => showFeature(card.dataset.feature));
		card.addEventListener("keydown", (e) => {
			if (e.key === "Enter" || e.key === " ") showFeature(card.dataset.feature);
		});
	});
	$("#backButton")?.addEventListener("click", showDashboard);
}

function init() {
	buildOptionButtons();
	buildAbcde();
	buildRos();
	buildAuscultation();
	buildInjurySection();
	buildTreatmentSection();
	buildSeizureSection();
	buildMhSection();
	buildConveyTransferChips();
	bindEvents();
	updateMapTags();
	applyWorseningDefault();
	updateWorseningScript();
	syncAuscultationOutput();
	handleConveyanceDisplay();
	enhanceSectionCards();
}

function buildOptionButtons() {
	Object.entries(OPTIONS).forEach(([key, options]) => {
		const container = $(`[data-state="${key}"]`);
		if (!container) return;
		options.forEach((option) => {
			const button = document.createElement("button");
			button.type = "button";
			button.className = "square-btn";
			button.textContent = option;
			button.dataset.value = option;
			container.append(button);
		});
	});
}

function buildAbcde() {
	const root = $("#abcdeContainer");
	ABCDE.forEach((section, index) => {
		const details = document.createElement("details");
		details.className = "section-card";

		details.innerHTML = `<summary><span>${section.key} - ${section.title}</span><small>${section.key}</small></summary><div class="section-body"><div class="square-grid abc-grid"></div><div class="vital-grid"></div><label class="field-label" for="${section.notes}">Notes</label><input id="${section.notes}" type="text" /></div>`;
		const chipRoot = $(".abc-grid", details);
		section.chips.forEach(([normal, abnormal]) => {
			const button = document.createElement("button");
			button.type = "button";
			button.className = "square-btn abc-chip selected";
			button.textContent = normal;
			button.dataset.abc = section.key;
			button.dataset.normal = normal;
			button.dataset.abnormal = abnormal;
			button.dataset.abcState = "normal";
			button.dataset.value = normal;
			chipRoot.append(button);
		});
		const vitalRoot = $(".vital-grid", details);
		section.vitals.forEach(([id, label, placeholder]) => {
			const box = document.createElement("div");
			box.className = "vital";
			box.innerHTML = `<label for="${id}">${label}</label><input id="${id}" type="text" placeholder="${placeholder}">`;
			vitalRoot.append(box);
		});
		if (!section.vitals.length) vitalRoot.remove();
		root.append(details);
	});
}

const AUSC_SOUNDS = [
	["normal", "Normal (equal & clear bilateral)"],
	["wheeze", "Wheeze"],
	["crackles", "Crackles"],
	["reduced", "Reduced air entry"],
	["bronchial", "Bronchial breathing"],
	["other", "Other"],
];
const AUSC_LOCATIONS = [
	["R-upper", "R upper"],
	["R-mid", "R mid"],
	["R-basal", "R basal"],
	["L-upper", "L upper"],
	["L-mid", "L mid"],
	["L-basal", "L basal"],
	["bilateral", "Bilateral"],
];

const INJURY_TYPES = [
	"Laceration",
	"Abrasion",
	"Contusion / bruising",
	"Haematoma",
	"Suspected fracture",
	"Open fracture",
	"Dislocation",
	"Sprain / strain",
	"Deformity",
	"Burn / scald",
	"Crush injury",
	"Penetrating wound",
	"Swelling",
	"Amputation",
];

const INJURY_INTERVENTIONS = [
	"Wound cleaned",
	"Wound dressed",
	"Wound closed (steri-strips)",
	"Pressure dressing",
	"Haemostatic dressing",
	"Tourniquet applied",
	"Splinted",
	"Buddy strapped",
	"Sling applied",
	"Cervical collar",
	"Ice pack",
];

const TX_AIRWAY = [
	"OPA",
	"NPA",
	"LMA / i-gel",
	"Endotracheal tube",
	"Suction",
	"BVM ventilation",
	"CPAP / PEEP",
	"Oxygen therapy",
];
const TX_WOUND = [
	"Direct pressure",
	"Simple dressing",
	"Wound closure strips",
	"Haemostatic dressing",
	"Tourniquet applied",
	"Wound packing",
	"Wound irrigation",
	"Burn dressing",
	"Eye irrigation",
	"Other",
];
const TX_MANUAL = [
	"Assisted walk",
	"Walking frame",
	"Wheelchair",
	"Carry chair (no tracks)",
	"Carry chair (with tracks)",
	"Banana board",
	"Slide sheet",
	"PAT slide",
	"Scoop stretcher",
	"Vacuum mattress",
	"Spinal board",
	"Stair chair",
	"Hoist",
	"Other",
];
const TX_OTHER = [
	"12-lead ECG",
	"Blood glucose monitoring",
	"Temperature",
	"Pain reassessment",
	"Position change",
	"Psychological support",
	"Safeguarding referral",
	"Other",
];

const SEIZURE_TYPES = [
	"Tonic-clonic (grand mal)", "Absence", "Focal / partial onset",
	"Myoclonic", "Atonic (drop attack)", "Status epilepticus", "Unknown / unwitnessed",
];
const SEIZURE_FEATURES = [
	"Tongue biting", "Urinary incontinence", "Limb jerking",
	"Eye deviation", "Cyanosis", "Frothing at mouth", "Head turning",
];
const SEIZURE_FINDINGS = [
	"Tongue laceration / bite mark", "Lip / cheek biting",
	"Urinary incontinence", "Faecal soiling",
	"Head injury / scalp wound", "Facial trauma",
	"Limb injury", "Back / spinal tenderness",
	"Shoulder dislocation", "Burn / contact injury",
	"No injuries found",
];
const SEIZURE_PRECIPITANTS = [
	"Missed medication", "Sleep deprivation", "Alcohol / substance use",
	"Fever / illness", "Stress", "Flickering / visual stimulus",
	"Hypoglycaemia", "Head injury", "Unknown",
];
const AED_COMPLIANCE = [
	"Compliant with AEDs", "Missed dose(s)", "Recently stopped medication",
	"Not prescribed AEDs", "Medication changed recently",
];

const MH_PCS = ["Mental health crisis", "Overdose / poisoning", "Self-harm"];
const MH_INTENT = ["Deliberate", "Accidental", "Unclear / unknown", "Intent denied"];
const MH_PLANNING = ["Planned", "Impulsive", "Unknown"];
const OD_PRESCRIBED = ["Prescribed medication", "OTC / purchased", "Non-prescribed / illicit", "Unknown"];
const SH_METHOD = ["Cutting", "Burning", "Strangulation / ligature", "Blunt trauma / hitting", "Scratching / picking", "Poisoning / ingestion", "Other"];
const SH_DEPTH = ["Superficial", "Deep", "Unknown"];

function buildAuscultation() {
	const soundGrid = $("#auscSoundGrid");
	const locGrid = $("#auscLocGrid");
	if (!soundGrid || !locGrid) return;
	AUSC_SOUNDS.forEach(([id, label]) => {
		const button = document.createElement("button");
		button.type = "button";
		button.className = `square-btn ausc-sound${id === "normal" ? " selected" : ""}`;
		button.textContent = label;
		button.dataset.sound = id;
		soundGrid.append(button);
	});
	AUSC_LOCATIONS.forEach(([id, label]) => {
		const button = document.createElement("button");
		button.type = "button";
		button.className = "square-btn ausc-loc";
		button.textContent = label;
		button.dataset.location = id;
		locGrid.append(button);
	});
	$("#auscAddButton")?.addEventListener("click", commitAuscLocations);
}

function buildInjurySection() {
	const typeGrid = $("#injuryTypeGrid");
	const intGrid = $("#injuryInterventionGrid");
	if (!typeGrid || !intGrid) return;
	INJURY_TYPES.forEach((type) => {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "square-btn";
		btn.textContent = type;
		btn.dataset.injuryType = type;
		typeGrid.append(btn);
	});
	INJURY_INTERVENTIONS.forEach((item) => {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "square-btn";
		btn.textContent = item;
		btn.dataset.injuryIntervention = item;
		intGrid.append(btn);
	});
	$("#addInjuryButton")?.addEventListener("click", addInjuryEntry);
}

function addInjuryEntry() {
	const region = val("injuryRegion");
	if (!region) return;
	state.injuryEntries.push({
		region,
		types: [...pendingInjuryTypes],
		nv: val("injuryNv"),
		interventions: [...pendingInjuryInterventions],
	});
	pendingInjuryTypes.clear();
	pendingInjuryInterventions.clear();
	$("#injuryRegion").value = "";
	$("#injuryNv").value = "";
	$$("[data-injury-type], [data-injury-intervention]").forEach((b) =>
		b.classList.remove("selected"),
	);
	renderInjuryEntries();
}

function removeInjuryEntry(index) {
	state.injuryEntries.splice(index, 1);
	renderInjuryEntries();
}

function renderInjuryEntries() {
	const root = $("#injuryEntries");
	if (!root) return;
	root.innerHTML = "";
	state.injuryEntries.forEach((entry, index) => {
		const row = document.createElement("div");
		row.className = "ausc-entry";
		const detail = [
			entry.types.join(", "),
			entry.nv,
			entry.interventions.length
				? `Interventions: ${entry.interventions.join(", ")}`
				: "",
		]
			.filter(Boolean)
			.join(". ");
		row.innerHTML = `<span><strong>${entry.region}</strong>${detail ? ": " + detail : ""}</span><button type="button" data-remove-injury="${index}" aria-label="Remove">×</button>`;
		root.append(row);
	});
}

function buildInjuryText() {
	if (!state.injuryEntries.length) return "No injuries documented.";
	return state.injuryEntries
		.map((entry) => {
			const parts = [
				entry.types.join(", "),
				entry.nv,
				entry.interventions.length
					? `Interventions: ${entry.interventions.join(", ")}`
					: "",
			]
				.filter(Boolean)
				.join(". ");
			return `${entry.region}: ${parts || "documented"}.`;
		})
		.join("\n");
}

function buildButtonGrid(containerId, items, groupAttr, groupKey, valueAttr) {
	const grid = $(`#${containerId}`);
	if (!grid) return;
	items.forEach((item) => {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "square-btn";
		btn.textContent = item;
		btn.dataset[groupAttr] = groupKey;
		btn.dataset[valueAttr] = item;
		grid.append(btn);
	});
}

function buildTreatmentSection() {
	buildButtonGrid("airwayInterventionGrid", TX_AIRWAY, "txGroup", "airway", "txValue");
	buildButtonGrid("woundInterventionGrid", TX_WOUND, "txGroup", "wound", "txValue");
	buildButtonGrid("manualHandlingGrid", TX_MANUAL, "txGroup", "manual", "txValue");
	buildButtonGrid("otherInterventionGrid", TX_OTHER, "txGroup", "other", "txValue");

	$("#addVaButton")?.addEventListener("click", addIvEntry);
	$("#addDrugButton")?.addEventListener("click", addDrugEntry);
	$("#addChangeButton")?.addEventListener("click", addChangeEntry);

	$("#vaType")?.addEventListener("change", () => {
		const isIv = val("vaType") === "IV Cannula";
		$("#vaGaugeWrap")?.classList.toggle("hidden", !isIv);
	});
}

function makeEntryManager(stateKey, containerId, formatFn, removeAttr) {
	const render = () => {
		const root = $(`#${containerId}`);
		if (!root) return;
		root.innerHTML = "";
		state[stateKey].forEach((entry, index) => {
			const row = document.createElement("div");
			row.className = "ausc-entry";
			row.innerHTML = `<span>${formatFn(entry)}</span><button type="button" data-${removeAttr}="${index}" aria-label="Remove">×</button>`;
			root.append(row);
		});
	};
	const remove = (index) => { state[stateKey].splice(index, 1); render(); };
	return { render, remove };
}

const { render: renderIvEntries, remove: removeIvEntry } = makeEntryManager(
	"ivEntries", "vaEntries",
	(e) => {
		const parts = [e.type];
		if (e.gauge) parts.push(e.gauge);
		if (e.site) parts.push(`— ${e.site}`);
		if (e.outcome) parts.push(`(${e.outcome})`);
		if (e.fluids) parts.push(`• ${e.fluids}`);
		return parts.join(" ");
	},
	"remove-va"
);

const { render: renderDrugEntries, remove: removeDrugEntry } = makeEntryManager(
	"drugEntries", "drugEntries",
	(e) => {
		const parts = [e.drug];
		if (e.dose) parts.push(e.dose);
		if (e.route) parts.push(`via ${e.route}`);
		if (e.time) parts.push(`at ${e.time}`);
		return parts.join(" ");
	},
	"remove-drug"
);

const { render: renderChangeEntries, remove: removeChangeEntry } = makeEntryManager(
	"clinicalChanges", "changeEntries",
	(e) => e.time ? `[${e.time}] ${e.desc}` : e.desc,
	"remove-change"
);

function addIvEntry() {
	const type = val("vaType");
	const site = val("vaSite");
	if (!type || !site) return;
	state.ivEntries.push({
		type,
		gauge: val("vaGauge"),
		site,
		outcome: val("vaOutcome"),
		fluids: val("vaFluids"),
	});
	["vaType", "vaGauge", "vaSite", "vaOutcome", "vaFluids"].forEach((id) => { const el = $(`#${id}`); if (el) el.value = ""; });
	$("#vaGaugeWrap")?.classList.add("hidden");
	renderIvEntries();
}

function addDrugEntry() {
	const drug = val("drugName");
	if (!drug) return;
	state.drugEntries.push({
		drug,
		dose: val("drugDose"),
		route: val("drugRoute"),
		time: val("drugTime"),
	});
	["drugName", "drugDose", "drugRoute", "drugTime"].forEach((id) => { const el = $(`#${id}`); if (el) el.value = ""; });
	renderDrugEntries();
}

function addChangeEntry() {
	const desc = val("changeDesc");
	if (!desc) return;
	state.clinicalChanges.push({ time: val("changeTime"), desc });
	["changeDesc", "changeTime"].forEach((id) => { const el = $(`#${id}`); if (el) el.value = ""; });
	renderChangeEntries();
}

function buildChangesText() {
	const lines = [];
	if (state.clinicalChanges.length) {
		lines.push("Clinical changes noted during assessment:");
		state.clinicalChanges.forEach((e) => {
			lines.push(`  • ${e.time ? `[${e.time}] ` : ""}${e.desc}`);
		});
	}
	const additional = val("additionalInfo");
	if (additional) lines.push(`Additional information: ${additional}`);
	return lines.join("\n");
}

function buildTreatmentText() {
	const lines = [];
	if (state.airwayInterventions.size)
		lines.push(
			`Airway/breathing: ${[...state.airwayInterventions].join(", ")}.`,
		);
	if (state.ivEntries.length) {
		lines.push("Vascular access:");
		state.ivEntries.forEach((e) => {
			const parts = [e.type];
			if (e.gauge) parts.push(e.gauge);
			if (e.site) parts.push(`— ${e.site}`);
			if (e.outcome) parts.push(`— ${e.outcome}`);
			if (e.fluids) parts.push(`(${e.fluids})`);
			lines.push(`  ${parts.join(" ")}`);
		});
	}
	if (state.drugEntries.length) {
		lines.push("Medications given:");
		state.drugEntries.forEach((e) => {
			const parts = [e.drug];
			if (e.dose) parts.push(e.dose);
			if (e.route) parts.push(`via ${e.route}`);
			if (e.time) parts.push(`at ${e.time}`);
			lines.push(`  ${parts.join(" ")}`);
		});
	}
	if (state.woundInterventions.size) {
		const items = [...state.woundInterventions].map((v) => v === "Other" && val("woundOther") ? val("woundOther") : v);
		lines.push(`Wound management: ${items.join(", ")}.`);
	}
	if (state.manualHandling.size) {
		const items = [...state.manualHandling].map((v) => v === "Other" && val("manualOther") ? val("manualOther") : v);
		lines.push(`Manual handling: ${items.join(", ")}.`);
	}
	if (state.otherInterventions.size) {
		const items = [...state.otherInterventions].map((v) => v === "Other" && val("otherIntOther") ? val("otherIntOther") : v);
		lines.push(`Other: ${items.join(", ")}.`);
	}
	if (val("treatmentNotes")) lines.push(val("treatmentNotes"));
	return lines.length ? lines.join("\n") : "No interventions documented.";
}

function buildSeizureSection() {
	buildButtonGrid("seizureTypeGrid", SEIZURE_TYPES, "szGroup", "type", "szValue");
	buildButtonGrid("seizureFeaturesGrid", SEIZURE_FEATURES, "szGroup", "features", "szValue");
	buildButtonGrid("seizureFindingsGrid", SEIZURE_FINDINGS, "szGroup", "findings", "szValue");
	buildButtonGrid("seizurePrecipitantsGrid", SEIZURE_PRECIPITANTS, "szGroup", "precipitants", "szValue");
	buildButtonGrid("aedComplianceGrid", AED_COMPLIANCE, "szGroup", "aed", "szValue");
}

function buildSeizureText() {
	const lines = [];
	if (state.seizureType.size) lines.push(`Seizure type: ${[...state.seizureType].join(", ")}.`);
	if (val("seizureCount")) lines.push(`Number of seizures: ${val("seizureCount")}.`);
	if (val("seizureDuration")) lines.push(`Duration: ${val("seizureDuration")}.`);
	if (val("seizureTime")) lines.push(`Time of onset: ${val("seizureTime")}.`);
	if (isChecked("seizureWitnessed")) {
		const by = val("seizureWitnessedBy");
		lines.push(`Witnessed: Yes${by ? ` — ${by}` : ""}.`);
	} else {
		lines.push("Witnessed: No / unknown.");
	}
	if (isChecked("seizureLOC")) lines.push("Loss of consciousness during seizure: Yes.");
	if (state.seizureFeatures.size) lines.push(`Features during seizure: ${[...state.seizureFeatures].join(", ")}.`);
	if (state.seizureFindings.size) lines.push(`Post-seizure findings on examination: ${[...state.seizureFindings].join(", ")}.`);
	const postictal = isChecked("seizurePostictal");
	if (postictal) {
		const dur = val("seizurePostictalDuration");
		lines.push(`Postictal phase: Yes${dur ? ` — duration ${dur}` : ""}.`);
	}
	if (val("seizureRecovery")) lines.push(`Recovery to baseline: ${val("seizureRecovery")}.`);
	if (isChecked("seizureKnownEpileptic")) {
		const diag = val("seizureEpilepsyDiagnosis");
		lines.push(`Known epileptic: Yes${diag ? ` (${diag})` : ""}.`);
		if (val("seizureLastPrior")) lines.push(`Last seizure prior to today: ${val("seizureLastPrior")}.`);
		if (val("seizureUsualPattern")) lines.push(`Usual pattern: ${val("seizureUsualPattern")}.`);
		if (state.aedCompliance.size) lines.push(`AED compliance: ${[...state.aedCompliance].join(", ")}.`);
	}
	if (state.seizurePrecipitants.size) lines.push(`Precipitating factors: ${[...state.seizurePrecipitants].join(", ")}.`);
	if (val("seizureNotes")) lines.push(val("seizureNotes"));
	return lines.length ? lines.join("\n") : "No seizure assessment documented.";
}

function buildMhSection() {
	buildButtonGrid("mhIntentGrid", MH_INTENT, "mhGroup", "intent", "mhValue");
	buildButtonGrid("mhPlanningGrid", MH_PLANNING, "mhGroup", "planning", "mhValue");
	buildButtonGrid("odPrescribedGrid", OD_PRESCRIBED, "mhGroup", "odPrescribed", "mhValue");
	buildButtonGrid("shMethodGrid", SH_METHOD, "mhGroup", "shMethod", "mhValue");
	buildButtonGrid("shDepthGrid", SH_DEPTH, "mhGroup", "shDepth", "mhValue");
}

function buildMhAssessmentText() {
	const pc = getPc();
	const lines = [];
	if (state.mhIntent.size) lines.push(`Intent: ${[...state.mhIntent].join(", ")}.`);
	if (state.mhPlanning.size) lines.push(`Nature of act: ${[...state.mhPlanning].join(", ")}.`);
	if (val("mhTriggers")) lines.push(`Triggers / precipitants: ${val("mhTriggers")}.`);
	if (isChecked("mhPrevious")) {
		lines.push(`Previous episodes: ${val("mhPreviousDetails") || "Yes — details not documented"}.`);
	}
	if (pc === "Overdose / poisoning") {
		if (val("odSubstance")) lines.push(`Substance(s): ${val("odSubstance")}.`);
		if (val("odAmount")) lines.push(`Amount: ${val("odAmount")}.`);
		if (val("odTime")) lines.push(`Time taken: ${val("odTime")}.`);
		if (val("odRoute")) lines.push(`Route: ${val("odRoute")}.`);
		if (isChecked("odAlcohol")) lines.push("Alcohol co-ingestion reported.");
		if (state.odPrescribed.size) lines.push(`Source: ${[...state.odPrescribed].join(", ")}.`);
	}
	if (pc === "Self-harm") {
		if (state.shMethod.size) lines.push(`Method: ${[...state.shMethod].join(", ")}.`);
		if (state.shDepth.size) lines.push(`Wound depth: ${[...state.shDepth].join(", ")}.`);
	}
	if (val("mhCurrentServices")) lines.push(`Current MH services: ${val("mhCurrentServices")}.`);
	if (val("mhS136")) lines.push(`S136 / MHA: ${val("mhS136")}.`);
	if (val("mhNotes")) lines.push(val("mhNotes"));
	return lines.length ? lines.join("\n") : "No MH assessment details documented.";
}

function buildRos() {
	const root = $("#rosContainer");
	Object.entries(ROS).forEach(([key, section], index) => {
		const details = document.createElement("details");
		details.className = "section-card";

		details.innerHTML = `<summary><span>${section.title}</span><small id="badge-${key}" class="status-pill">All normal</small></summary><div class="section-body"><div class="square-grid ros-grid"></div>${section.extras}</div>`;
		const grid = $(".ros-grid", details);
		section.items.forEach(([id, normal, abnormal]) => {
			const stateId = `${key}_${id}`;
			state.ros[stateId] = "normal";
			const button = document.createElement("button");
			button.type = "button";
			button.className = "square-btn ros-chip selected";
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
	$$(".tab").forEach((tab) =>
		tab.addEventListener("click", () => switchTab(tab.dataset.tab)),
	);
	$("#resetButton").addEventListener("click", () => {
		if (confirm("Clear all data and start a new PRF?")) location.reload();
	});
	$("#pcSelect").addEventListener("change", () => {
		const pc = val("pcSelect");
		$("#pcOtherWrap").classList.toggle("hidden", pc !== "Other");
		$("#fallsAssessmentCard").classList.toggle("hidden", pc !== "Fall");
		$("#headInjuryCard").classList.toggle("hidden", pc !== "Head injury");
		$("#seizureAssessmentCard").classList.toggle("hidden", pc !== "Seizure");
		$("#mhAssessmentCard").classList.toggle("hidden", !MH_PCS.includes(pc));
		$("#odDetailsWrap").classList.toggle("hidden", pc !== "Overdose / poisoning");
		$("#shDetailsWrap").classList.toggle("hidden", pc !== "Self-harm");
		if (state.worseningAuto) applyWorseningDefault();
		else updateWorseningScript();
	});
	$("#capacityStatus").addEventListener("change", handleCapacityDisplay);
	$("#worseningMode").addEventListener("change", () => {
		state.worseningAuto = false;
		$("#customWorsening").classList.toggle(
			"hidden",
			val("worseningMode") !== "Custom",
		);
		updateWorseningScript();
	});
	$("#conveyanceDecision").addEventListener("change", () => {
		handleConveyanceDisplay();
		applyWorseningDefault();
	});
	$("#conveyHospital")?.addEventListener("change", handleConveyanceDisplay);
	$("#conveyDepartment")?.addEventListener("change", handleConveyanceDisplay);
	$("#clearPainButton")?.addEventListener("click", clearPainAssessment);
	$("#clearBodyMapButton")?.addEventListener("click", clearBodyMap);
	$("#noPain").addEventListener("change", () => {
		const noPain = $("#noPain").checked;
		$("#painBodyMapWrap").classList.toggle("hidden", noPain);
		$("#painCharacterGroup").classList.toggle("hidden", noPain);
	});
	$("#oaFound").addEventListener("change", () => {
		const notPatient = $("#oaFound").value !== "Greeted by patient";
		$("#oaPatientContactWrap").style.display = notPatient ? "" : "none";
		if (!notPatient) {
			$("#oaPatientFoundHow").value = "";
		}
	});
	$("#headLOC").addEventListener("change", () =>
		$("#headLOCDurationWrap").classList.toggle(
			"hidden",
			!$("#headLOC").checked,
		),
	);
	$("#headRetrograde").addEventListener("change", () =>
		$("#headRetroDurationWrap").classList.toggle(
			"hidden",
			!$("#headRetrograde").checked,
		),
	);
	$("#handoverFormat").addEventListener("change", () => {
		const fmt = $("#handoverFormat").value;
		$("#handoverEtaWrap").classList.toggle("hidden", fmt !== "ASHICE");
		$("#incidentTimeWrap").classList.toggle("hidden", fmt !== "ATMIST");
	});
	$("#generateOeButton").addEventListener("click", generateOe);
	$("#clearOeButton").addEventListener(
		"click",
		() => ($("#oeText").value = ""),
	);
	$("#refreshButton").addEventListener("click", generateOutput);
	$("#copyButton").addEventListener("click", copyOutput);

	document.addEventListener("click", (event) => {
		const option = event.target.closest(".multi-group .square-btn");
		if (option) return toggleMulti(option);
		const abc = event.target.closest(".abc-chip");
		if (abc) return toggleAbc(abc);
		const convey = event.target.closest(".convey-chip");
		if (convey) return toggleConveyChip(convey);
		const ros = event.target.closest(".ros-chip");
		if (ros) return toggleRos(ros);
		const mapTab = event.target.closest("[data-map-mode]");
		if (mapTab) return setMapMode(mapTab.dataset.mapMode);
		const part = event.target.closest(".body-part");
		if (part) return toggleBodyPart(part);
		const remove = event.target.closest("[data-remove-part]");
		if (remove)
			return removeBodyPart(remove.dataset.removePart, remove.dataset.partType);
		const auscSound = event.target.closest(".ausc-sound");
		if (auscSound) return selectAuscSound(auscSound);
		const auscLoc = event.target.closest(".ausc-loc");
		if (auscLoc) return toggleAuscLocation(auscLoc);
		const removeAusc = event.target.closest("[data-remove-ausc]");
		if (removeAusc)
			return removeAuscEntry(Number(removeAusc.dataset.removeAusc));
		const injuryTypeBtn = event.target.closest("[data-injury-type]");
		if (injuryTypeBtn) {
			const v = injuryTypeBtn.dataset.injuryType;
			pendingInjuryTypes.has(v)
				? pendingInjuryTypes.delete(v)
				: pendingInjuryTypes.add(v);
			injuryTypeBtn.classList.toggle("selected", pendingInjuryTypes.has(v));
			return;
		}
		const injuryIntBtn = event.target.closest("[data-injury-intervention]");
		if (injuryIntBtn) {
			const v = injuryIntBtn.dataset.injuryIntervention;
			pendingInjuryInterventions.has(v)
				? pendingInjuryInterventions.delete(v)
				: pendingInjuryInterventions.add(v);
			injuryIntBtn.classList.toggle(
				"selected",
				pendingInjuryInterventions.has(v),
			);
			return;
		}
		const removeInjury = event.target.closest("[data-remove-injury]");
		if (removeInjury)
			return removeInjuryEntry(Number(removeInjury.dataset.removeInjury));
		const szChip = event.target.closest("[data-sz-group]");
		if (szChip) {
			const map = { type: "seizureType", features: "seizureFeatures", findings: "seizureFindings", precipitants: "seizurePrecipitants", aed: "aedCompliance" };
			const set = state[map[szChip.dataset.szGroup]];
			if (!set) return;
			const v = szChip.dataset.szValue;
			set.has(v) ? set.delete(v) : set.add(v);
			szChip.classList.toggle("selected", set.has(v));
			return;
		}
		const mhChip = event.target.closest("[data-mh-group]");
		if (mhChip) {
			const map = { intent: "mhIntent", planning: "mhPlanning", odPrescribed: "odPrescribed", shMethod: "shMethod", shDepth: "shDepth" };
			const set = state[map[mhChip.dataset.mhGroup]];
			if (!set) return;
			const v = mhChip.dataset.mhValue;
			set.has(v) ? set.delete(v) : set.add(v);
			mhChip.classList.toggle("selected", set.has(v));
			return;
		}
		const txChip = event.target.closest("[data-tx-group]");
		if (txChip) {
			const map = {
				airway: "airwayInterventions",
				wound: "woundInterventions",
				manual: "manualHandling",
				other: "otherInterventions",
			};
			const otherWrap = {
				wound: "woundOtherWrap",
				manual: "manualOtherWrap",
				other: "otherIntOtherWrap",
			};
			const set = state[map[txChip.dataset.txGroup]];
			if (!set) return;
			const v = txChip.dataset.txValue;
			set.has(v) ? set.delete(v) : set.add(v);
			txChip.classList.toggle("selected", set.has(v));
			const wrapId = otherWrap[txChip.dataset.txGroup];
			if (v === "Other" && wrapId) {
				$(`#${wrapId}`)?.classList.toggle("hidden", !set.has("Other"));
			}
			return;
		}
		const removeVa = event.target.closest("[data-remove-va]");
		if (removeVa) return removeIvEntry(Number(removeVa.dataset.removeVa));
		const removeDrug = event.target.closest("[data-remove-drug]");
		if (removeDrug)
			return removeDrugEntry(Number(removeDrug.dataset.removeDrug));
		const removeChange = event.target.closest("[data-remove-change]");
		if (removeChange)
			return removeChangeEntry(Number(removeChange.dataset.removeChange));
		const copySectionBtn = event.target.closest("[data-copy-section]");
		if (copySectionBtn)
			return copySectionById(copySectionBtn.dataset.copySection);
	});
}

let pendingAuscSound = null;
let pendingInjuryTypes = new Set();
let pendingInjuryInterventions = new Set();

function switchTab(tabName) {
	$$(".tab").forEach((tab) =>
		tab.classList.toggle("active", tab.dataset.tab === tabName),
	);
	$$(".panel").forEach((panel) =>
		panel.classList.toggle("active", panel.id === `panel-${tabName}`),
	);
	if (tabName === "output") generateOutput();
}

function toggleMulti(button) {
	const stateKey = button.closest(".multi-group").dataset.state;
	const set = state[stateKey];
	const value = button.dataset.value;
	if (set.has(value)) {
		set.delete(value);
		button.classList.remove("selected");
		if (value === "Other") setOtherFactorVisible(stateKey, false);
	} else {
		set.add(value);
		button.classList.add("selected");
		if (value === "Other") setOtherFactorVisible(stateKey, true);
	}
}

function setOtherFactorVisible(stateKey, visible) {
	const wrapId =
		stateKey === "exacerbating"
			? "exacerbatingOtherWrap"
			: stateKey === "relieving"
				? "relievingOtherWrap"
				: null;
	if (wrapId) $(`#${wrapId}`)?.classList.toggle("hidden", !visible);
}

function buildConveyTransferChips() {
	const root = $("#conveyTransferGrid");
	if (!root) return;
	CONVEY_TRANSFER.forEach(([normal, abnormal]) => {
		const button = document.createElement("button");
		button.type = "button";
		button.className = "square-btn convey-chip selected";
		button.textContent = normal;
		button.dataset.normal = normal;
		button.dataset.abnormal = abnormal;
		button.dataset.conveyState = "normal";
		if (abnormal === "Clinical change during conveyance")
			button.dataset.clinicalChange = "true";
		if (abnormal === "Care escalated en route")
			button.dataset.escalated = "true";
		root.append(button);
	});
}

function toggleConveyChip(button) {
	const isAbnormal = button.dataset.conveyState === "abnormal";
	const next = isAbnormal ? "normal" : "abnormal";
	button.dataset.conveyState = next;
	button.classList.toggle("abnormal", next === "abnormal");
	button.classList.toggle("selected", next === "normal");
	button.textContent =
		next === "abnormal" ? button.dataset.abnormal : button.dataset.normal;
	if (button.dataset.clinicalChange) {
		$("#conveyChangeWrap")?.classList.toggle("hidden", next !== "abnormal");
	}
	if (button.dataset.escalated) {
		$("#conveyEscalatedWrap")?.classList.toggle("hidden", next !== "abnormal");
	}
	if (button.dataset.clinicalChange && next === "abnormal") {
		const stable = $('.convey-chip[data-normal="Remained stable throughout"]');
		if (stable?.dataset.conveyState === "normal") toggleConveyChip(stable);
	}
}

function getConveyTransferText() {
	return $$(".convey-chip")
		.map((chip) => chip.textContent)
		.join("; ");
}

function toggleAbc(button) {
	const isAbnormal = button.dataset.abcState === "abnormal";
	const next = isAbnormal ? "normal" : "abnormal";
	setAbcChipState(button, next);
	if (next === "abnormal") syncDisabilityLinks(button);
}

function setAbcChipState(button, state) {
	const isAbnormal = state === "abnormal";
	button.dataset.abcState = state;
	button.classList.toggle("abnormal", isAbnormal);
	button.classList.toggle("selected", !isAbnormal);
	button.textContent = isAbnormal
		? button.dataset.abnormal
		: button.dataset.normal;
	button.dataset.value = button.textContent;
}

function syncDisabilityLinks(button) {
	if (button.dataset.abc !== "D") return;
	const normalLabel = button.dataset.normal;
	ABC_DISABILITY_LINKS.forEach(([left, right]) => {
		const linkedNormal =
			left === normalLabel ? right : right === normalLabel ? left : null;
		if (!linkedNormal) return;
		const linked = $(`.abc-chip[data-abc="D"][data-normal="${linkedNormal}"]`);
		if (linked && linked.dataset.abcState === "normal")
			setAbcChipState(linked, "abnormal");
	});
}

function toggleRos(button) {
	const isAbnormal = state.ros[button.dataset.stateId] === "abnormal";
	state.ros[button.dataset.stateId] = isAbnormal ? "normal" : "abnormal";
	button.classList.toggle("abnormal", !isAbnormal);
	button.classList.toggle("selected", isAbnormal);
	button.textContent = isAbnormal
		? button.dataset.normal
		: button.dataset.abnormal;
	updateRosBadge(button.dataset.section);
}

function updateRosBadge(section) {
	const hasAbnormal = Object.entries(state.ros).some(
		([key, value]) => key.startsWith(`${section}_`) && value === "abnormal",
	);
	const badge = $(`#badge-${section}`);
	badge.textContent = hasAbnormal ? "Findings" : "All normal";
	badge.classList.toggle("flagged", hasAbnormal);
}

function setMapMode(mode) {
	state.mapMode = mode;
	$$(".mini-tab").forEach((btn) =>
		btn.classList.toggle("active", btn.dataset.mapMode === mode),
	);
}

function toggleBodyPart(part) {
	const targetSet =
		state.mapMode === "site" ? state.siteParts : state.radiationParts;
	const otherSet =
		state.mapMode === "site" ? state.radiationParts : state.siteParts;
	const id = part.id;
	if (targetSet.has(id)) targetSet.delete(id);
	else {
		targetSet.add(id);
		otherSet.delete(id);
	}
	part.classList.toggle("site", state.siteParts.has(id));
	part.classList.toggle("radiation", state.radiationParts.has(id));
	updateMapTags();
}

function removeBodyPart(id, type) {
	const set = type === "site" ? state.siteParts : state.radiationParts;
	set.delete(id);
	$(`#${CSS.escape(id)}`)?.classList.remove(type);
	updateMapTags();
}

function updateMapTags() {
	renderPartTags("siteTags", state.siteParts, "site", "Not selected");
	renderPartTags(
		"radiationTags",
		state.radiationParts,
		"radiation",
		"No radiation selected",
	);
}

function renderPartTags(containerId, set, type, emptyText) {
	const container = $(`#${containerId}`);
	container.innerHTML = "";
	if (!set.size) {
		container.textContent = emptyText;
		return;
	}
	set.forEach((id) => {
		const part = $(`#${CSS.escape(id)}`);
		const tag = document.createElement("span");
		tag.className = `tag ${type}`;
		tag.innerHTML = `${part?.dataset.label || id}<button type="button" data-remove-part="${id}" data-part-type="${type}" aria-label="Remove ${part?.dataset.label || id}">×</button>`;
		container.append(tag);
	});
}

function handleCapacityDisplay() {
	const status = val("capacityStatus");
	$("#capacityChecks").classList.toggle(
		"hidden",
		status === "Lacks capacity" || status === "Not applicable",
	);
	$("#bestInterests").classList.toggle("hidden", status !== "Lacks capacity");
}

function getSelectedParts(set) {
	return [...set]
		.map((id) => $(`#${CSS.escape(id)}`)?.dataset.label || id)
		.join(", ");
}

function rosLine(section) {
	return (
		ROS[section].items
			.map(([id, normal, abnormal]) =>
				state.ros[`${section}_${id}`] === "abnormal" ? abnormal : normal,
			)
			.join(". ") + "."
	);
}

function abcLine(section) {
	const values = $$(`[data-abc="${section.key}"]`).map(
		(button) => button.textContent,
	);
	const vitals = section.vitals
		.map(([id, label]) => (val(id) ? `${label}: ${val(id)}` : null))
		.filter(Boolean);
	const notes = val(section.notes);
	return `${section.key} - ${[...values, ...vitals, notes].filter(Boolean).join(", ") || "assessed"}.`;
}

function generateOe() {
	syncAuscultationOutput();
	const oe = [
		"OE:",
		"",
		`OA: ${val("oaFound")}${val("oaLocation") ? ` at ${val("oaLocation")}` : ""}; ${val("oaMobility").toLowerCase()}. ${val("oaFound") !== "Greeted by patient" && val("oaPatientFoundHow") ? `On reaching patient: ${val("oaPatientFoundHow")}. ` : ""}${isChecked("oaConsent") ? "Consented to assessment. " : ""}${isChecked("oaNoABC") ? "No immediate ABC concerns. " : ""}${isChecked("oaNormalPresentation") ? "Normal presentation on arrival. " : ""}${val("oaNotes")}`.trim(),
		"",
		ABCDE.map(abcLine).join("\n"),
		"",
		`Resp: ${rosLine("resp")} ${val("respAus") ? `Auscultation: ${val("respAus")}.` : ""}`,
		`CVS: ${rosLine("cvs")} ${val("ecg") ? `ECG: ${val("ecg")}.` : ""}`,
		`Neuro: ${rosLine("neuro")}`,
		`Abdo/GI: ${rosLine("gi")} ${[state.abdoRegions.size ? `Palpation findings: ${[...state.abdoRegions].join(", ")}.` : "", val("giFluidIntake") ? `Fluid intake: ${val("giFluidIntake")}.` : "", val("giAppetite") ? `Appetite: ${val("giAppetite")}.` : "", val("bowelSounds") ? `Bowel sounds: ${val("bowelSounds")}.` : ""].filter(Boolean).join(" ")}`.trimEnd(),
		`Urinary: ${rosLine("urine")}`,
		`Skin: ${rosLine("integ")}`,
		`MSK: ${rosLine("msk")}`,
		`Mental health: ${rosLine("psych")}`,
	].join("\n");
	$("#oeText").value = oe;
}

function getPc() {
	return val("pcSelect") === "Other"
		? val("pcOther") || "Other"
		: val("pcSelect") || "Not specified";
}

function listFactors(set, otherFieldId, fallback) {
	const items = [...set].filter((value) => value !== "Other");
	const other = val(otherFieldId);
	if (set.has("Other") && other) items.push(other);
	return items.length ? items.join(", ") : fallback;
}

function rosBlock(section) {
	const extras = {
		resp: () =>
			`${val("coughType")}. ${val("respAus") ? `Auscultation: ${val("respAus")}.` : ""} ${val("respNotes")}`.trim(),
		cvs: () =>
			`${val("bpStatus")}. ${val("ecg") ? `ECG: ${val("ecg")}.` : ""} ${val("cvsNotes")}`.trim(),
		gi: () => {
			const parts = [];
			if (state.abdoRegions.size) parts.push(`Palpation findings: ${[...state.abdoRegions].join(", ")}.`);
			if (val("giFluidIntake"))
				parts.push(`Fluid intake: ${val("giFluidIntake")}.`);
			if (val("giAppetite")) parts.push(`Appetite: ${val("giAppetite")}.`);
			if (val("bowelSounds"))
				parts.push(`Bowel sounds: ${val("bowelSounds")}.`);
			if (val("giNotes")) parts.push(val("giNotes"));
			return parts.join(" ");
		},
		psych: () => {
			const parts = [];
			if (val("psychBehaviour")) parts.push(`Appearance/behaviour: ${val("psychBehaviour")}.`);
			if (val("psychSpeech")) parts.push(`Speech: ${val("psychSpeech")}.`);
			if (val("psychRisk")) parts.push(`Risk level: ${val("psychRisk")}.`);
			if (val("psychProtective")) parts.push(`Protective factors: ${val("psychProtective")}.`);
			if (val("psychNotes")) parts.push(val("psychNotes"));
			return parts.join(" ");
		},
	};
	return `${rosLine(section)} ${extras[section]?.() || val(`${section}Notes`) || ""}`.trim();
}

function buildHandoverText() {
	const format = val("handoverFormat") || "ASHICE";
	const age = val("ptAge");
	const sex = val("ptSex");
	const sexLabel = sex && sex !== "Not specified" ? sex.toLowerCase() : "";
	const pt = [age ? `${age}yo` : "", sexLabel].filter(Boolean).join(" ");
	const pc = getPc();
	const hpcCaller = val("hpcCaller");
	const hpcCat = val("hpcCategory");
	const hpcCatWord = hpcCat === "C4" ? "generated" : "dispatched";
	const hpcCallLine =
		hpcCaller && hpcCat
			? `${hpcCaller}, ${hpcCat} ${hpcCatWord}`
			: hpcCaller || (hpcCat ? `${hpcCat} ${hpcCatWord}` : "");
	const hpc = [val("hpcEvents"), hpcCallLine].filter(Boolean).join(". ") || "";
	const pmh = isChecked("noPmh")
		? "No significant PMH"
		: val("pmh") || "Not documented";
	const meds = isChecked("noMeds")
		? "No regular medications"
		: val("medications") || "Not documented";
	const allergies = isChecked("nkda")
		? "NKDA"
		: val("allergies") || "Not documented";
	const extraNotes = val("handoverNotes");

	const vitalParts = [
		val("gcsScore")
			? `GCS ${val("gcsScore")}`
			: val("avpu")
				? `AVPU ${val("avpu")}`
				: "",
		val("hr") ? `HR ${val("hr")}` : "",
		val("bp") ? `BP ${val("bp")}` : "",
		val("spo2") ? `SpO2 ${val("spo2")}%` : "",
		val("rr") ? `RR ${val("rr")}` : "",
		val("temp") ? `Temp ${val("temp")}°C` : "",
	].filter(Boolean);
	const vitalsLine = vitalParts.length
		? vitalParts.join(", ")
		: "Not documented";

	const treatmentParts = ABCDE.flatMap((s) => {
		const n = val(s.notes);
		return n ? [n] : [];
	});
	const treatment = treatmentParts.length
		? treatmentParts.join(". ")
		: "None documented";

	if (format === "ASHICE") {
		return [
			`A — Age: ${age || "Not documented"}`,
			`S — Sex: ${sex || "Not specified"}`,
			`H — History: ${pc}. ${hpc ? hpc + ". " : ""}PMH: ${pmh}. Medications: ${meds}. Allergies: ${allergies}.`,
			`I — Illness/Injury: ${pc}${val("onsetType") ? `. Onset: ${val("onsetType")}${val("onsetTime") ? `, ${val("onsetTime")}` : ""}` : ""}.`,
			`C — Condition: ${vitalsLine}.`,
			`E — ETA: ${val("handoverEta") || "Not given"}`,
			...(extraNotes ? ["", extraNotes] : []),
		].join("\n");
	}

	if (format === "SBAR") {
		return [
			`S — Situation: ${pt ? pt + " " : ""}presenting with ${pc.toLowerCase()}${hpc ? `. ${hpc}` : ""}.`,
			`B — Background: PMH: ${pmh}. Medications: ${meds}. Allergies: ${allergies}.`,
			`A — Assessment:\n${ABCDE.map(abcLine).join("\n")}`,
			`R — Recommendation: ${buildConveyanceText()}`,
			...(extraNotes ? ["", extraNotes] : []),
		].join("\n\n");
	}

	if (format === "ATMIST") {
		return [
			`A — Age: ${age || "Not documented"}`,
			`T — Time: ${val("incidentTime") || "Not documented"}`,
			`M — Mechanism: ${hpc || val("onsetType") || "Not documented"}`,
			`I — Injuries/Illness: ${pc}`,
			`S — Signs: ${vitalsLine}`,
			`T — Treatment: ${treatment}`,
			...(extraNotes ? ["", extraNotes] : []),
		].join("\n");
	}

	return "";
}

function getNiceCTCriteria() {
	const criteria = [];
	if (isChecked("headGcsReduced"))
		criteria.push("GCS <15 at assessment or 2 hours post-injury");
	if (
		state.headSigns.has("Suspected open fracture") ||
		state.headSigns.has("Suspected depressed fracture")
	)
		criteria.push("suspected open or depressed skull fracture");
	if (
		state.headSigns.has("Periorbital bruising (panda eyes)") ||
		state.headSigns.has("Battle's sign") ||
		state.headSigns.has("Haemotympanum") ||
		state.headSigns.has("CSF rhinorrhoea") ||
		state.headSigns.has("CSF otorrhoea")
	)
		criteria.push("signs of basal skull fracture");
	if (state.headSymptoms.has("Seizure"))
		criteria.push("post-traumatic seizure");
	if (state.headSigns.has("Focal neurological deficit"))
		criteria.push("focal neurological deficit");
	const vomitCount = val("headVomitingCount");
	if (vomitCount && vomitCount !== "1 episode")
		criteria.push("more than one episode of vomiting");
	if (
		isChecked("headRetrograde") &&
		val("headRetroDuration") === "> 30 minutes"
	)
		criteria.push("retrograde amnesia > 30 minutes");
	if (isChecked("headAnticoag"))
		criteria.push("on anticoagulants — CT within 8 hours");
	return criteria;
}

function buildHeadInjuryText() {
	const mechanism = listSet(state.headMechanism, "Not documented");
	const detail = val("headMechanismDetail");
	const mechanismLine = `Mechanism: ${[mechanism, detail].filter(Boolean).join(" — ")}.`;

	const locLine = isChecked("headLOC")
		? `LOC: Yes. Duration: ${val("headLOCDuration") || "unknown"}.`
		: "LOC: Not reported.";

	const amnesiaLines = [
		isChecked("headRetrograde")
			? `Retrograde amnesia: ${val("headRetroDuration") || "duration unknown"}.`
			: "No retrograde amnesia reported.",
		isChecked("headAnterograde") ? "Anterograde amnesia reported." : "",
	]
		.filter(Boolean)
		.join(" ");

	const vomitSuffix =
		state.headSymptoms.has("Vomiting") && val("headVomitingCount")
			? ` (${val("headVomitingCount")})`
			: "";
	const symptomsLine = `Symptoms: ${listSet(state.headSymptoms, "None reported")}${vomitSuffix}.`;

	const signsLine = `Clinical findings: ${listSet(state.headSigns, "None identified")}.${isChecked("headGcsReduced") ? " GCS <15." : ""}${isChecked("headAnticoag") ? " On anticoagulants." : ""}`;

	const criteria = getNiceCTCriteria();
	const niceLine = criteria.length
		? `NICE CG176 — CT head indicated: ${criteria.join("; ")}.`
		: "NICE CG176 — No CT criteria identified at time of assessment.";

	return [
		mechanismLine,
		locLine,
		amnesiaLines,
		symptomsLine,
		signsLine,
		niceLine,
		...(val("headInjuryNotes") ? [`Notes: ${val("headInjuryNotes")}`] : []),
	].join("\n");
}

function buildFallsText() {
	const symptoms = listSet(state.fallsSymptoms, "Not documented");
	const loc = val("fallsLocation") || "Not documented";
	const surface = val("fallsSurface");
	const activity = listSet(state.fallsActivity, "Not documented");
	const time = val("fallsTime") || "Not documented";
	const lieTime = val("fallsLieTime") || "Unknown";
	const injuries = listSet(state.fallsInjuries, "No injury documented");
	const prevCount = val("fallsPreviousCount") || "Not asked";
	const locLine = [loc, surface ? `(${surface})` : ""]
		.filter(Boolean)
		.join(" ");
	const longLie = ["1–2 hours", "2–4 hours", "4–8 hours", "> 8 hours"].includes(
		lieTime,
	);
	return [
		`S — Symptoms: ${symptoms}. ${isChecked("fallsLOC") ? "LOC reported." : "No LOC reported."} ${isChecked("fallsWitnessed") ? "Witnessed." : "Unwitnessed."}`.trim(),
		`P — Previous falls: ${prevCount}.${isChecked("fallsPreviousInjury") ? " Previous fall-related injury." : ""}`,
		`L — Location: ${locLine}.`,
		`A — Activity: ${activity}.`,
		`T — Time: ${time}. On floor: ${lieTime}.${longLie ? " Long lie." : ""}`,
		`T — Trauma: ${injuries}.${isChecked("fallsHeadStrike") ? " Head strike." : ""}${isChecked("fallsAnticoag") ? " On anticoagulants." : ""}`,
		...(val("fallsNotes") ? [`Notes: ${val("fallsNotes")}`] : []),
	].join("\n");
}

function buildOutputSections() {
	const pc = getPc();
	const site = getSelectedParts(state.siteParts) || "Not localised";
	const radiation =
		getSelectedParts(state.radiationParts) || "No radiation selected";
	const worseningText = buildWorseningText();
	return [
		{ id: "pc", title: "PRESENTING COMPLAINT", body: pc },
		{
			id: "hpc",
			title: "HISTORY OF PRESENTING COMPLAINT",
			body: (() => {
				const events = val("hpcEvents") || "Not documented";
				const caller = val("hpcCaller");
				const cat = val("hpcCategory");
				const catWord = cat === "C4" ? "generated" : "dispatched";
				const callLine =
					caller && cat
						? `${caller}, ${cat} ${catWord}.`
						: caller
							? `${caller}.`
							: cat
								? `${cat} ${catWord}.`
								: "";
				return [
					events,
					callLine,
					isChecked("noTravel") ? "No recent travel." : "",
				]
					.filter(Boolean)
					.join("\n");
			})(),
		},
		...(val("pcSelect") === "Fall"
			? [
					{
						id: "falls",
						title: "FALLS ASSESSMENT — SPLATT",
						body: buildFallsText(),
					},
				]
			: []),
		...(val("pcSelect") === "Head injury"
			? [
					{
						id: "headinjury",
						title: "HEAD INJURY ASSESSMENT — NICE CG176",
						body: buildHeadInjuryText(),
					},
				]
			: []),
		...(val("pcSelect") === "Seizure"
			? [{ id: "seizure", title: "SEIZURE ASSESSMENT", body: buildSeizureText() }]
			: []),
		...(MH_PCS.includes(val("pcSelect"))
			? [
					{
						id: "mhassessment",
						title: "MENTAL HEALTH ASSESSMENT",
						body: buildMhAssessmentText(),
					},
				]
			: []),
		{
			id: "background",
			title: "BACKGROUND",
			body: `Allergies: ${isChecked("nkda") ? "NKDA" : val("allergies") || "Not documented"}\nMedications: ${isChecked("noMeds") ? "No regular medications" : val("medications") || "Not documented"}\nPMH: ${isChecked("noPmh") ? "No significant past medical history" : val("pmh") || "Not documented"}\nLast oral intake: ${[val("loiWhat"), val("loiTime")].filter(Boolean).join(" at ") || "Not documented"}\nPrevious episodes: ${val("prevDetails") || "Not documented"}`,
		},
		{
			id: "primary",
			title: "PRIMARY SURVEY",
			body:
				`OA: ${val("oaFound")}${val("oaLocation") ? ` at ${val("oaLocation")}` : ""}; ${val("oaMobility").toLowerCase()}. ${val("oaFound") !== "Greeted by patient" && val("oaPatientFoundHow") ? `On reaching patient: ${val("oaPatientFoundHow")}. ` : ""}${isChecked("oaConsent") ? "Consented to assessment. " : ""}${isChecked("oaNoABC") ? "No immediate ABC concerns. " : ""}${isChecked("oaNormalPresentation") ? "Normal presentation on arrival. " : ""}${val("oaNotes")}`.trimEnd() +
				`\n${ABCDE.map(abcLine).join("\n")}`,
		},
		{
			id: "pain",
			title: isChecked("noPain")
				? "SOCRATES / SYMPTOM ASSESSMENT"
				: "PAIN ASSESSMENT / SOCRATES",
			body: isChecked("noPain")
				? [
						`Onset: ${val("onsetType") || "Not documented"}${val("onsetTime") ? `, ${val("onsetTime")}` : ""}${val("onsetDuration") ? `, duration ${val("onsetDuration")}` : ""}`,
						`Associated symptoms: ${listSet(state.associated, "None reported")}`,
						`Timing: ${val("timingSelect") || "Not documented"}`,
						`Exacerbating factors: ${listFactors(state.exacerbating, "exacerbatingOther", "None identified")}`,
						`Relieving factors: ${listFactors(state.relieving, "relievingOther", "None identified")}`,
						`Severity: ${val("severity") || "Not documented"}`,
					].join("\n")
				: [
						`Site: ${site}`,
						`Onset: ${val("onsetType") || "Not documented"}${val("onsetTime") ? `, ${val("onsetTime")}` : ""}${val("onsetDuration") ? `, duration ${val("onsetDuration")}` : ""}`,
						`Character: ${listSet(state.character, "Not characterised")}`,
						`Radiation: ${radiation}`,
						`Associated symptoms: ${listSet(state.associated, "None reported")}`,
						`Timing: ${val("timingSelect") || "Not documented"}`,
						`Exacerbating factors: ${listFactors(state.exacerbating, "exacerbatingOther", "None identified")}`,
						`Relieving factors: ${listFactors(state.relieving, "relievingOther", "None identified")}`,
						`Severity: ${val("severity") || "Not documented"}`,
					].join("\n"),
		},
		...(state.injuryEntries.length
			? [
					{
						id: "injuries",
						title: "INJURY ASSESSMENT",
						body: buildInjuryText(),
					},
				]
			: []),
		{
			id: "ros-resp",
			title: "ASSESSMENT — RESPIRATORY",
			body: rosBlock("resp"),
		},
		{
			id: "ros-cvs",
			title: "ASSESSMENT — CARDIOVASCULAR",
			body: rosBlock("cvs"),
		},
		{
			id: "ros-neuro",
			title: "ASSESSMENT — NEUROLOGICAL",
			body: rosBlock("neuro"),
		},
		{
			id: "ros-gi",
			title: "ASSESSMENT — GASTROINTESTINAL",
			body: rosBlock("gi"),
		},
		{ id: "ros-urine", title: "ASSESSMENT — URINARY", body: rosBlock("urine") },
		{
			id: "ros-integ",
			title: "ASSESSMENT — INTEGUMENTARY",
			body: rosBlock("integ"),
		},
		{
			id: "ros-msk",
			title: "ASSESSMENT — MUSCULOSKELETAL",
			body: rosBlock("msk"),
		},
		{
			id: "ros-psych",
			title: "ASSESSMENT — MENTAL HEALTH (MSE)",
			body: rosBlock("psych"),
		},
		...(val("oeText")
			? [
					{
						id: "oe",
						title: "ASSESSMENT — ON EXAMINATION",
						body: val("oeText"),
					},
				]
			: []),
		...(() => {
			const hasTx =
				state.airwayInterventions.size ||
				state.ivEntries.length ||
				state.drugEntries.length ||
				state.woundInterventions.size ||
				state.manualHandling.size ||
				state.otherInterventions.size ||
				val("treatmentNotes");
			return hasTx
				? [
						{
							id: "treatment",
							title: "TREATMENT AND INTERVENTIONS",
							body: buildTreatmentText(),
						},
					]
				: [];
		})(),
		...(() => {
			const hasChanges =
				state.clinicalChanges.length || val("additionalInfo");
			return hasChanges
				? [
						{
							id: "changes",
							title: "CLINICAL CHANGES & ADDITIONAL INFORMATION",
							body: buildChangesText(),
						},
					]
				: [];
		})(),
		{
			id: "capacity",
			title: "ASSESSMENT — MENTAL CAPACITY / CONSENT",
			body: buildCapacityText(),
		},
		{ id: "worsening", title: "PLAN — WORSENING ADVICE", body: worseningText },
		{
			id: "conveyance",
			title: "PLAN — CONVEYANCE DECISION",
			body: buildConveyanceText(),
		},
		{
			id: "handover",
			title: `HANDOVER — ${val("handoverFormat") || "ASHICE"}`,
			body: buildHandoverText(),
		},
	];
}

function renderOutputSections(sections) {
	const root = $("#outputSections");
	if (!root) return;
	root.innerHTML = "";
	sections.forEach((section) => {
		const card = document.createElement("article");
		card.className = "output-card";
		card.innerHTML = `<div class="output-card-head"><h3>${section.title}</h3><button type="button" class="secondary-action" data-copy-section="${section.id}">Copy</button></div>`;
		const pre = document.createElement("pre");
		pre.className = "output-snippet";
		pre.textContent = section.body;
		pre.dataset.plaintext = pre.textContent;
		card.append(pre);
		root.append(card);
	});
}

function generateOutput() {
	syncAuscultationOutput();
	const sections = buildOutputSections();
	renderOutputSections(sections);
	const fullText = sections
		.map((section) => section.body)
		.join("\n\n" + "─".repeat(46) + "\n\n");
	const legacy = $("#outputText");
	if (legacy) legacy.textContent = fullText;
	return fullText;
}

function listSet(set, fallback) {
	return set.size ? [...set].join(", ") : fallback;
}

function applyWorseningDefault() {
	if (!state.worseningAuto) return;
	const decision = val("conveyanceDecision");
	const select = $("#worseningMode");
	select.value = decision === "Conveyed" ? "Not applicable" : "Standard";
	updateWorseningScript();
}

function buildPatientScript(declined) {
	const pc = getPc();
	const pcData = WORSENING_PC[pc];
	const genericLines = WORSENING_GENERIC.map((i) => `• ${i}`).join("\n");
	const specificLines = pcData?.items.map((i) => `• ${i}`).join("\n") || "";
	const redFlags = pcData?.redFlags
		? `\nImportant — call 999 immediately for:\n${pcData.redFlags}`
		: "";
	const extra = pcData?.extra ? `\n${pcData.extra}` : "";
	const declinedLine = declined
		? "\nYou have declined conveyance to hospital today. You have the right to refuse treatment and transport, but please do not hesitate to call 999 again if you change your mind or feel worse at any time."
		: "";
	return `"Before I leave, I want to go through some important warning signs with you.

Please call 999 immediately if you notice:
${genericLines}

${specificLines ? `Specific to your condition today (${pc}), also call 999 for:\n${specificLines}\n` : ""}${redFlags}${extra}${declinedLine}

For anything less urgent, please contact your GP or call 111. If you are ever unsure whether something is an emergency, always call 999 — it is better to call and check."`;
}

function updateWorseningScript() {
	const mode = val("worseningMode");
	const wrap = $("#worseningScriptWrap");
	const display = $("#worseningScriptDisplay");
	if (!wrap || !display) return;
	const hidden = mode === "Not applicable";
	wrap.classList.toggle("hidden", hidden);
	if (!hidden && mode !== "Custom") {
		const declined = val("conveyanceDecision") === "Declined conveyance";
		display.textContent = buildPatientScript(declined);
	}
}

function buildWorseningText() {
	const mode = val("worseningMode");
	const decision = val("conveyanceDecision");
	const pc = getPc();
	const pcData = WORSENING_PC[pc];
	const custom = val("customWorsening");

	if (mode === "Not applicable" || decision === "Conveyed")
		return "Patient conveyed to hospital; community worsening advice not applicable.";

	const declined = decision === "Declined conveyance";
	const allItems = [...WORSENING_GENERIC, ...(pcData?.items || [])];
	const adviceLine = `Worsening advice given${declined ? " (declined conveyance)" : ""}. Patient${declined ? " and any bystanders" : ""} advised to call 999 for: ${allItems.join("; ")}.`;
	const redFlagLine = pcData?.redFlags ? ` ${pcData.redFlags}` : "";
	const extraLine = pcData?.extra ? ` ${pcData.extra}` : "";
	const customLine = custom ? ` Additional advice: ${custom}` : "";
	const confirmedLine = " Advice confirmed understood.";

	if (mode === "Custom") return custom || "Custom worsening advice given.";

	return `${adviceLine}${redFlagLine}${extraLine}${customLine}${confirmedLine}`;
}

function buildCapacityText() {
	const status = val("capacityStatus");
	if (status === "Not applicable") return "Not applicable.";
	if (status === "Lacks capacity")
		return `Patient assessed as lacking capacity for the relevant decision at this time. Best interests decision documented. ${val("bestInterests")}`.trim();
	const tests = [
		isChecked("mcaUnderstand") && "understand",
		isChecked("mcaRetain") && "retain",
		isChecked("mcaWeigh") && "weigh/use",
		isChecked("mcaCommunicate") && "communicate",
	].filter(Boolean);
	return `Patient assessed as having capacity for the relevant decision. MCA elements documented: able to ${tests.join(", ")} information.`;
}

function handleConveyanceDisplay() {
	const conveyed = val("conveyanceDecision") === "Conveyed";
	$("#conveyedFields")?.classList.toggle("hidden", !conveyed);
	$("#nonConveyedFields")?.classList.toggle("hidden", conveyed);
	$("#worseningSection")?.classList.toggle("hidden", conveyed);
	updateWorseningScript();
	if (!conveyed) return;
	$("#hospitalOtherWrap")?.classList.toggle(
		"hidden",
		val("conveyHospital") !== "Other hospital",
	);
	const dept = val("conveyDepartment");
	$("#wardDetailsWrap")?.classList.toggle("hidden", dept !== "Ward");
	$("#departmentOtherWrap")?.classList.toggle(
		"hidden",
		dept !== "Other department",
	);
	const changeChip = $('.convey-chip[data-clinical-change="true"]');
	$("#conveyChangeWrap")?.classList.toggle(
		"hidden",
		changeChip?.dataset.conveyState !== "abnormal",
	);
	const escalatedChip = $('.convey-chip[data-escalated="true"]');
	$("#conveyEscalatedWrap")?.classList.toggle(
		"hidden",
		escalatedChip?.dataset.conveyState !== "abnormal",
	);
}

function buildConveyDestination() {
	const hospital =
		val("conveyHospital") === "Other hospital"
			? val("conveyHospitalOther")
			: val("conveyHospital");
	let department = val("conveyDepartment");
	if (department === "Ward") {
		const ward = val("conveyWard");
		department = ward ? `Ward — ${ward}` : "Ward";
	} else if (department === "Other department") {
		department = val("conveyDepartmentOther") || "Other department";
	}
	return [hospital, department].filter(Boolean).join("; ");
}

function buildConveyanceText() {
	const decision = val("conveyanceDecision");
	const notes = val("conveyanceNotes");
	if (decision === "Conveyed") {
		const destination = buildConveyDestination();
		const transferText = getConveyTransferText();
		const changeDetail = val("conveyChangeDetail");
		const escalatedDetail = val("conveyEscalatedDetail");
		const extraDetail = [
			changeDetail ? `Clinical change detail: ${changeDetail}` : null,
			escalatedDetail ? `Escalation of care detail: ${escalatedDetail}` : null,
		]
			.filter(Boolean)
			.join(" ");
		const lines = [
			"Conveyance decision: Patient conveyed to hospital for further assessment and/or treatment.",
			destination
				? `Destination: ${destination}.`
				: "Destination: Not specified.",
			transferText
				? `Transfer and handover: ${transferText}.${extraDetail ? ` ${extraDetail}` : ""}`
				: null,
			val("conveyTransferNotes")
				? `Transfer / handover notes: ${val("conveyTransferNotes")}`
				: null,
			notes ? `Additional notes: ${notes}` : null,
		].filter(Boolean);
		return lines.join("\n");
	}
	const checks = [
		isChecked("riskExplained") && "risks explained",
		isChecked("alternativesDiscussed") && "alternatives discussed",
		isChecked("understandsRisk") && "patient understands risks",
		isChecked("canRecontact") && "advised they can recontact 999/111",
	]
		.filter(Boolean)
		.join("; ");
	return `${decision}. Referred/signposted to: ${listSet(state.referrals, "not documented")}. ${val("followUp") ? val("followUp") + ". " : ""}${checks ? `Safety netting: ${checks}.` : ""}${notes ? " " + notes : ""}`.trim();
}

function clearBodyMap() {
	state.siteParts.clear();
	state.radiationParts.clear();
	$$(".body-part").forEach((part) =>
		part.classList.remove("site", "radiation"),
	);
	updateMapTags();
}

function clearPainAssessment() {
	state.siteParts.clear();
	state.radiationParts.clear();
	state.character.clear();
	state.associated.clear();
	state.exacerbating.clear();
	state.relieving.clear();
	$$("#painDetails .multi-group .square-btn").forEach((button) =>
		button.classList.remove("selected"),
	);
	$$(".body-part").forEach((part) =>
		part.classList.remove("site", "radiation"),
	);
	[
		"onsetType",
		"onsetDuration",
		"timingSelect",
		"severity",
		"exacerbatingOther",
		"relievingOther",
	].forEach((id) => {
		const field = $(`#${id}`);
		if (field) field.value = "";
	});
	setOtherFactorVisible("exacerbating", false);
	setOtherFactorVisible("relieving", false);
	updateMapTags();
}

function selectAuscSound(button) {
	const sound = button.dataset.sound;
	if (sound === "normal") {
		state.respAusc = { normal: true, entries: [] };
		pendingAuscSound = null;
		$$(".ausc-sound").forEach((item) =>
			item.classList.toggle("selected", item.dataset.sound === "normal"),
		);
		$("#auscLocationPanel")?.classList.add("hidden");
		$("#auscOtherWrap")?.classList.add("hidden");
		renderAuscEntries();
		syncAuscultationOutput();
		return;
	}
	pendingAuscSound = sound;
	state.respAusc.normal = false;
	$$(".ausc-sound").forEach((item) =>
		item.classList.toggle("selected", item === button),
	);
	$("#auscLocationPanel")?.classList.remove("hidden");
	$$(".ausc-loc").forEach((item) => item.classList.remove("selected"));
	const otherWrap = $("#auscOtherWrap");
	if (otherWrap) {
		otherWrap.classList.toggle("hidden", sound !== "other");
		if (sound === "other") {
			$("#auscOtherText").value = "";
			setTimeout(() => $("#auscOtherText")?.focus(), 50);
		}
	}
}

function toggleAuscLocation(button) {
	if (!pendingAuscSound) return;
	const loc = button.dataset.location;
	if (loc === "bilateral") {
		const alreadySelected = button.classList.contains("selected");
		$$(".ausc-loc").forEach((item) => item.classList.remove("selected"));
		if (!alreadySelected) button.classList.add("selected");
	} else {
		$(".ausc-loc[data-location='bilateral']")?.classList.remove("selected");
		button.classList.toggle("selected");
	}
}

function commitAuscLocations() {
	if (!pendingAuscSound) return;
	const selectedLocs = $$(".ausc-loc.selected");
	if (!selectedLocs.length) return;
	const otherText =
		pendingAuscSound === "other"
			? ($("#auscOtherText")?.value || "").trim() || "other"
			: null;
	selectedLocs.forEach((locBtn) => {
		const entry = {
			sound: pendingAuscSound,
			location: locBtn.dataset.location,
		};
		if (otherText) entry.text = otherText;
		state.respAusc.entries.push(entry);
	});
	pendingAuscSound = null;
	$$(".ausc-sound").forEach((item) => item.classList.remove("selected"));
	$$(".ausc-loc").forEach((item) => item.classList.remove("selected"));
	$("#auscLocationPanel")?.classList.add("hidden");
	$("#auscOtherWrap")?.classList.add("hidden");
	renderAuscEntries();
	syncAuscultationOutput();
}

function removeAuscEntry(index) {
	state.respAusc.entries.splice(index, 1);
	if (!state.respAusc.entries.length) state.respAusc.normal = true;
	renderAuscEntries();
	syncAuscultationOutput();
}

function renderAuscEntries() {
	const root = $("#auscEntries");
	if (!root) return;
	root.innerHTML = "";
	state.respAusc.entries.forEach((entry, index) => {
		const row = document.createElement("div");
		row.className = "ausc-entry";
		row.innerHTML = `<span>${formatAuscEntry(entry)}</span><button type="button" data-remove-ausc="${index}" aria-label="Remove finding">×</button>`;
		root.append(row);
	});
}

function formatAuscSound(sound) {
	return (
		{
			wheeze: "wheeze",
			crackles: "crackles",
			reduced: "reduced air entry",
			bronchial: "bronchial breathing",
			other: "other:",
		}[sound] || sound
	);
}

function formatAuscEntry(entry) {
	const sound =
		entry.sound === "other"
			? entry.text || "other"
			: formatAuscSound(entry.sound);
	if (entry.location === "bilateral") return `Bilateral ${sound}`;
	const side = entry.location.startsWith("L") ? "L" : "R";
	const zone = entry.location.split("-")[1];
	return `${side}-sided ${zone} ${sound}`;
}

function buildAuscText() {
	if (!state.respAusc.entries.length)
		return "Equal and clear bilateral air entry";
	const groups = new Map();
	state.respAusc.entries.forEach((entry) => {
		const key =
			entry.sound === "other"
				? entry.text || "other"
				: formatAuscSound(entry.sound);
		if (!groups.has(key)) groups.set(key, []);
		groups.get(key).push(entry.location);
	});
	return [...groups.entries()]
		.map(([sound, locs]) => {
			const locLabels = locs.map((loc) => {
				if (loc === "bilateral") return "bilateral";
				const side = loc.startsWith("L") ? "L" : "R";
				const zone = loc.split("-")[1];
				return `${side}-sided ${zone}`;
			});
			if (locLabels.length === 1 && locLabels[0] === "bilateral")
				return `Bilateral ${sound}`;
			return `${sound.charAt(0).toUpperCase() + sound.slice(1)}: ${locLabels.join(", ")}`;
		})
		.join("; ");
}

function syncAuscultationOutput() {
	const text = buildAuscText();
	const hidden = $("#respAus");
	if (hidden) hidden.value = text;
	const preview = $("#auscPreview");
	if (preview) preview.textContent = text;
}

async function copyText(text) {
	try {
		await navigator.clipboard.writeText(text);
	} catch {
		const textArea = document.createElement("textarea");
		textArea.value = text;
		document.body.append(textArea);
		textArea.select();
		document.execCommand("copy");
		textArea.remove();
	}
	$("#toast").classList.add("show");
	setTimeout(() => $("#toast").classList.remove("show"), 1800);
}

async function copyOutput() {
	await copyText(generateOutput());
}

async function copySectionById(sectionId) {
	generateOutput();
	const card = $(`[data-copy-section="${sectionId}"]`)?.closest(".output-card");
	const body = card?.querySelector(".output-snippet");
	const text = body?.dataset.plaintext || body?.innerText?.trim();
	if (text) await copyText(text);
}

function enhanceSectionCards() {
	const descriptions = {
		"Presenting Complaint": [
			"pc",
			"Record the patient’s main reason for assessment.",
		],
		"History of Presenting Complaint": [
			"hpc",
			"Events, symptoms and relevant history.",
		],
		"Pain Assessment": [
			"pain",
			"SOCRATES assessment and pain characteristics.",
		],
		Background: ["hx", "Allergies, medications, PMH and relevant background."],
		"On Arrival": ["default", "First contact, location, consent and mobility."],
		"Review of Systems": ["default", "System-by-system clinical review."],
		"Secondary Survey / On Examination": [
			"default",
			"Generate or document examination findings.",
		],
		"Mental Capacity and Consent": [
			"default",
			"Capacity, consent and best interests notes.",
		],
		"Worsening Advice": ["default", "Safety-netting and advice given."],
		Conveyance: ["default", "Destination, transfer and handover details."],
		"Generated PRF": ["default", "Copy sections into your ePCR."],
	};

	document.querySelectorAll(".section-card > summary").forEach((summary) => {
		if (summary.dataset.enhanced === "true") return;

		const title = summary.querySelector("span")?.textContent?.trim();
		const [icon, desc] = descriptions[title] || [
			"default",
			"Complete this section as required.",
		];

		summary.parentElement.dataset.sectionIcon = icon;

		const titleSpan = summary.querySelector("span");
		if (titleSpan && !titleSpan.querySelector(".section-desc")) {
			titleSpan.innerHTML = `${title}<small class="section-desc">${desc}</small>`;
		}

		summary.dataset.enhanced = "true";
	});
}
