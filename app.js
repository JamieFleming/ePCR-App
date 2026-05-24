// import {
// 	renderRedFlags,
// 	scheduleRedFlags,
// 	bindRedFlagToggle,
// } from "./redFlags.js";

("use strict");

// UTILITY HELPERS
// Shorthand DOM selectors and commonly-used field readers.

// Selects the first matching element within an optional root (defaults to document).
const $ = (selector, root = document) => root.querySelector(selector);

// Selects all matching elements, returned as a real Array, within an optional root.
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

// Returns the trimmed value of an input/select/textarea by ID, or "" if absent.
const val = (id) => ($(`#${id}`)?.value || "").trim();

// Returns true if the checkbox or radio with the given ID is checked.
const isChecked = (id) => Boolean($(`#${id}`)?.checked);

// Returns the resolved onset time — uses the free-type value when "Other" is chosen.
const onsetTime = () =>
	val("onsetTime") === "Other" ? val("onsetTimeOther") : val("onsetTime");

// Returns a formatted clock-time suffix string, e.g. " (at 14:30)", or "".
const onsetClockSuffix = () => {
	const t = val("onsetClockTime");
	return t ? ` (at ${t})` : "";
};

// APPLICATION STATE
// Mutable state shared across all adult ePRF sections. Sets hold multi-select
// chip values; arrays hold structured entry records (drugs, IV, injuries, etc.).

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
	fallsLocation: new Set(),
	headMechanism: new Set(),
	headSymptoms: new Set(),
	headSigns: new Set(),
	injuryEntries: [],
	abdoFindings: {},
	abdoActive: null,
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
	mseAppearance: new Set(),
	mseBehaviour: new Set(),
	mseSpeech: new Set(),
	mseThoughtContent: new Set(),
	mseAffect: new Set(),
	mseThoughtForm: new Set(),
	msePerception: new Set(),
	mseInsight: new Set(),
	safeguardingConcerns: new Set(),
	airwayInterventions: new Set(),
	woundInterventions: new Set(),
	manualHandling: new Set(),
	clinicalChanges: [],
	ecgFindings: new Set(),
	ecgLeads: new Set(),
	ros: {},
	auscFindings: {},
	auscActive: null,
	worseningAuto: true,
	pReferrals: new Set(),
};

// When one disability chip is set abnormal, linked chips flip too
const ABC_DISABILITY_LINKS = [["GCS 15", "AOx4"]];

// Conveyance options - What happened en route, information en route
const CONVEY_TRANSFER = [
	["Consent to conveyance obtained", "Consent not obtained"],
	["Continuous monitoring and reassessment", "Monitoring not maintained"],
	["Remained stable throughout", "Unstable / deteriorated during transfer"],
	[
		"Communicated appropriately throughout",
		"Communication concerns during transfer",
	],
	["Handover completed with receiving team", "Handover incomplete / delayed"],
	["Pre-alert not given", "Pre-alert given"],
	["No escalation en route", "Care escalated en route"],
	["No clinical change", "Clinical change during conveyance"],
];

// CLINICAL CONTENT — WORSENING ADVICE
// Generic 999 triggers shown to all patients, plus presenting-complaint-specific
// items appended based on the selected PC.

const WORSENING_GENERIC = [
	"chest pain",
	"sudden difficulty breathing or SOB",
	"FAST symptoms — face drooping, arm weakness, or speech difficulty",
	"LOC or collapse",
	"seizures",
	"heavy uncontrolled bleeding",
];

const WORSENING_PC = {
	"Chest pain": {
		items: [
			"return or worsening of chest pain",
			"pain spreading to jaw, arm, or neck",
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
			"sudden severe 'thunderclap' headache",
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
			"further seizures",
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
			"worsening dizziness or inability to mobilise",
			"FAST symptoms — face, arm, or speech changes",
			"persistent vomiting or inability to keep fluids down",
		],
	},
	"Collapse / syncope": {
		items: [
			"further episodes of collapse or near-collapse",
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
			"confusion",
			"blood in urine with back pain",
		],
	},
	"Allergic reaction": {
		items: [
			"return of rash, hives, or swelling",
			"swelling of lips, tongue, or throat",
			"wheeze or difficulty breathing",
			"dizziness or collapse",
			"if EpiPen used — call 999 immediately regardless",
		],
	},
	"Diabetic emergency": {
		items: [
			"recurrence of hypo symptoms — shakiness, sweating, confusion",
			"blood glucose not responding to treatment",
			"vomiting preventing oral intake",
			"confusion, drowsiness, or unresponsiveness",
		],
	},
	Fall: {
		items: [
			"any furthe falls",
			"inability to bear weight or mobilise",
			"new or worsening weakness or numbness in the legs",
			"loss of bladder or bowel control",
			"numbness or tingling in the saddle area (inner thighs, groin, or back passage)",
			"severe worsening pain",
		],
		redFlags:
			"Cauda equina red flags: loss of bladder or bowel control, saddle numbness (numbness of inner thighs, genitals, or back passage), bilateral leg weakness or numbness",
	},
	"Back pain": {
		items: [
			"worsening pain not responding to prescribed analgesia",
			"loss of bladder or bowel control",
			"numbness or tingling in the saddle area (inner thighs, groin, or back passage)",
			"new or worsening weakness or numbness in both legs",
			"inability to stand or walk",
		],
		redFlags:
			"Cauda equina red flags explained: loss of bladder or bowel control, saddle anaesthesia (numbness of inner thighs, genitals, or back passage), bilateral leg weakness or numbness.",
	},
	"Trauma / injury": {
		items: [
			"increasing pain, swelling, or bruising at the injury site",
			"loss of sensation or movement below the injury",
			"severe increasing pain with tightness in a limb",
			"signs of infection — redness, warmth, discharge, or fever",
		],
	},
	"Limb pain / swelling": {
		items: [
			"worsening swelling, redness, or warmth in the limb",
			"new numbness, weakness, or colour change",
			"severe pain with tightness",
			"calf swelling or redness with breathlessness",
		],
	},
	"Wound / laceration": {
		items: [
			"wound re-opening or bleeding and not controlled with direct pressure",
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
			"non-blanching rash with fever",
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
			"any further thoughts to self-harm",
			"any immediate risk to life — call 999",
		],
		extra:
			"Samaritans helpline: 116 123 (free, 24/7). Shout 85258. NHS 111 Option 1. Local crisis line signposted if available.",
	},
	"Confusion / delirium": {
		items: [
			"worsening confusion or agitation",
			"fever, rigors, or new physical symptoms",
			"inability to keep safe at home",
		],
	},
};

// CLINICAL CONTENT — UI OPTION LISTS
// Arrays and objects used to populate chip grids and select menus throughout
// the adult ePRF.  Keyed to match data-state attributes in the HTML.

const OPTIONS = {
	character: [
		"Sharp",
		"Dull",
		"Aching",
		"Burning",
		"Crushing",
		"Pressure",
		"Stabbing",
		"Throbbing",
		"Colicky",
		"Tearing",
		"Cramping",
		"Tight / Squeezing",
		"Other",
	],
	associated: [
		"Nausea",
		"Vomiting",
		"Sweating",
		"Dizziness",
		"Shortness of breath",
		"Palpitations",
		"Confusion",
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
		"Photophobia",
		"Other",
	],
	exacerbating: [
		"Movement",
		"Inspiration",
		"Expiration",
		"Palpation",
		"After eating",
		"Exertion",
		"Lying flat",
		"Standing",
		"Coughing",
		"Swallowing",
		"Heat",
		"Cold",
		"Stress",
		"None",
		"Other",
	],
	relieving: [
		"Rest",
		"Analgesia",
		"Sitting forward",
		"Sitting up",
		"Lying down",
		"Movement",
		"Antacids",
		"Ice",
		"Heat",
		"Eating",
		"Vomiting",
		"Opening bowels",
		"Passing wind",
		"GTN",
		"None",
		"Other",
	],
	referrals: [
		"Self-care",
		"Own GP",
		"OOH GP",
		"Urgent treatment centre",
		"Make own way to ED",
		"Pharmacy",
		"District Nurses",
		"Falls team",
		"Mental health crisis team",
		"Safeguarding referral",
	],
	pReferrals: [
		"GP",
		"Urgent treatment centre",
		"Health visitor",
		"District Nurses",
		"Self-care",
		"CAMHS",
		"Safeguarding referral",
		"Pharmacy",
	],
	fallsSymptoms: [
		"Dizziness",
		"Pre-syncope",
		"Syncope",
		"Palpitations",
		"Chest pain",
		"Shortness of breath",
		"Sudden weakness",
		"Leg gave way",
		"Lost balance",
		"Blurred vision",
		"Tripped",
		"Slipped",
		"Mechanical",
		"Intoxicated",
		"Unknown",
		"Other",
	],
	fallsLocation: [
		"Bedroom",
		"Bathroom",
		"Kitchen",
		"Living Room",
		"Hallway",
		"Stairs",
		"Outside",
		"Care Home",
		"Public Place",
		"Other",
	],
	fallsActivity: [
		"Walking",
		"Turning",
		"Getting up from chair",
		"Getting up from bed",
		"Going to toilet",
		"On stairs",
		"Reaching / bending",
		"Exertion",
		"Standing still",
		"Unknown",
		"Other",
	],
	headMechanism: [
		"RTC — pedestrian",
		"RTC — cyclist",
		"RTC — vehicle occupant",
		"Fall from height",
		"Fall >1m",
		"Fall <1m",
		"Fall on stairs",
		"Fall from standing",
		"Seizure-related fall",
		"Assault",
		"Sports injury",
		"Object struck head",
		"Head struck object",
		"Struck by moving object",
		"Unknown/unwitnessed",
		"Other",
	],
	headSymptoms: [
		"Headache",
		"Nausea",
		"Vomiting",
		"Dizziness",
		"Visual disturbance",
		"Photophobia",
		"Confusion",
		"Behaviour change",
		"Limb weakness / numbness",
		"Unsteadiness",
		"Drowsiness",
		"Neck pain",
		"Slurred speech",
		"Seizure",
	],
	headSigns: [
		"Scalp laceration",
		"Scalp haematoma",
		"Periorbital bruising (panda eyes)",
		"Battle's sign",
		"Boggy mass",
		"CSF rhinorrhoea",
		"CSF otorrhoea",
		"Suspected open fracture",
		"Suspected depressed fracture",
		"Focal neurological deficit",
	],
	fallsInjuries: [
		"Head",
		"Face",
		"Neck",
		"Spine",
		"Upper back",
		"Lower back",
		"Shoulder",
		"Arm",
		"Wrist",
		"Hand",
		"Elbow",
		"Chest / ribs",
		"Hip",
		"Pelvis",
		"Knee",
		"Lower leg",
		"Ankle",
		"Foot",
		"No apparent injury found",
	],
	abdoRegions: [
		"R Hypochondriac",
		"Epigastrium",
		"L Hypochondriac",
		"R Lumbar",
		"Umbilical",
		"L Lumbar",
		"R Iliac Fossa",
		"Hypogastric/Suprapubic",
		"L Iliac Fossa",
	],
};

const ABDO_FINDINGS = [
	"Tenderness",
	"Rebound Tenderness",
	"Voluntary Guarding",
	"Involuntary Guarding/Rigidity",
	"Mass / Lump",
	"Pulsating Mass",
	"Rovsing's Sign",
];

const ABDO_FINDING_SHORT = {
	Tenderness: "T",
	Rebound: "Rb",
	Guarding: "Vg",
	Rigidity: "Ri",
	"Mass / lump": "M",
	Rovsings: "Rv",
};

// Presenting complaint options
const PC_OPTIONS = [
	{
		group: "Cardiovascular",
		items: [
			"Chest pain",
			"Palpitations",
			"Collapse / syncope",
			"Hypertension",
			"Hypotension",
			"Cardiac arrest",
		],
	},
	{
		group: "Respiratory",
		items: [
			"Shortness of breath",
			"Exacerbation of Asthma / COPD",
			"Chest infection symptoms",
			"Cough",
			"Haemoptysis",
			"Respiratory arrest",
			"Choking / airway problem",
		],
	},
	{
		group: "Neurological",
		items: [
			"Confusion",
			"Headache",
			"Dizziness",
			"Stroke",
			"New weakness",
			"Numbness / tingling",
			"Speech abnormality",
			"Visual disturbance",
			"Collapse",
			"Reduced consciousness",
			"Seizure",
		],
	},
	{
		group: "Gastrointestinal / Urinary",
		items: [
			"Abdominal pain",
			"Nausea / vomiting",
			"Diarrhoea",
			"Constipation",
			"Haematemesis / melaena",
			"Urinary symptoms",
			"Urinary retention",
			"Catheter problem",
		],
	},
	{
		group: "Obstetric / Gynaecological",
		items: ["PV bleed", "Pregnancy related", "Labour"],
	},
	{
		group: "Trauma / Musculoskeletal",
		items: [
			"Fall",
			"Reduced mobility/Off legs",
			"Trauma / injury",
			"Back pain",
			"Neck pain",
			"Hip pain",
			"Limb pain / swelling",
			"Wound / laceration",
			"Burns / scalds",
			"Head injury",
		],
	},
	{
		group: "Medical / Other",
		items: [
			"General weakness",
			"Allergic reaction",
			"Diabetic emergency",
			"Fever / pyrexia",
			"Sepsis concern",
			"Overdose / poisoning",
			"Mental health crisis",
			"Self-harm",
			"Social concern / welfare check",
			"Palliative/end-of-life care",
			"Alcohol intoxication",
			"Substance misuse",
			"Other",
		],
	},
];

// Caller options
const CALLER_OPTIONS = [
	{
		group: "Emergency",
		items: [
			"Patient called 999",
			"Passerby called 999",
			"Carer called 999",
			"Relative called 999",
			"Patient called 111",
			"Carer called 111",
			"Relative called 111",
		],
	},
	{
		group: "Clinical referral",
		items: [
			"GP referral",
			"HCP referral",
			"District nurse referral",
			"Crisis team referral",
		],
	},
	{
		group: "Other",
		items: [
			"Police request",
			"Fire request",
			"Other service referral",
			"Other",
		],
	},
];

// Onset time options — entries are [value, label]; omit value to use label as both.
const ONSET_TIME_OPTIONS = [
	["Just now", "Just now"],
	["5 minutes ago", "5 minutes ago"],
	["10 minutes ago", "10 minutes ago"],
	["15 minutes ago", "15 minutes ago"],
	["20 minutes ago", "20 minutes ago"],
	["30 minutes ago", "30 minutes ago"],
	["45 minutes ago", "45 minutes ago"],
	["1 hour ago", "1 hour ago"],
	["90 minutes ago", "90 minutes ago"],
	["2 hours ago", "2 hours ago"],
	["3 hours ago", "3 hours ago"],
	["4 hours ago", "4 hours ago"],
	["6 hours ago", "6 hours ago"],
	["12 hours ago", "12 hours ago"],
	["24 hours ago", "24 hours ago"],
	["Earlier today", "Earlier today"],
	["Yesterday", "Yesterday"],
	["Other", "Other (specify)"],
];

function populateFlatSelect(selectId, options) {
	const select = $(`#${selectId}`);
	if (!select) return;
	options.forEach(([value, label]) => {
		const opt = document.createElement("option");
		opt.value = value;
		opt.textContent = label;
		select.appendChild(opt);
	});
}

function populateOnsetTimeSelect() {
	populateFlatSelect("onsetTime", ONSET_TIME_OPTIONS);
}

// On arrival options
const OA_FOUND_OPTIONS = [
	{
		group: "Greeted by",
		items: [
			"Greeted by patient",
			"Greeted by relative",
			"Greeted by carer",
			"Greeted by neighbour",
			"Greeted by care home staff",
			"Greeted by passer-by / bystander",
			"Greeted by police",
			"Greeted by fire service",
			"Greeted by other healthcare professional",
			"Greeted by other",
		],
	},
	{
		group: "Found on arrival",
		items: [
			"Found sitting",
			"Found standing",
			"Found in lying",
			"Found on floor",
			"Found unconscious",
			"No patient found",
		],
	},
	{
		group: "Other",
		items: ["Handover from another crew", "Other"],
	},
];

// Populates a radio-chip-group container with buttons from a [value, label] array.
// If an item is a plain string, value and label are both that string.
function populateChipGroup(radioGroup, items) {
	const group = $(`[data-radio-group='${radioGroup}']`);
	if (!group) return;
	items.forEach((item) => {
		const [value, label] = Array.isArray(item) ? item : [item, item];
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "radio-chip";
		btn.dataset.value = value;
		btn.textContent = label;
		group.appendChild(btn);
	});
}

const ONSET_TYPE_OPTIONS = ["Sudden", "Gradual", "Insidious"];
const TIMING_OPTIONS = [
	"Constant",
	"Intermittent",
	"Episodic",
	"Recurrent",
	["Waxing and waning", "Waxing & waning"],
	"Colicky",
	"Progressively worsening",
	"Improving",
];

function populateOnsetTypeChips() {
	populateChipGroup("onsetType", ONSET_TYPE_OPTIONS);
}
function populateTimingChips() {
	populateChipGroup("timingSelect", TIMING_OPTIONS);
}

const FALLS_PREV_COUNT_OPTIONS = [
	["None — first fall", "First fall"],
	["1 previous fall", "1 prev"],
	["2–3 previous falls", "2–3 prev"],
	["4 or more falls", "4+ falls"],
];

function populateFallsPrevCountChips() {
	populateChipGroup("fallsPreviousCount", FALLS_PREV_COUNT_OPTIONS);
}

const FALLS_LOC_OPTIONS = ["LOC", "Possible LOC", "Unknown", "No LOC"];
const FALLS_WITNESSED_OPTIONS = ["Witnessed", "Unwitnessed", "Unknown"];
const FALLS_LIE_TIME_OPTIONS = [
	"Just fell",
	["< 30 minutes", "< 30 min"],
	["30 min – 1 hour", "30 min–1 hr"],
	["1–2 hours", "1–2 hrs"],
	["2–4 hours", "2–4 hrs"],
	["4–8 hours", "4–8 hrs"],
	["> 8 hours", "> 8 hrs"],
	"Unknown",
];
const FALLS_ANTICOAG_OPTIONS = [
	["On anticoagulants", "On anticoagulants"],
	["Not on anticoagulants", "Not on anticoagulants"],
	["Unknown", "Unknown"],
];

function populateFallsLocChips() {
	populateChipGroup("fallsLOC", FALLS_LOC_OPTIONS);
}
function populateFallsWitnessedChips() {
	populateChipGroup("fallsWitnessed", FALLS_WITNESSED_OPTIONS);
}
function populateFallsLieTimeChips() {
	populateChipGroup("fallsLieTime", FALLS_LIE_TIME_OPTIONS);
}
function populateFallsAnticoagChips() {
	populateChipGroup("fallsAnticoag", FALLS_ANTICOAG_OPTIONS);
}

// Head injury — LOC & amnesia chips
const HEAD_LOC_OPTIONS = ["LOC", "Possible LOC", "No LOC", "Unknown"];
const HEAD_LOC_DURATION_OPTIONS = [
	"Unknown",
	["Brief (< 5 minutes)", "< 5 min"],
	["5–15 minutes", "5–15 min"],
	["15–30 minutes", "15–30 min"],
	["> 30 minutes", "> 30 min"],
];
const HEAD_AMNESIA_OPTIONS = ["Yes", "No", "Unknown"];
const HEAD_RETRO_DURATION_OPTIONS = [
	["< 30 minutes", "< 30 min"],
	["> 30 minutes", "> 30 min"],
];
const HEAD_VOMITING_OPTIONS = [
	["None / not reported", "None"],
	["1 episode", "1×"],
	["2 episodes", "2×"],
	["3 or more episodes", "3+×"],
];
const HEAD_GCS_EYES_OPTIONS = [
	["1", "1 — None"],
	["2", "2 — Pain"],
	["3", "3 — Voice"],
	["4", "4 — Spontaneous"],
];
const HEAD_GCS_VERBAL_OPTIONS = [
	["1", "1 — None"],
	["2", "2 — Sounds"],
	["3", "3 — Words"],
	["4", "4 — Confused"],
	["5", "5 — Oriented"],
];
const HEAD_GCS_MOTOR_OPTIONS = [
	["1", "1 — None"],
	["2", "2 — Extension"],
	["3", "3 — Flex."],
	["4", "4 — Withdrawal"],
	["5", "5 — Localises"],
	["6", "6 — Obeys"],
];
const HEAD_ANTICOAG_OPTIONS = ["Yes", "No", "Unknown"];

function populateHeadInjuryChips() {
	populateChipGroup("headLOC", HEAD_LOC_OPTIONS);
	populateChipGroup("headLOCDuration", HEAD_LOC_DURATION_OPTIONS);
	populateChipGroup("headRetrograde", HEAD_AMNESIA_OPTIONS);
	populateChipGroup("headRetroDuration", HEAD_RETRO_DURATION_OPTIONS);
	populateChipGroup("headAnterograde", HEAD_AMNESIA_OPTIONS);
	populateChipGroup("headVomitingCount", HEAD_VOMITING_OPTIONS);
	populateChipGroup("headGcsE", HEAD_GCS_EYES_OPTIONS);
	populateChipGroup("headGcsV", HEAD_GCS_VERBAL_OPTIONS);
	populateChipGroup("headGcsM", HEAD_GCS_MOTOR_OPTIONS);
	populateChipGroup("headAnticoag", HEAD_ANTICOAG_OPTIONS);
}

const MOBILITY_OPTIONS = [
	{ value: "Fully mobile", label: "Fully mobile" },
	{ value: "Mobilised independently", label: "Independent" },
	{ value: "Mobilised with assistance", label: "With assistance" },
	{ value: "Non-mobile / unable to weight bear", label: "Non-mobile / NWB" },
	{ value: "Confined to bed", label: "Bedbound" },
	{ value: "Wheelchair user (baseline)", label: "Wheelchair (baseline)" },
];

function populateGroupedSelect(selectId, groups) {
	const select = $(`#${selectId}`);
	if (!select) return;
	groups.forEach(({ group, items }) => {
		const optgroup = document.createElement("optgroup");
		optgroup.label = group;
		items.forEach((label) => {
			const opt = document.createElement("option");
			opt.value = label;
			opt.textContent = label;
			optgroup.appendChild(opt);
		});
		select.appendChild(optgroup);
	});
}

function populatePcSelect() {
	populateGroupedSelect("pcSelect", PC_OPTIONS);
}

function populateCallerSelect() {
	populateGroupedSelect("hpcCaller", CALLER_OPTIONS);
}

function populateOaFoundSelect() {
	populateGroupedSelect("oaFound", OA_FOUND_OPTIONS);
}

function populateMobilityChips() {
	const group = $("[data-radio-group='oaMobility']");
	if (!group) return;
	MOBILITY_OPTIONS.forEach(({ value, label }) => {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "radio-chip";
		btn.dataset.value = value;
		btn.textContent = label;
		group.appendChild(btn);
	});
}

// CLINICAL CONTENT — ABCDE CONFIGURATION
// Drives the dynamic ABCDE primary-survey card builder.  Each entry defines
// the section key/title, normal/abnormal chip pairs, inline vital inputs, and
// optional extra HTML rendered below the chip grid.

const ABCDE = [
	{
		key: "A",
		title: "Airway",
		chips: [
			["Patent", "Obstructed"],
			["Self-maintained", "Airway support required"],
			["No abnormal sounds", "Abnormal airway sounds"],
		],
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
			["No accessory muscle use", "Accessory muscle use"],
		],
		notes: "breathingNotes",
	},
	{
		key: "C",
		title: "Circulation",
		chips: [
			["Good colour", "Pale / flushed"],
			["Normal Rate", "Tachycardic / Bradycardic"],
			["Warm to touch", "Cold / clammy"],
			["Radial pulse palpable", "Radial pulse weak / absent"],
			["Regular pulse rhythm", "Irregular pulses"],
			["CRT <2s", "CRT ≥2s"],
			["Well perfused", "Poor perfusion"],
			["No catastrophic haemorrhage", "Catastrophic haemorrhage"],
		],
		notes: "circulationNotes",
		extras:
			'<div id="colourDetailWrap" class="hidden" style="margin-top:6px"><input type="hidden" id="colourDetail"><div class="radio-chip-group" data-radio-group="colourDetail" style="gap:6px;margin-top:4px"><button type="button" class="radio-chip" data-value="Pale">Pale</button><button type="button" class="radio-chip" data-value="Flushed">Flushed</button></div></div>' +
			'<div id="hrRateDetailWrap" class="hidden" style="margin-top:6px"><input type="hidden" id="hrRateDetail"><div class="radio-chip-group" data-radio-group="hrRateDetail" style="gap:6px;margin-top:4px"><button type="button" class="radio-chip" data-value="Tachycardic">Tachycardic</button><button type="button" class="radio-chip" data-value="Bradycardic">Bradycardic</button></div></div>',
	},
	{
		key: "D",
		title: "Disability",
		chips: [
			["GCS 15", "GCS reduced"],
			["AOx4", "Not orientated x4"],
			["PEARL", "Pupils unequal / unreactive"],
			["Speech clear", "Speech impaired"],
			["Normal mobility", "Reduced mobility"],
			["No seizure activity", "Seizure activity"],
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
			["Warm to touch", "Cool to touch"],
			["Not clammy", "Clammy"],
			["Not diaphoretic", "Diaphoretic"],
			["No injuries", "Injury found"],
			["No rash", "Rash present"],
			["No immediate safeguarding concerns", "Safeguarding concerns"],
		],
		notes: "exposureNotes",
	},
];

// CLINICAL CONTENT — REVIEW OF SYSTEMS (ROS) CONFIGURATION
// Drives the dynamic ROS card builder.  Each section maps a key to its title,
// normal/abnormal toggle items, and optional extra HTML (auscultation, ECG,
// GCS calculator, etc.).

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
			'<div id="rrDetailWrap" class="hidden" style="margin-top:6px"><input type="hidden" id="rrDetail"><div class="radio-chip-group" data-radio-group="rrDetail" style="gap:6px;margin-top:4px"><button type="button" class="radio-chip" data-value="Tachypnoea">Tachypnoea</button><button type="button" class="radio-chip" data-value="Bradypnoea">Bradypnoea</button><button type="button" class="radio-chip" data-value="Apnoea">Apnoea</button></div></div>' +
			'<label class="field-label" style="margin-top:10px">Auscultation</label><div id="auscRegionGrid" class="ausc-region-grid"></div><div id="auscFindingPanel" class="ausc-finding-panel hidden"></div><input id="respAus" type="hidden" /><p id="auscPreview" class="ausc-preview field-hint" style="margin-top:6px">Not auscultated</p><label class="field-label" style="margin-top:10px" for="coughType">Cough</label><select id="coughType"><option>No cough</option><option>Dry cough present</option><option>Productive cough present</option></select><div id="sputumWrap" class="hidden" style="margin-top:6px"><label class="field-label" for="sputumDesc">Sputum</label><input id="sputumDesc" list="sputumList" placeholder="e.g. yellow, green, white, blood-stained" /><datalist id="sputumList"><option>Clear</option><option>White / frothy</option><option>Yellow</option><option>Green</option><option>Brown</option><option>Blood-stained (haemoptysis)</option><option>Pink and frothy</option><option>Rust-coloured</option></datalist></div><label class="field-label" for="respNotes">Additional notes</label><textarea id="respNotes" rows="2"></textarea>',
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
			'<label class="field-label" for="bpStatus">Blood pressure status</label><select id="bpStatus"><option>Normotensive</option><option>Hypotensive</option><option>Hypertensive</option></select><label class="field-label">ECG findings</label><div class="square-grid ecg-grid" id="ecgFindingsGrid"></div><div id="ecgLeadPanel" class="hidden" style="margin-top:10px"><label class="field-label">Affected leads <span class="field-hint" style="display:inline;font-size:11px">(select all that apply)</span></label><div class="ecg-lead-grid" id="ecgLeadsGrid"></div></div><label class="field-label" for="cvsNotes" style="margin-top:10px">Additional notes</label><textarea id="cvsNotes" rows="2"></textarea>',
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
			'<div class="ros-gcs-wrap" style="margin-top:10px"></div><label class="field-label" style="margin-top:10px" for="neuroNotes">Additional notes</label><textarea id="neuroNotes" rows="2"></textarea>',
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
			'<label class="field-label">Palpation findings by region</label><div class="abdo-grid" id="abdoRegionsGrid"></div><div id="abdoFindingPanel" class="abdo-finding-panel hidden"></div><div class="grid-2" style="margin-top:12px"><div><label class="field-label" for="giFluidIntake">Fluid intake</label><select id="giFluidIntake"><option value="">Not assessed</option><option value="Normal">Normal</option><option value="Increased">Increased</option><option value="Reduced">Reduced</option></select></div><div><label class="field-label" for="giAppetite">Appetite</label><select id="giAppetite"><option value="">Not assessed</option><option value="Normal">Normal</option><option value="Increased">Increased</option><option value="Reduced">Reduced</option></select></div></div><label class="field-label" for="bowelSounds">Bowel sounds</label><input id="bowelSounds" type="text" placeholder="Present and normal"><label class="check-row" style="margin-top:10px;margin-bottom:8px"><input type="checkbox" id="stomaPresent" /> Patient has stoma</label><div id="stomaDetails" class="hidden"><label class="field-label" for="stomaType">Stoma type</label><select id="stomaType"><option value="">Unknown</option><option>Colostomy</option><option>Ileostomy</option><option>Urostomy</option></select><label class="field-label" for="stomaOutput">Stoma output</label><select id="stomaOutput"><option value="">Not assessed</option><option>Normal</option><option>Reduced</option><option>Absent / no output</option><option>High output / loose</option></select><label class="field-label" for="stomaAppearance">Stoma appearance</label><select id="stomaAppearance"><option value="">Not assessed</option><option>Normal</option><option>Dark / discoloured</option><option>Blood-stained</option><option>Offensive</option></select></div><label class="field-label" for="giNotes" style="margin-top:8px">Additional notes</label><textarea id="giNotes" rows="2"></textarea>',
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
			'<label class="check-row" style="margin-bottom:8px"><input type="checkbox" id="catheterPresent" /> Patient has urinary catheter</label><div id="catheterDetails" class="hidden"><label class="field-label" for="catheterOutput">Catheter output</label><select id="catheterOutput"><option value="">Not assessed</option><option>Normal output</option><option>Reduced output</option><option>No output / blocked</option><option>Bypassing</option></select><label class="field-label" for="urineAppearance">Urine appearance</label><select id="urineAppearance"><option value="">Not assessed</option><option>Clear</option><option>Pale yellow</option><option>Dark yellow / concentrated</option><option>Orange / brown</option><option>Cloudy</option><option>Blood-stained</option><option>Offensive</option></select></div><label class="field-label" for="urineNotes" style="margin-top:8px">Additional notes</label><textarea id="urineNotes" rows="2"></textarea>',
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
			[
				"thoughtCoherent",
				"Thought process coherent",
				"Disorganised / tangential thinking",
			],
			[
				"noHallucinations",
				"No hallucinations reported",
				"Hallucinations reported",
			],
			["noDelusions", "No delusions expressed", "Delusions expressed"],
			["oriented", "Oriented to person, place and time", "Disoriented"],
			["insight", "Insight present", "Impaired insight"],
			[
				"noSuicidalIdeation",
				"No suicidal ideation expressed",
				"Suicidal ideation expressed",
			],
			[
				"noSelfHarmEvident",
				"No self-harm evident on examination",
				"Self-harm evident on examination",
			],
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
	initRespCounter();
});

// NAVIGATION
// Dashboard / feature switching — shows and hides the relevant tool panel.

function showDashboard() {
	$("#dashboard")?.classList.remove("hidden");
	$("#prf-tool")?.classList.add("hidden");
	$("#paeds-tool")?.classList.add("hidden");
	$("#resp-tool")?.classList.add("hidden");
	$("#backButton")?.classList.add("hidden");
	$("#resetButton")?.classList.add("hidden");
}

function showFeature(feature) {
	$("#dashboard")?.classList.add("hidden");
	$("#backButton")?.classList.remove("hidden");
	if (feature === "eprf") {
		$("#prf-tool")?.classList.remove("hidden");
		$("#resetButton")?.classList.remove("hidden");
		switchTab("history");
	} else if (feature === "paeds-prf") {
		$("#paeds-tool")?.classList.remove("hidden");
		$("#resetButton")?.classList.remove("hidden");
		initPaeds();
		// Reset paeds tabs to history
		$$("[data-paeds-tab]").forEach((t) =>
			t.classList.toggle("active", t.dataset.paedsTab === "history"),
		);
		$$(".panel[id^='paeds-panel-']").forEach((p) =>
			p.classList.remove("active"),
		);
		$("#paeds-panel-history")?.classList.add("active");
	} else if (feature === "resp-timer") {
		$("#resp-tool")?.classList.remove("hidden");
		$("#resetButton")?.classList.add("hidden");
		resetRespCounter();
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
	populatePcSelect();
	populateCallerSelect();
	populateOaFoundSelect();
	populateMobilityChips();
	populateOnsetTimeSelect();
	populateOnsetTypeChips();
	populateTimingChips();
	populateFallsPrevCountChips();
	populateFallsLocChips();
	populateFallsWitnessedChips();
	populateFallsLieTimeChips();
	populateFallsAnticoagChips();
	populateHeadInjuryChips();
	buildAbcde();
	buildRos();
	buildOptionButtons(); // after buildRos so ROS containers exist
	buildAbdoGrid(); // after buildOptionButtons so #abdoRegionsGrid exists
	buildAuscGrid();
	buildEcgSection();
	buildInjurySection();
	buildTreatmentSection();
	buildSeizureSection();
	buildMhSection();
	buildConveyTransferChips();
	buildSafeguardingSection();
	bindEvents();
	updateMapTags();
	applyWorseningDefault();
	updateWorseningScript();
	syncAuscultationOutput();
	handleConveyanceDisplay();
	enhanceSectionCards();
	renderConveyanceSuggestion();
	// bindRedFlagToggle();
	// document.addEventListener("click", scheduleRedFlags, { passive: true });
	// document.addEventListener("input", scheduleRedFlags, { passive: true });
	// document.addEventListener("change", scheduleRedFlags, { passive: true });
	bindRadioChipGroups();
}

// DOM BUILDERS — ADULT ePRF
// Functions that construct interactive UI components (chip grids, GCS
// calculators, body maps, ABCDE sections) and insert them into the page.
// Called once during init(); not re-run on user interaction.

function buildOptionButtons() {
	Object.entries(OPTIONS).forEach(([key, options]) => {
		if (key === "abdoRegions") return; // handled by buildAbdoGrid()
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

function buildAbdoGrid() {
	const grid = $("#abdoRegionsGrid");
	if (!grid) return;
	OPTIONS.abdoRegions.forEach((region) => {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "square-btn abdo-region-btn";
		btn.dataset.region = region;
		btn.innerHTML = `<span class="abdo-region-name">${region}</span><span class="abdo-region-tags"></span>`;
		grid.append(btn);
	});
}

function renderAbdoGrid() {
	$$(".abdo-region-btn").forEach((btn) => {
		const region = btn.dataset.region;
		const findings = state.abdoFindings[region];
		const hasFindings = findings && findings.size > 0;
		const isActive = state.abdoActive === region;
		btn.classList.toggle("selected", hasFindings || isActive);
		btn.classList.toggle("abdo-active", isActive);
		const tags = btn.querySelector(".abdo-region-tags");
		if (tags) {
			tags.textContent = hasFindings
				? [...findings].map((f) => ABDO_FINDING_SHORT[f] || f[0]).join(" · ")
				: "";
		}
	});

	const panel = $("#abdoFindingPanel");
	if (!panel) return;
	if (!state.abdoActive) {
		panel.classList.add("hidden");
		return;
	}
	const findings = state.abdoFindings[state.abdoActive] || new Set();
	panel.classList.remove("hidden");
	panel.innerHTML =
		`<p class="abdo-finding-label">Findings in <strong>${state.abdoActive}</strong></p>` +
		`<div class="radio-chip-group" style="flex-wrap:wrap;gap:6px;margin-top:6px">` +
		ABDO_FINDINGS.map(
			(f) =>
				`<button type="button" class="radio-chip abdo-finding-chip${findings.has(f) ? " selected" : ""}" data-finding="${f}">${f}</button>`,
		).join("") +
		`</div>` +
		(findings.size > 0
			? `<button type="button" class="abdo-clear-btn" data-region="${state.abdoActive}">✕ Clear ${state.abdoActive}</button>`
			: "");
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
		if (section.extras) {
			const sectionBody = $(".section-body", details);
			const extraWrap = document.createElement("div");
			extraWrap.innerHTML = section.extras;
			while (extraWrap.firstChild) sectionBody.append(extraWrap.firstChild);
		}
		if (section.key === "D") {
			const sectionBody = $(".section-body", details);
			const calc = document.createElement("div");
			calc.style.cssText = "margin-top:10px";
			calc.innerHTML = buildGcsCalcHTML("gcsCalc");
			sectionBody.append(calc);
		}
		root.append(details);
	});
}

const GCS_EYE = [
	[4, "Spontaneous"],
	[3, "To voice"],
	[2, "To pain"],
	[1, "None"],
];
const GCS_VERBAL = [
	[5, "Orientated"],
	[4, "Confused"],
	[3, "Inappropriate"],
	[2, "Sounds only"],
	[1, "None"],
];
const GCS_MOTOR = [
	[6, "Obeys"],
	[5, "Localises"],
	[4, "Withdraws"],
	[3, "Flexion"],
	[2, "Extension"],
	[1, "None"],
];

function buildGcsCalcHTML(prefix) {
	const row = (field, label, items) =>
		`<div class="gcs-row"><p class="gcs-row-label">${label}</p>` +
		`<div class="gcs-btn-row">` +
		items
			.map(
				([n, l]) =>
					`<button type="button" class="gcs-btn" data-gcs-prefix="${prefix}" data-gcs-field="${field}" data-gcs-score="${n}">` +
					`<span class="gcs-score">${n}</span><span class="gcs-label">${l}</span></button>`,
			)
			.join("") +
		`</div></div>`;
	return (
		`<button type="button" class="gcs-toggle secondary-action" data-gcs-toggle="${prefix}" style="width:100%;text-align:left">▸ GCS Calculator</button>` +
		`<div class="gcs-panel hidden" id="${prefix}Panel" style="margin-top:8px">` +
		row(`${prefix}Eye`, "E — Eye opening", GCS_EYE) +
		row(`${prefix}Verbal`, "V — Verbal", GCS_VERBAL) +
		row(`${prefix}Motor`, "M — Motor", GCS_MOTOR) +
		`<p class="gcs-tally" id="${prefix}Tally"></p>` +
		`</div>`
	);
}

function updateGcsTally(prefix) {
	const e4 = parseInt($("#" + prefix + "Eye")?.dataset.gcsSelected || "", 10);
	const v5 = parseInt(
		$("#" + prefix + "Verbal")?.dataset.gcsSelected || "",
		10,
	);
	const m6 = parseInt($("#" + prefix + "Motor")?.dataset.gcsSelected || "", 10);
	const tally = $("#" + prefix + "Tally");
	if (!e4 || !v5 || !m6) {
		if (tally) tally.textContent = "";
		return;
	}
	const total = e4 + v5 + m6;
	if (tally) tally.textContent = `GCS: E${e4} V${v5} M${m6} = ${total}/15`;
	// Only sync to the primary survey hidden gcsScore field for the main calculators
	if (!prefix.startsWith("obsGcs")) {
		const scoreEl = $("#gcsScore");
		if (scoreEl) scoreEl.value = total;
	}
	// For obs GCS, trigger NEWS2 recalculation on the parent obs-set
	if (prefix.startsWith("obsGcs")) {
		const idx = prefix.replace("obsGcs", "");
		const setEl = document.querySelector(`.obs-set[data-obs-idx="${idx}"]`);
		if (setEl) updateNews2(setEl);
	}
}

// CLINICAL CONTENT — SPECIALIST SECTION CONSTANTS
// Option lists for auscultation, ECG interpretation, injury assessment,
// treatment grids, seizure, mental health, MSE, and safeguarding.

const AUSC_REGIONS = ["R upper", "R lower", "L upper", "L lower"];
const AUSC_FINDINGS = [
	"Clear",
	"Wheeze",
	"Fine crackles",
	"Coarse crackles",
	"Reduced entry",
	"Absent entry",
	"Pleural rub",
	"Bronchial",
];
const AUSC_FINDING_SHORT = {
	Clear: "Cl",
	Wheeze: "Wh",
	"Fine crackles": "FC",
	"Coarse crackles": "CC",
	"Reduced entry": "Re",
	"Absent entry": "Ab",
	"Pleural rub": "PR",
	Bronchial: "Br",
};

const ECG_FINDINGS = [
	"Sinus rhythm",
	"Sinus tachycardia",
	"Sinus bradycardia",
	"Atrial fibrillation",
	"Atrial flutter",
	"ST elevation",
	"ST depression",
	"T wave inversion",
	"Peaked T waves",
	"LBBB",
	"RBBB",
	"1° AV block",
	"2° AV block",
	"3° CHB",
	"VT",
	"VF",
	"Nil acute",
	"Not performed",
];
const ECG_LEAD_FINDINGS = new Set([
	"ST elevation",
	"ST depression",
	"T wave inversion",
	"Peaked T waves",
]);
const ECG_LEADS = [
	"I",
	"II",
	"III",
	"aVR",
	"aVL",
	"aVF",
	"V1",
	"V2",
	"V3",
	"V4",
	"V5",
	"V6",
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
	"Other",
];

const INJURY_INTERVENTIONS = [
	"Wound cleaned",
	"Wound dressed",
	"Steri-strips",
	"Pressure dressing",
	"Haemostatic dressing",
	"Tourniquet applied",
	"Splinted",
	"Sling applied/Triangular Bandage",
	"Cervical collar",
	"Other",
];

const TX_AIRWAY = [
	"OPA",
	"NPA",
	"i-gel",
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

const SEIZURE_TYPES = [
	"Tonic-clonic (grand mal)",
	"Absence",
	"Focal / partial onset",
	"Myoclonic",
	"Atonic (drop attack)",
	"Status epilepticus",
	"Unknown / unwitnessed",
];
const SEIZURE_FEATURES = [
	"Tongue biting",
	"Urinary incontinence",
	"Limb jerking",
	"Eye deviation",
	"Cyanosis",
	"Frothing at mouth",
	"Head turning",
];
const SEIZURE_FINDINGS = [
	"Tongue laceration / bite mark",
	"Lip / cheek biting",
	"Urinary incontinence",
	"Faecal soiling",
	"Head injury / scalp wound",
	"Facial trauma",
	"Limb injury",
	"Back / spinal tenderness",
	"Shoulder dislocation",
	"Burn / contact injury",
	"No injuries found",
];
const SEIZURE_PRECIPITANTS = [
	"Missed medication",
	"Sleep deprivation",
	"Alcohol / substance use",
	"Fever / illness",
	"Stress",
	"Flickering / visual stimulus",
	"Hypoglycaemia",
	"Head injury",
	"Unknown",
];
const AED_COMPLIANCE = [
	"Compliant with AEDs",
	"Missed dose(s)",
	"Recently stopped medication",
	"Not prescribed AEDs",
	"Medication changed recently",
];

const MH_PCS = ["Mental health crisis", "Overdose / poisoning", "Self-harm"];
const MH_INTENT = [
	"Deliberate",
	"Accidental",
	"Unclear / unknown",
	"Intent denied",
];
const MH_PLANNING = ["Planned", "Impulsive", "Unknown"];
const OD_PRESCRIBED = [
	"Prescribed medication",
	"OTC / purchased",
	"Non-prescribed / illicit",
	"Unknown",
];
const SH_METHOD = [
	"Cutting",
	"Burning",
	"Strangulation / ligature",
	"Blunt trauma / hitting",
	"Scratching / picking",
	"Poisoning / ingestion",
	"Other",
];
const SH_DEPTH = ["Superficial", "Deep", "Unknown"];

const SAFEGUARDING_CONCERNS = [
	"None identified on scene",
	"Child at risk",
	"Vulnerable adult",
	"Self-neglect indicators",
	"Domestic abuse indicators",
	"Poor living conditions",
	"Carer strain",
	"Non-accidental injury concern",
	"Substance misuse concern",
	"Mental health vulnerability",
];

const MSE_APPEARANCE = [
	"Appropriately dressed",
	"Dishevelled",
	"Unkempt",
	"Bizarre / unusual",
];
const MSE_BEHAVIOUR = [
	"Calm",
	"Agitated",
	"Restless",
	"Aggressive",
	"Withdrawn",
	"Tearful",
	"Disinhibited",
];
const MSE_SPEECH = [
	"Normal rate/volume",
	"Pressured",
	"Slow",
	"Loud",
	"Quiet",
	"Incoherent",
	"Mute",
];
const MSE_THOUGHT_CONTENT = [
	"No abnormal content",
	"Paranoid ideation",
	"Grandiose beliefs",
	"Referential ideation",
	"Obsessional thoughts",
];
const MSE_AFFECT = [
	"Euthymic",
	"Low / depressed",
	"Elevated",
	"Anxious",
	"Labile",
	"Blunted / flat",
	"Irritable",
];
const MSE_THOUGHT_FORM = [
	"Coherent",
	"Circumstantial",
	"Tangential",
	"Flight of ideas",
	"Loose associations",
	"Thought blocking",
];
const MSE_PERCEPTION = [
	"None reported",
	"Auditory hallucinations",
	"Visual hallucinations",
	"Tactile hallucinations",
	"Command hallucinations",
];
const MSE_INSIGHT = ["Full insight", "Partial insight", "No insight"];

// DOM BUILDERS — SPECIALIST SECTIONS
// Auscultation, ECG, injury, treatment (IV/drugs/airway/wound), seizure,
// mental health, and ROS cards built from the constants above.

function buildAuscGrid() {
	const grid = $("#auscRegionGrid");
	if (!grid) return;
	AUSC_REGIONS.forEach((region) => {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "square-btn ausc-region-btn";
		if (region === "Trachea") btn.classList.add("ausc-full");
		btn.dataset.region = region;
		btn.innerHTML = `<span class="ausc-region-name">${region}</span><span class="ausc-region-tags"></span>`;
		grid.append(btn);
	});
}

function renderAuscGrid() {
	$$(".ausc-region-btn").forEach((btn) => {
		const region = btn.dataset.region;
		const findings = state.auscFindings[region];
		const hasFindings = findings && findings.size > 0;
		const isActive = state.auscActive === region;
		btn.classList.toggle("selected", hasFindings || isActive);
		btn.classList.toggle("ausc-active", isActive);
		const tags = btn.querySelector(".ausc-region-tags");
		if (tags) {
			tags.textContent = hasFindings
				? [...findings].map((f) => AUSC_FINDING_SHORT[f] || f[0]).join(" · ")
				: "";
		}
	});
	const panel = $("#auscFindingPanel");
	if (!panel) return;
	if (!state.auscActive) {
		panel.classList.add("hidden");
		return;
	}
	const findings = state.auscFindings[state.auscActive] || new Set();
	panel.classList.remove("hidden");
	panel.innerHTML =
		`<p class="ausc-finding-label">Findings in <strong>${state.auscActive}</strong></p>` +
		`<div class="radio-chip-group" style="flex-wrap:wrap;gap:6px;margin-top:6px">` +
		AUSC_FINDINGS.map(
			(f) =>
				`<button type="button" class="radio-chip ausc-finding-chip${findings.has(f) ? " selected" : ""}" data-finding="${f}">${f}</button>`,
		).join("") +
		`</div>` +
		(findings.size > 0
			? `<button type="button" class="ausc-clear-btn" data-region="${state.auscActive}">✕ Clear ${state.auscActive}</button>`
			: "");
	syncAuscultationOutput();
}

function buildEcgSection() {
	const findingsGrid = $("#ecgFindingsGrid");
	const leadsGrid = $("#ecgLeadsGrid");
	if (!findingsGrid || !leadsGrid) return;
	ECG_FINDINGS.forEach((label) => {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "square-btn ecg-finding";
		btn.textContent = label;
		btn.dataset.finding = label;
		if (label === "Not performed") {
			btn.classList.add("selected");
			state.ecgFindings.add(label);
		}
		findingsGrid.append(btn);
	});
	ECG_LEADS.forEach((lead) => {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "square-btn ecg-lead";
		btn.textContent = lead;
		btn.dataset.lead = lead;
		leadsGrid.append(btn);
	});
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

	// Substitute "Other" chips with the free-text value when provided
	const typeOther = val("injuryTypeOther");
	const intOther = val("injuryIntOther");
	const types = [...pendingInjuryTypes].map((t) =>
		t === "Other" && typeOther ? typeOther : t,
	);
	const interventions = [...pendingInjuryInterventions].map((i) =>
		i === "Other" && intOther ? intOther : i,
	);

	state.injuryEntries.push({
		region,
		types,
		nv: val("injuryNv"),
		interventions,
	});

	pendingInjuryTypes.clear();
	pendingInjuryInterventions.clear();
	$("#injuryRegion").value = "";
	$("#injuryNv").value = "";
	const typeOtherEl = $("#injuryTypeOther");
	const intOtherEl = $("#injuryIntOther");
	if (typeOtherEl) typeOtherEl.value = "";
	if (intOtherEl) intOtherEl.value = "";
	$("#injuryTypeOtherWrap")?.classList.add("hidden");
	$("#injuryIntOtherWrap")?.classList.add("hidden");
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
	buildButtonGrid(
		"airwayInterventionGrid",
		TX_AIRWAY,
		"txGroup",
		"airway",
		"txValue",
	);
	buildButtonGrid(
		"woundInterventionGrid",
		TX_WOUND,
		"txGroup",
		"wound",
		"txValue",
	);
	buildButtonGrid(
		"manualHandlingGrid",
		TX_MANUAL,
		"txGroup",
		"manual",
		"txValue",
	);

	$("#addVaButton")?.addEventListener("click", addIvEntry);
	$("#addDrugButton")?.addEventListener("click", addDrugEntry);
	$("#addChangeButton")?.addEventListener("click", addChangeEntry);

	$("#vaOutcome")?.addEventListener("change", () => {
		const successful = val("vaOutcome") === "Successful — patent and flushed";
		$("#vaFlushWrap")?.classList.toggle("hidden", !successful);
		if (successful) {
			setRadioChip("vaFlushed", "Flushed — 5ml NaCl 0.9%");
		} else {
			$$("[data-radio-group='vaFlushed'] [data-value]").forEach((c) =>
				c.classList.remove("selected"),
			);
			const fi = $("#vaFlushed");
			if (fi) fi.value = "";
		}
	});

	$("#vaType")?.addEventListener("change", () => {
		const type = val("vaType");
		const isIv = type === "IV Cannula";
		const isIo = type === "IO Access";
		$("#vaGaugeWrap")?.classList.toggle("hidden", !isIv);
		$("#vaIvSites")?.classList.toggle("hidden", !isIv);
		$("#vaIoSites")?.classList.toggle("hidden", !isIo);
		// Clear site + gauge chip selections when type changes
		$$("[data-radio-group='vaSite'] [data-value]").forEach((c) =>
			c.classList.remove("selected"),
		);
		$$("[data-radio-group='vaGauge'] [data-value]").forEach((c) =>
			c.classList.remove("selected"),
		);
		const siteInp = $("#vaSite");
		if (siteInp) siteInp.value = "";
		const gaugeInp = $("#vaGauge");
		if (gaugeInp) gaugeInp.value = "";
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
	const remove = (index) => {
		state[stateKey].splice(index, 1);
		render();
	};
	return { render, remove };
}

const { render: renderIvEntries, remove: removeIvEntry } = makeEntryManager(
	"ivEntries",
	"vaEntries",
	(e) => {
		const parts = [e.type];
		if (e.gauge) parts.push(e.gauge);
		if (e.site) parts.push(`— ${e.site}`);
		if (e.outcome) parts.push(`(${e.outcome})`);
		if (e.fluids) parts.push(`• ${e.fluids}`);
		return parts.join(" ");
	},
	"remove-va",
);

function renderDrugEntries() {
	const root = $("#drugEntries");
	if (!root) return;
	root.innerHTML = "";
	state.drugEntries.forEach((entry, index) => {
		const parts = [entry.drug];
		if (entry.dose) parts.push(entry.dose);
		if (entry.route) parts.push(`via ${entry.route}`);
		if (entry.time) parts.push(`at ${entry.time}`);
		const row = document.createElement("div");
		row.className = "ausc-entry";
		row.innerHTML = `<span>${parts.join(" ")}</span><div style="display:flex;gap:4px"><button type="button" class="repeat-drug-btn" data-repeat-drug="${index}" aria-label="Repeat">↺</button><button type="button" data-remove-drug="${index}" aria-label="Remove">×</button></div>`;
		root.append(row);
	});
}
function removeDrugEntry(index) {
	state.drugEntries.splice(index, 1);
	renderDrugEntries();
}
function repeatDrugEntry(index) {
	const entry = state.drugEntries[index];
	if (!entry) return;
	const now = new Date();
	const hh = String(now.getHours()).padStart(2, "0");
	const mm = String(now.getMinutes()).padStart(2, "0");
	const nameEl = $("#drugName");
	const otherEl = $("#drugNameOther");
	if (nameEl) {
		// Check if the drug is a known option in the select
		const isKnown = [...nameEl.options].some(
			(o) => o.value === entry.drug || o.text === entry.drug,
		);
		if (isKnown) {
			nameEl.value = entry.drug;
			otherEl?.classList.add("hidden");
		} else {
			nameEl.value = "Other";
			if (otherEl) {
				otherEl.value = entry.drug;
				otherEl.classList.remove("hidden");
			}
		}
	}
	const doseEl = $("#drugDose");
	if (doseEl) doseEl.value = entry.dose || "";
	const routeEl = $("#drugRoute");
	if (routeEl) routeEl.value = entry.route || "";
	const timeEl = $("#drugTime");
	if (timeEl) timeEl.value = `${hh}:${mm}`;
	nameEl?.scrollIntoView({ behavior: "smooth", block: "center" });
	nameEl?.focus();
}

const { render: renderChangeEntries, remove: removeChangeEntry } =
	makeEntryManager(
		"clinicalChanges",
		"changeEntries",
		(e) => (e.time ? `[${e.time}] ${e.desc}` : e.desc),
		"remove-change",
	);

function addIvEntry() {
	const type = val("vaType");
	const site = val("vaSite");
	if (!type || !site) return;
	const fluidParts = [val("vaFlushed"), val("vaFluids")].filter(Boolean);
	state.ivEntries.push({
		type,
		gauge: val("vaGauge"),
		site,
		outcome: val("vaOutcome"),
		fluids: fluidParts.join("; "),
	});
	["vaType", "vaGauge", "vaSite", "vaOutcome", "vaFlushed", "vaFluids"].forEach(
		(id) => {
			const el = $(`#${id}`);
			if (el) el.value = "";
		},
	);
	$("#vaGaugeWrap")?.classList.add("hidden");
	$("#vaIvSites")?.classList.add("hidden");
	$("#vaIoSites")?.classList.add("hidden");
	$("#vaFlushWrap")?.classList.add("hidden");
	$$(
		"[data-radio-group='vaType'] [data-value], [data-radio-group='vaGauge'] [data-value], [data-radio-group='vaSite'] [data-value], [data-radio-group='vaOutcome'] [data-value], [data-radio-group='vaFlushed'] [data-value]",
	).forEach((c) => c.classList.remove("selected"));
	renderIvEntries();
}

function addDrugEntry() {
	const drug =
		val("drugName") === "Other" ? val("drugNameOther") : val("drugName");
	if (!drug) return;
	state.drugEntries.push({
		drug,
		dose: val("drugDose"),
		route: val("drugRoute"),
		time: val("drugTime"),
	});
	["drugName", "drugNameOther", "drugDose", "drugRoute", "drugTime"].forEach(
		(id) => {
			const el = $(`#${id}`);
			if (el) el.value = "";
		},
	);
	$("#drugNameOther")?.classList.add("hidden");
	$$("[data-radio-group='drugRoute'] [data-value]").forEach((c) =>
		c.classList.remove("selected"),
	);
	renderDrugEntries();
}

function addChangeEntry() {
	const desc = val("changeDesc");
	if (!desc) return;
	state.clinicalChanges.push({ time: val("changeTime"), desc });
	["changeDesc", "changeTime"].forEach((id) => {
		const el = $(`#${id}`);
		if (el) el.value = "";
	});
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
		const items = [...state.woundInterventions].map((v) =>
			v === "Other" && val("woundOther") ? val("woundOther") : v,
		);
		lines.push(`Wound management: ${items.join(", ")}.`);
	}
	if (state.manualHandling.size) {
		const items = [...state.manualHandling].map((v) =>
			v === "Other" && val("manualOther") ? val("manualOther") : v,
		);
		lines.push(`Manual handling: ${items.join(", ")}.`);
	}
	if (val("otherInterventionsFree"))
		lines.push(`Other interventions: ${val("otherInterventionsFree")}.`);

	if (val("treatmentNotes")) lines.push(val("treatmentNotes"));
	return lines.length ? lines.join("\n") : "No interventions documented.";
}

// --- Seizure assessment ---

function buildSeizureSection() {
	buildButtonGrid(
		"seizureTypeGrid",
		SEIZURE_TYPES,
		"szGroup",
		"type",
		"szValue",
	);
	buildButtonGrid(
		"seizureFeaturesGrid",
		SEIZURE_FEATURES,
		"szGroup",
		"features",
		"szValue",
	);
	buildButtonGrid(
		"seizureFindingsGrid",
		SEIZURE_FINDINGS,
		"szGroup",
		"findings",
		"szValue",
	);
	buildButtonGrid(
		"seizurePrecipitantsGrid",
		SEIZURE_PRECIPITANTS,
		"szGroup",
		"precipitants",
		"szValue",
	);
	buildButtonGrid(
		"aedComplianceGrid",
		AED_COMPLIANCE,
		"szGroup",
		"aed",
		"szValue",
	);
}

function buildSeizureText() {
	const lines = [];
	if (state.seizureType.size)
		lines.push(`Seizure type: ${[...state.seizureType].join(", ")}.`);
	if (val("seizureCount"))
		lines.push(`Number of seizures: ${val("seizureCount")}.`);
	if (val("seizureDuration"))
		lines.push(`Duration: ${val("seizureDuration")}.`);
	if (val("seizureTime")) lines.push(`Time of onset: ${val("seizureTime")}.`);
	if (isChecked("seizureWitnessed")) {
		const by = val("seizureWitnessedBy");
		lines.push(`Witnessed: Yes${by ? ` — ${by}` : ""}.`);
	} else {
		lines.push("Witnessed: No / unknown.");
	}
	if (isChecked("seizureLOC"))
		lines.push("Loss of consciousness during seizure: Yes.");
	if (state.seizureFeatures.size)
		lines.push(
			`Features during seizure: ${[...state.seizureFeatures].join(", ")}.`,
		);
	if (state.seizureFindings.size)
		lines.push(
			`Post-seizure findings on examination: ${[...state.seizureFindings].join(", ")}.`,
		);
	const postictal = isChecked("seizurePostictal");
	if (postictal) {
		const dur = val("seizurePostictalDuration");
		lines.push(`Postictal phase: Yes${dur ? ` — duration ${dur}` : ""}.`);
	}
	if (val("seizureRecovery"))
		lines.push(`Recovery to baseline: ${val("seizureRecovery")}.`);
	if (isChecked("seizureKnownEpileptic")) {
		const diag = val("seizureEpilepsyDiagnosis");
		lines.push(`Known epileptic: Yes${diag ? ` (${diag})` : ""}.`);
		if (val("seizureLastPrior"))
			lines.push(`Last seizure prior to today: ${val("seizureLastPrior")}.`);
		if (val("seizureUsualPattern"))
			lines.push(`Usual pattern: ${val("seizureUsualPattern")}.`);
		if (state.aedCompliance.size)
			lines.push(`AED compliance: ${[...state.aedCompliance].join(", ")}.`);
	}
	if (state.seizurePrecipitants.size)
		lines.push(
			`Precipitating factors: ${[...state.seizurePrecipitants].join(", ")}.`,
		);
	if (val("seizureNotes")) lines.push(val("seizureNotes"));
	return lines.length ? lines.join("\n") : "No seizure assessment documented.";
}

// --- Mental health assessment ---

function buildMhSection() {
	buildButtonGrid("mhIntentGrid", MH_INTENT, "mhGroup", "intent", "mhValue");
	buildButtonGrid(
		"mhPlanningGrid",
		MH_PLANNING,
		"mhGroup",
		"planning",
		"mhValue",
	);
	buildButtonGrid(
		"odPrescribedGrid",
		OD_PRESCRIBED,
		"mhGroup",
		"odPrescribed",
		"mhValue",
	);
	buildButtonGrid("shMethodGrid", SH_METHOD, "mhGroup", "shMethod", "mhValue");
	buildButtonGrid("shDepthGrid", SH_DEPTH, "mhGroup", "shDepth", "mhValue");
	buildButtonGrid(
		"mseAppearanceGrid",
		MSE_APPEARANCE,
		"mhGroup",
		"mseAppearance",
		"mhValue",
	);
	buildButtonGrid(
		"mseBehaviourGrid",
		MSE_BEHAVIOUR,
		"mhGroup",
		"mseBehaviour",
		"mhValue",
	);
	buildButtonGrid(
		"mseSpeechGrid",
		MSE_SPEECH,
		"mhGroup",
		"mseSpeech",
		"mhValue",
	);
	buildButtonGrid(
		"mseThoughtContentGrid",
		MSE_THOUGHT_CONTENT,
		"mhGroup",
		"mseThoughtContent",
		"mhValue",
	);
	buildButtonGrid(
		"mseAffectGrid",
		MSE_AFFECT,
		"mhGroup",
		"mseAffect",
		"mhValue",
	);
	buildButtonGrid(
		"mseThoughtFormGrid",
		MSE_THOUGHT_FORM,
		"mhGroup",
		"mseThoughtForm",
		"mhValue",
	);
	buildButtonGrid(
		"msePerceptionGrid",
		MSE_PERCEPTION,
		"mhGroup",
		"msePerception",
		"mhValue",
	);
	buildButtonGrid(
		"mseInsightGrid",
		MSE_INSIGHT,
		"mhGroup",
		"mseInsight",
		"mhValue",
	);
}

function buildMhAssessmentText() {
	const pc = getPc();
	const lines = [];
	if (state.mhIntent.size)
		lines.push(`Intent: ${[...state.mhIntent].join(", ")}.`);
	if (state.mhPlanning.size)
		lines.push(`Nature of act: ${[...state.mhPlanning].join(", ")}.`);
	if (val("mhTriggers"))
		lines.push(`Triggers / precipitants: ${val("mhTriggers")}.`);
	if (isChecked("mhPrevious")) {
		lines.push(
			`Previous episodes: ${val("mhPreviousDetails") || "Yes — details not documented"}.`,
		);
	}
	if (pc === "Overdose / poisoning") {
		if (val("odSubstance")) lines.push(`Substance(s): ${val("odSubstance")}.`);
		if (val("odAmount")) lines.push(`Amount: ${val("odAmount")}.`);
		if (val("odTime")) lines.push(`Time taken: ${val("odTime")}.`);
		if (val("odRoute")) lines.push(`Route: ${val("odRoute")}.`);
		if (isChecked("odAlcohol")) lines.push("Alcohol co-ingestion reported.");
		if (state.odPrescribed.size)
			lines.push(`Source: ${[...state.odPrescribed].join(", ")}.`);
	}
	if (pc === "Self-harm") {
		if (state.shMethod.size)
			lines.push(`Method: ${[...state.shMethod].join(", ")}.`);
		if (state.shDepth.size)
			lines.push(`Wound depth: ${[...state.shDepth].join(", ")}.`);
	}
	const msePairs = [
		[state.mseAppearance, "Appearance"],
		[state.mseBehaviour, "Behaviour"],
		[state.mseSpeech, "Communication"],
		[state.mseThoughtContent, "Delusions"],
		[state.mseAffect, "Emotion/affect"],
		[state.mseThoughtForm, "Form of thoguht"],
		[state.msePerception, "Hallucination/Perception"],
		[state.mseInsight, "Insight"],
	];
	const mseLines = msePairs
		.filter(([s]) => s.size)
		.map(([s, label]) => `${label}: ${[...s].join(", ")}.`);
	if (mseLines.length) lines.push("MSE — " + mseLines.join(" "));
	if (val("mhCurrentServices"))
		lines.push(`Current MH services: ${val("mhCurrentServices")}.`);
	if (val("mhS136")) lines.push(`S136 / MHA: ${val("mhS136")}.`);
	if (val("mhNotes")) lines.push(val("mhNotes"));
	return lines.length
		? lines.join("\n")
		: "No MH assessment details documented.";
}

// --- Review of systems card builder ---

function buildRos() {
	const root = $("#rosContainer");
	Object.entries(ROS).forEach(([key, section], index) => {
		const details = document.createElement("details");
		details.className = "section-card";

		details.innerHTML = `<summary><span>${section.title}</span><small id="badge-${key}" class="status-pill">All normal</small></summary><div class="section-body"><div class="square-grid ros-grid"></div>${section.extras || ""}</div>`;
		if (key === "psych") {
			details.id = "ros-psych-section";
			details.classList.add("hidden");
		}
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
		// Inject ROS GCS calculator into neuro section
		if (key === "neuro") {
			const wrap = $(".ros-gcs-wrap", details);
			if (wrap) wrap.innerHTML = buildGcsCalcHTML("rosGcs");
		}
		root.append(details);
	});
}

function buildSafeguardingSection() {
	buildButtonGrid(
		"safeguardingGrid",
		SAFEGUARDING_CONCERNS,
		"sgGroup",
		"safeguarding",
		"sgValue",
	);
}

function renderConveyanceSuggestion() {
	const box = $("#conveyanceSuggestion");
	if (!box) return;
	const decision = val("conveyanceDecision");
	if (decision === "Conveyed") {
		box.classList.add("hidden");
		return;
	}
	const hr = parseInt(val("hr"));
	const bp = rfSystolic();
	const rr = parseInt(val("rr"));
	const spo2 = parseInt(val("spo2"));
	const gcs = parseInt(val("gcsScore"));
	const criteria = [
		{
			label: "Observations within normal limits",
			met:
				!isNaN(hr) &&
				hr >= 60 &&
				hr <= 100 &&
				bp !== null &&
				bp >= 90 &&
				bp <= 140 &&
				!isNaN(rr) &&
				rr >= 12 &&
				rr <= 20 &&
				!isNaN(spo2) &&
				spo2 >= 95 &&
				!isNaN(gcs) &&
				gcs === 15,
		},
		{
			label: "No ABCDE abnormalities",
			met: !$$("[data-abc]").some((b) => b.dataset.abcState === "abnormal"),
		},
		{
			label: "Patient has capacity",
			met: val("capacityStatus") === "Has capacity",
		},
		{
			label: "No active clinical prompts",
			met: evaluateRedFlags().length === 0,
		},
		{
			label: "Safety netting completed",
			met:
				isChecked("riskExplained") &&
				isChecked("alternativesDiscussed") &&
				isChecked("understandsRisk") &&
				isChecked("canRecontact"),
		},
	];
	const allMet = criteria.every((c) => c.met);
	const metCount = criteria.filter((c) => c.met).length;
	box.classList.remove(
		"hidden",
		"convey-suggest--clear",
		"convey-suggest--partial",
	);
	if (allMet) {
		box.classList.add("convey-suggest--clear");
		box.innerHTML = `<div class="cs-header"><span class="cs-icon">✓</span><strong>Non-conveyance criteria met (${metCount}/${criteria.length})</strong></div>
<p class="cs-criteria">${criteria.map((c) => `<span class="cs-tick">✓ ${c.label}</span>`).join("")}</p>
<p class="cs-label">Suggested wording:</p>
<p class="cs-wording">"Patient assessed as suitable for non-conveyance. Observations within normal limits. No clinical concerns identified on primary survey. Patient assessed as having capacity to make an informed decision. Risks and alternatives have been clearly explained and understood. Patient aware to call 999 should symptoms worsen or new concerns arise."</p>
<p class="cs-disclaimer">Prompt only — clinician must make the final decision based on full clinical assessment.</p>`;
	} else {
		box.classList.add("convey-suggest--partial");
		box.innerHTML = `<div class="cs-header"><span class="cs-icon">◑</span><strong>Non-conveyance criteria — ${metCount}/${criteria.length} met</strong></div>
<p class="cs-criteria">${criteria.map((c) => `<span class="${c.met ? "cs-tick" : "cs-cross"}">${c.met ? "✓" : "✗"} ${c.label}</span>`).join("")}</p>
<p class="cs-disclaimer">Prompt only — clinician must make the final decision based on full clinical assessment.</p>`;
	}
}

// TEXT BUILDERS — GYNAECOLOGY & HANDOVER
// Gynaecology summary output and the pre-hospital ED handover document.

function buildSafeguardingText() {
	const concerns = [...state.safeguardingConcerns];
	if (!concerns.length && !val("safeguardingDetail")) return "";
	const lines = [];
	if (concerns.length)
		lines.push(`Safeguarding concerns: ${concerns.join(", ")}.`);
	if (val("safeguardingDetail"))
		lines.push(`Detail: ${val("safeguardingDetail")}`);
	if (isChecked("safeguardingReferral")) {
		const ref = val("safeguardingReferralDetail");
		lines.push(`Safeguarding referral made.${ref ? ` ${ref}` : ""}`);
	}
	return lines.join("\n");
}

function updateDemographicVisibility() {
	const sex = val("ptSex");
	const age = parseInt(val("ptAge"), 10);
	const isFemaleOrOther = sex === "Female" || sex === "Other";
	const isReproductiveAge = isNaN(age) || (age >= 10 && age <= 60);
	$("#gynaeCard")?.classList.toggle(
		"hidden",
		!(isFemaleOrOther && isReproductiveAge),
	);
}

function buildGynaeOutput() {
	const lines = [];

	const status = val("pregnancyStatus");
	if (status) {
		let line = `Pregnancy status: ${status}`;
		if (status !== "Not pregnant") {
			const gestation = val("gestationWeeks");
			const edd = val("edd");
			const gravida = val("gravida");
			const para = val("para");
			const details = [
				gestation ? `${gestation} weeks` : null,
				edd ? `EDD ${edd}` : null,
				gravida || para ? `G${gravida || "?"}P${para || "?"}` : null,
			]
				.filter(Boolean)
				.join(", ");
			if (details) line += ` (${details})`;
		}
		lines.push(line);
	}

	const lmp = val("lmp");
	if (lmp) lines.push(`LMP: ${lmp}`);

	const isSymptom = (key) =>
		!!document
			.querySelector(`.gynae-symptom[data-gynae-symptom="${key}"]`)
			?.classList.contains("selected");
	const isChar = (key) =>
		!!document
			.querySelector(`.gynae-char[data-gynae-char="${key}"]`)
			?.classList.contains("selected");
	const isDisc = (key) =>
		!!document
			.querySelector(`.gynae-disc[data-gynae-disc="${key}"]`)
			?.classList.contains("selected");

	const symptoms = [];
	if (isSymptom("pvBleed")) {
		let bleed = "PV bleeding";
		const severity = val("pvBleedSeverity");
		const chars = [
			isChar("bright") ? "bright red" : null,
			isChar("dark") ? "dark/old blood" : null,
			isChar("clots") ? "clots" : null,
		].filter(Boolean);
		const detail = [severity, ...chars].filter(Boolean).join(", ");
		if (detail) bleed += ` — ${detail}`;
		symptoms.push(bleed);
	}
	if (isSymptom("pelvicPain")) symptoms.push("pelvic pain");
	if (isSymptom("discharge")) {
		const discColours = [
			isDisc("clear") ? "clear/white" : null,
			isDisc("yellow") ? "yellow" : null,
			isDisc("green") ? "green" : null,
			isDisc("grey") ? "grey" : null,
			isDisc("brown") ? "brown" : null,
			isDisc("blood") ? "blood-stained" : null,
		].filter(Boolean);
		const discConsistency = [
			isDisc("watery") ? "watery" : null,
			isDisc("thick") ? "thick" : null,
			isDisc("cottage") ? "cottage cheese" : null,
			isDisc("frothy") ? "frothy" : null,
		].filter(Boolean);
		const discOdour = [
			isDisc("no-odour") ? "no odour" : null,
			isDisc("offensive") ? "offensive odour" : null,
			isDisc("fishy") ? "fishy odour" : null,
		].filter(Boolean);
		const discAmount = val("dischargeAmount");
		const discDuration = val("dischargeDuration");

		let disc = "Vaginal discharge";
		const discParts = [
			discColours.length ? discColours.join("/") : null,
			discConsistency.length ? discConsistency.join(", ") : null,
			discOdour.length ? discOdour.join(", ") : null,
			discAmount ? `${discAmount.toLowerCase()} amount` : null,
			discDuration ? `onset: ${discDuration}` : null,
		].filter(Boolean);
		if (discParts.length) disc += ` — ${discParts.join("; ")}`;
		symptoms.push(disc);
	}
	if (symptoms.length) lines.push(`Symptoms: ${symptoms.join("; ")}`);

	const notes = val("gynaeNotes");
	if (notes) lines.push(notes);

	return lines.length
		? lines.join("\n")
		: "No gynaecological concerns identified";
}

function buildEdHandoverText() {
	const now = new Date();
	const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
	const pc = getPc();
	const age = val("ptAge");
	const sex = val("ptSex");
	const demographics = [
		age ? `${age}yr` : null,
		sex !== "Not specified" ? sex : null,
	]
		.filter(Boolean)
		.join(" ");
	const dest = buildConveyDestination();

	// ── Observations ────────────────────────────────────────
	const obs = [
		val("hr") ? `HR ${val("hr")}bpm` : null,
		val("bp") ? `BP ${val("bp")}mmHg` : null,
		val("rr") ? `RR ${val("rr")}/min` : null,
		val("spo2") ? `SpO₂ ${val("spo2")}%` : null,
		val("temp") ? `Temp ${val("temp")}°C` : null,
		val("gcsScore") ? `GCS ${val("gcsScore")}/15` : null,
		val("bm") ? `BM ${val("bm")}mmol/L` : null,
	]
		.filter(Boolean)
		.join(" | ");

	// ── ABCDE — only report abnormals; single line if all clear ─
	const abcdeAbnormals = [];
	let abcdeAllClear = true;
	ABCDE.forEach(({ key, notes: notesId }) => {
		const chips = $$(`[data-abc="${key}"]`);
		const abnormals = chips
			.filter((b) => b.dataset.abcState === "abnormal")
			.map((b) => b.dataset.abnormal);
		const notes = notesId ? val(notesId) : "";
		if (abnormals.length || notes) {
			abcdeAllClear = false;
			abcdeAbnormals.push(
				`${key}: ${[...abnormals, notes].filter(Boolean).join(", ")}.`,
			);
		}
	});
	const abcdeSummary = abcdeAllClear
		? "Primary survey: No ABC concerns."
		: abcdeAbnormals.join("\n");

	// ── SOCRATES / symptom description ───────────────────────
	const hasPain = !isChecked("noPain");
	const site = getSelectedParts(state.siteParts);
	const radiation = getSelectedParts(state.radiationParts);
	const character = listFactors(state.character, "characterOther", "");
	const associated = listFactors(state.associated, "associatedOther", "");
	const exacerbating = listFactors(state.exacerbating, "exacerbatingOther", "");
	const relieving = listFactors(state.relieving, "relievingOther", "");
	const severityNow = val("severity");
	const severityWorst = val("severityWorst");
	const onsetType = val("onsetType");
	const oTime = onsetTime();
	const duration = val("onsetDuration");
	const clockSuffix = onsetClockSuffix();
	const onsetStr = [
		onsetType,
		oTime ? oTime + clockSuffix : null,
		duration ? `duration ${duration}` : null,
	]
		.filter(Boolean)
		.join(", ");
	const severityStr = [
		severityNow ? `${severityNow}/10 now` : null,
		severityWorst ? `${severityWorst}/10 at worst` : null,
	]
		.filter(Boolean)
		.join(", ");

	const socratesLines = [];
	if (hasPain) {
		if (site) socratesLines.push(`Site: ${site}`);
		if (onsetStr) socratesLines.push(`Onset: ${onsetStr}`);
		if (character) socratesLines.push(`Character: ${character}`);
		if (radiation) socratesLines.push(`Radiation: ${radiation}`);
		if (associated) socratesLines.push(`Associated: ${associated}`);
		if (exacerbating) socratesLines.push(`Worse with: ${exacerbating}`);
		if (relieving) socratesLines.push(`Better with: ${relieving}`);
		if (severityStr) socratesLines.push(`Severity: ${severityStr}`);
	} else {
		if (onsetStr) socratesLines.push(`Onset: ${onsetStr}`);
		if (associated) socratesLines.push(`Associated symptoms: ${associated}`);
		if (severityStr) socratesLines.push(`Severity: ${severityStr}`);
	}

	// ── Interventions ────────────────────────────────────────
	const drugs = state.drugEntries.map((e) => {
		const parts = [e.drug];
		if (e.dose) parts.push(e.dose);
		if (e.route) parts.push(`via ${e.route}`);
		if (e.time) parts.push(`at ${e.time}`);
		return parts.join(" ");
	});
	const ivLines = state.ivEntries.map((e) => {
		const parts = ["IV access"];
		if (e.gauge) parts.push(e.gauge);
		if (e.site) parts.push(`— ${e.site}`);
		if (e.attempts)
			parts.push(`(${e.attempts} attempt${e.attempts !== "1" ? "s" : ""})`);
		return parts.join(" ");
	});
	const txLines = [
		...(state.airwayInterventions.size
			? [`Airway: ${[...state.airwayInterventions].join(", ")}`]
			: []),
		...(state.woundInterventions.size
			? [`Wound: ${[...state.woundInterventions].join(", ")}`]
			: []),
		...ivLines,
		...drugs,
		...(val("otherInterventionsFree") ? [val("otherInterventionsFree")] : []),
	];
	const ecgLine = buildEcgText();
	const sgText = buildSafeguardingText();
	const clinChanges = state.clinicalChanges.map(
		(e) => `${e.time ? `[${e.time}] ` : ""}${e.text}`,
	);

	const lines = [
		`ED HANDOVER ── ${timeStr}`,
		"",
		"PATIENT",
		`${demographics ? demographics + " | " : ""}${pc}`,
		`Allergies: ${isChecked("nkda") ? "NKDA" : val("allergies") || "None known"}`,
		!isChecked("noMeds") && val("medications")
			? `Medications: ${val("medications")}`
			: null,
		!isChecked("noPmh") && val("pmh") ? `PMH: ${val("pmh")}` : null,
		"",
		"HISTORY",
		val("hpcEvents") || "History not documented.",
		"",
		socratesLines.length ? (hasPain ? "PAIN (SOCRATES)" : "SYMPTOMS") : null,
		socratesLines.length ? socratesLines.join("\n") : null,
		socratesLines.length ? "" : null,
		obs ? `OBSERVATIONS\n${obs}` : null,
		obs ? "" : null,
		abcdeSummary,
		ecgLine ? `ECG: ${ecgLine.replace("ECG: ", "")}` : null,
		"",
		txLines.length ? "INTERVENTIONS" : null,
		txLines.length ? txLines.join("\n") : null,
		txLines.length ? "" : null,
		clinChanges.length ? "CLINICAL CHANGES" : null,
		clinChanges.length ? clinChanges.join("\n") : null,
		clinChanges.length ? "" : null,
		val("capacityStatus") ? `CAPACITY: ${val("capacityStatus")}` : null,
		sgText ? `\nSAFEGUARDING\n${sgText}` : null,
		val("handoverNotes") ? `\nADDITIONAL NOTES\n${val("handoverNotes")}` : null,
		dest ? `\nRECEIVING: ${dest}` : null,
	].filter((l) => l !== null);
	return lines.join("\n");
}

// EVENT BINDING — ADULT ePRF
// All DOM event listeners for the adult form wired here.  Delegated listeners
// sit on document to handle dynamically-created elements (obs sets, entry rows).

function bindEvents() {
	$$(".tab").forEach((tab) =>
		tab.addEventListener("click", () => switchTab(tab.dataset.tab)),
	);
	$("#fallsTimeUnknownBtn")?.addEventListener("click", () => {
		const btn = $("#fallsTimeUnknownBtn");
		const input = $("#fallsTime");
		const isUnknown = btn.classList.toggle("selected");
		input.disabled = isUnknown;
		input.style.opacity = isUnknown ? "0.4" : "";
		if (isUnknown) input.value = "";
	});
	$("#resetButton").addEventListener("click", () => {
		if (confirm("Clear all data and start a new PRF?")) location.reload();
	});
	$("#pcSelect").addEventListener("change", () => {
		const pc = val("pcSelect");
		$("#pcOtherWrap").classList.toggle("hidden", pc !== "Other");
		$("#fallsAssessmentCard").classList.toggle("hidden", pc !== "Fall");
		$("#headInjuryCard").classList.toggle("hidden", pc !== "Head injury");
		$("#seizureAssessmentCard").classList.toggle("hidden", pc !== "Seizure");
		const isMhPc = MH_PCS.includes(pc);
		$("#mhAssessmentCard").classList.toggle("hidden", !isMhPc);
		$("#ros-psych-section")?.classList.toggle("hidden", !isMhPc);
		$("#odDetailsWrap").classList.toggle(
			"hidden",
			pc !== "Overdose / poisoning",
		);
		$("#shDetailsWrap").classList.toggle("hidden", pc !== "Self-harm");
		if (state.worseningAuto) applyWorseningDefault();
		else updateWorseningScript();
	});

	// ── Demographics → conditional sections ──────────────────
	$("#ptSex")?.addEventListener("change", updateDemographicVisibility);
	$("#ptAge")?.addEventListener("input", updateDemographicVisibility);
	$("#pregnancyStatus")?.addEventListener("change", () => {
		const status = val("pregnancyStatus");
		const showDetails =
			status === "Possibly pregnant" || status === "Confirmed pregnant";
		$("#pregnancyDetails")?.classList.toggle("hidden", !showDetails);
	});
	document.addEventListener("click", (e) => {
		const chip = e.target.closest(".gynae-symptom, .gynae-char, .gynae-disc");
		if (!chip) return;
		chip.classList.toggle("selected");
		if (chip.classList.contains("gynae-symptom")) {
			const sym = chip.dataset.gynaeSymptom;
			if (sym === "pvBleed")
				$("#pvBleedDetail")?.classList.toggle(
					"hidden",
					!chip.classList.contains("selected"),
				);
			if (sym === "discharge")
				$("#dischargeDetail")?.classList.toggle(
					"hidden",
					!chip.classList.contains("selected"),
				);
		}
	});

	$("#capacityStatus").addEventListener("change", handleCapacityDisplay);
	$("#onsetTime").addEventListener("change", () => {
		$("#onsetTimeOther")?.classList.toggle(
			"hidden",
			val("onsetTime") !== "Other",
		);
	});
	$("#coughType").addEventListener("change", () => {
		$("#sputumWrap")?.classList.toggle(
			"hidden",
			val("coughType") !== "Productive cough present",
		);
	});
	$("#drugName")?.addEventListener("change", () => {
		const isOther = val("drugName") === "Other";
		$("#drugNameOther")?.classList.toggle("hidden", !isOther);
		if (isOther) setTimeout(() => $("#drugNameOther")?.focus(), 50);
	});
	document.addEventListener("change", (e) => {
		if (e.target.id === "catheterPresent")
			$("#catheterDetails")?.classList.toggle("hidden", !e.target.checked);
		if (e.target.id === "stomaPresent")
			$("#stomaDetails")?.classList.toggle("hidden", !e.target.checked);
	});
	// GCS toggle buttons (both primary survey and neuro ROS use same delegation)
	document.addEventListener("click", (e) => {
		const toggle = e.target.closest(".gcs-toggle");
		if (toggle) {
			const prefix = toggle.dataset.gcsToggle;
			const panel = $("#" + prefix + "Panel");
			if (!panel) return;
			const open = !panel.classList.contains("hidden");
			panel.classList.toggle("hidden", open);
			toggle.textContent = (open ? "▸" : "▾") + " GCS Calculator";
		}
	});
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
		renderConveyanceSuggestion();
	});
	$("#conveyHospital")?.addEventListener("change", handleConveyanceDisplay);
	$("#conveyDepartment")?.addEventListener("change", handleConveyanceDisplay);
	$("#clearPainButton")?.addEventListener("click", clearPainAssessment);
	$("#clearBodyMapButton")?.addEventListener("click", clearBodyMap);
	[
		{ gridId: "painScoreGrid", inputId: "severity" },
		{ gridId: "painScoreWorstGrid", inputId: "severityWorst" },
	].forEach(({ gridId, inputId }) => {
		$$("#" + gridId + " .pain-score-btn").forEach((btn) => {
			btn.addEventListener("click", () => {
				const score = btn.dataset.score;
				const already = btn.classList.contains("selected");
				$$("#" + gridId + " .pain-score-btn").forEach((b) =>
					b.classList.remove("selected"),
				);
				if (!already) {
					btn.classList.add("selected");
					$("#" + inputId).value = `${score}/10`;
				} else {
					$("#" + inputId).value = "";
				}
			});
		});
	});
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
	// Show duration wrap when LOC chip is anything other than "No LOC"
	$("#headLOC")?.addEventListener("change", () => {
		const v = val("headLOC");
		$("#headLOCDurationWrap")?.classList.toggle("hidden", !v || v === "No LOC");
	});
	// Show retro duration wrap when retrograde amnesia is "Yes"
	$("#headRetrograde")?.addEventListener("change", () => {
		const v = val("headRetrograde");
		$("#headRetroDurationWrap")?.classList.toggle("hidden", v !== "Yes");
	});
	// GCS calculator — recalculate total whenever E, V, or M changes
	["headGcsE", "headGcsV", "headGcsM"].forEach((id) => {
		$("#" + id)?.addEventListener("change", () => {
			const e = parseInt(val("headGcsE")) || 0;
			const v = parseInt(val("headGcsV")) || 0;
			const m = parseInt(val("headGcsM")) || 0;
			const total = e + v + m;
			const hasAll = e && v && m;
			const display = $("#headGcsTotalDisplay");
			const valueEl = $("#headGcsTotalValue");
			if (hasAll && display && valueEl) {
				valueEl.textContent = total;
				valueEl.style.color = total < 15 ? "#c0392b" : "#1a7a3c";
				display.classList.remove("hidden");
			} else if (display) {
				display.classList.add("hidden");
			}
			if ($("#headGcsTotal")) $("#headGcsTotal").value = hasAll ? String(total) : "";
		});
	});
	$("#handoverFormat").addEventListener("change", () => {
		const fmt = $("#handoverFormat").value;
		const isLah = fmt === "Leave at Home";
		$("#handoverEtaWrap")?.classList.toggle("hidden", fmt !== "ASHICE");
		$("#incidentTimeWrap")?.classList.toggle("hidden", fmt !== "ATMIST");
		// For Leave at Home, the output section itself IS the document — no extra inputs needed
	});
	$("#generateOeButton").addEventListener("click", generateOe);
	$("#clearOeButton").addEventListener(
		"click",
		() => ($("#oeText").value = ""),
	);
	$("#refreshButton").addEventListener("click", generateOutput);
	$("#copyButton").addEventListener("click", copyOutput);

	// Observations
	$("#addObsBtn")?.addEventListener("click", () => {
		const set = createObsSet();
		$("#obsContainer")?.append(set);
		updateObsSetNumbers();
	});

	// Legal/capacity chips (treated & left)
	document.addEventListener("click", (e) => {
		const chip = e.target.closest(".legal-chip");
		if (chip) chip.classList.toggle("selected");
	});

	document.addEventListener("click", (event) => {
		const gcsBtn = event.target.closest(".gcs-btn");
		if (gcsBtn) {
			const { gcsPrefix, gcsField, gcsScore } = gcsBtn.dataset;
			// Deselect siblings, select this
			gcsBtn
				.closest(".gcs-btn-row")
				?.querySelectorAll(".gcs-btn")
				.forEach((b) => b.classList.remove("selected"));
			gcsBtn.classList.add("selected");
			// Store selection on a sentinel element keyed by field id
			let sentinel = $("#" + gcsField);
			if (!sentinel) {
				sentinel = document.createElement("span");
				sentinel.id = gcsField;
				sentinel.hidden = true;
				document.body.append(sentinel);
			}
			sentinel.dataset.gcsSelected = gcsScore;
			updateGcsTally(gcsPrefix);
			return;
		}

		const option = event.target.closest(".multi-group .square-btn");
		if (option) return toggleMulti(option);

		const abdoRegionBtn = event.target.closest(".abdo-region-btn");
		if (abdoRegionBtn) {
			const region = abdoRegionBtn.dataset.region;
			state.abdoActive = state.abdoActive === region ? null : region;
			renderAbdoGrid();
			return;
		}
		const abdoFindingChip = event.target.closest(".abdo-finding-chip");
		if (abdoFindingChip) {
			const region = state.abdoActive;
			if (!region) return;
			if (!state.abdoFindings[region]) state.abdoFindings[region] = new Set();
			const f = abdoFindingChip.dataset.finding;
			if (state.abdoFindings[region].has(f))
				state.abdoFindings[region].delete(f);
			else state.abdoFindings[region].add(f);
			renderAbdoGrid();
			return;
		}
		const abdoClearBtn = event.target.closest(".abdo-clear-btn");
		if (abdoClearBtn) {
			delete state.abdoFindings[abdoClearBtn.dataset.region];
			state.abdoActive = null;
			renderAbdoGrid();
			return;
		}

		const auscRegionBtn = event.target.closest(".ausc-region-btn");
		if (auscRegionBtn) {
			const region = auscRegionBtn.dataset.region;
			state.auscActive = state.auscActive === region ? null : region;
			renderAuscGrid();
			return;
		}
		const auscFindingChip = event.target.closest(".ausc-finding-chip");
		if (auscFindingChip) {
			const region = state.auscActive;
			if (!region) return;
			if (!state.auscFindings[region]) state.auscFindings[region] = new Set();
			const f = auscFindingChip.dataset.finding;
			if (state.auscFindings[region].has(f))
				state.auscFindings[region].delete(f);
			else state.auscFindings[region].add(f);
			renderAuscGrid();
			return;
		}
		const auscClearBtn = event.target.closest(".ausc-clear-btn");
		if (auscClearBtn) {
			delete state.auscFindings[auscClearBtn.dataset.region];
			state.auscActive = null;
			renderAuscGrid();
			return;
		}

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
		const injuryTypeBtn = event.target.closest("[data-injury-type]");
		if (injuryTypeBtn) {
			const v = injuryTypeBtn.dataset.injuryType;
			pendingInjuryTypes.has(v)
				? pendingInjuryTypes.delete(v)
				: pendingInjuryTypes.add(v);
			injuryTypeBtn.classList.toggle("selected", pendingInjuryTypes.has(v));
			if (v === "Other")
				$("#injuryTypeOtherWrap")?.classList.toggle(
					"hidden",
					!pendingInjuryTypes.has("Other"),
				);
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
			if (v === "Other")
				$("#injuryIntOtherWrap")?.classList.toggle(
					"hidden",
					!pendingInjuryInterventions.has("Other"),
				);
			return;
		}
		const removeInjury = event.target.closest("[data-remove-injury]");
		if (removeInjury)
			return removeInjuryEntry(Number(removeInjury.dataset.removeInjury));
		const szChip = event.target.closest("[data-sz-group]");
		if (szChip) {
			const map = {
				type: "seizureType",
				features: "seizureFeatures",
				findings: "seizureFindings",
				precipitants: "seizurePrecipitants",
				aed: "aedCompliance",
			};
			const set = state[map[szChip.dataset.szGroup]];
			if (!set) return;
			const v = szChip.dataset.szValue;
			set.has(v) ? set.delete(v) : set.add(v);
			szChip.classList.toggle("selected", set.has(v));
			return;
		}
		const mhChip = event.target.closest("[data-mh-group]");
		if (mhChip) {
			const map = {
				intent: "mhIntent",
				planning: "mhPlanning",
				odPrescribed: "odPrescribed",
				shMethod: "shMethod",
				shDepth: "shDepth",
				mseAppearance: "mseAppearance",
				mseBehaviour: "mseBehaviour",
				mseSpeech: "mseSpeech",
				mseThoughtContent: "mseThoughtContent",
				mseAffect: "mseAffect",
				mseThoughtForm: "mseThoughtForm",
				msePerception: "msePerception",
				mseInsight: "mseInsight",
			};
			const set = state[map[mhChip.dataset.mhGroup]];
			if (!set) return;
			const v = mhChip.dataset.mhValue;
			set.has(v) ? set.delete(v) : set.add(v);
			mhChip.classList.toggle("selected", set.has(v));
			return;
		}
		const sgChip = event.target.closest("[data-sg-group]");
		if (sgChip) {
			const v = sgChip.dataset.sgValue;
			if (v === "None identified on scene") {
				state.safeguardingConcerns.clear();
				state.safeguardingConcerns.add(v);
			} else {
				state.safeguardingConcerns.delete("None identified on scene");
				state.safeguardingConcerns.has(v)
					? state.safeguardingConcerns.delete(v)
					: state.safeguardingConcerns.add(v);
			}
			$$("[data-sg-group]").forEach((b) =>
				b.classList.toggle(
					"selected",
					state.safeguardingConcerns.has(b.dataset.sgValue),
				),
			);
			const hasConcerns =
				state.safeguardingConcerns.size > 0 &&
				!state.safeguardingConcerns.has("None identified on scene");
			$("#safeguardingDetailWrap")?.classList.toggle("hidden", !hasConcerns);
			renderConveyanceSuggestion();
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
		const repeatDrug = event.target.closest("[data-repeat-drug]");
		if (repeatDrug)
			return repeatDrugEntry(Number(repeatDrug.dataset.repeatDrug));
		const removeChange = event.target.closest("[data-remove-change]");
		if (removeChange)
			return removeChangeEntry(Number(removeChange.dataset.removeChange));
		const ecgFinding = event.target.closest(".ecg-finding");
		if (ecgFinding) return toggleEcgFinding(ecgFinding);
		const ecgLead = event.target.closest(".ecg-lead");
		if (ecgLead) return toggleEcgLead(ecgLead);
		const copySectionBtn = event.target.closest("[data-copy-section]");
		if (copySectionBtn)
			return copySectionById(copySectionBtn.dataset.copySection);
	});
}

// UI INTERACTION HANDLERS
// Business logic for toggling chips, switching tabs, body-map interaction,
// conveyance decisions, and other stateful UI updates.

// Tracks injury types and interventions being built before they are committed.
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
	const wrapIds = {
		character: "characterOtherWrap",
		associated: "associatedOtherWrap",
		exacerbating: "exacerbatingOtherWrap",
		relieving: "relievingOtherWrap",
		fallsSymptoms: "fallsSymptomsOtherWrap",
		fallsLocation: "fallsLocationOtherWrap",
		fallsActivity: "fallsActivityOtherWrap",
	};
	const wrapId = wrapIds[stateKey];
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
	if (next === "abnormal") {
		syncDisabilityLinks(button);
		// Uncheck "No immediate ABC concerns" and "Normal presentation" on arrival
		const noAbc = $("#oaNoABC");
		if (noAbc) noAbc.checked = false;
		const normPres = $("#oaNormalPresentation");
		if (normPres) normPres.checked = false;
	} else {
		// Re-check if all chips are back to normal
		const allNormal = !$$("[data-abc]").some(
			(b) => b.dataset.abcState === "abnormal",
		);
		if (allNormal) {
			const noAbc = $("#oaNoABC");
			if (noAbc) noAbc.checked = true;
			const normPres = $("#oaNormalPresentation");
			if (normPres) normPres.checked = true;
		}
	}
	// Show/hide pale-or-flushed picker when colour chip toggled
	if (button.dataset.normal === "Good colour") {
		const wrap = $("#colourDetailWrap");
		if (wrap) {
			wrap.classList.toggle("hidden", next === "normal");
			if (next === "normal") {
				const hidden = $("#colourDetail");
				if (hidden) hidden.value = "";
				wrap
					.querySelectorAll("[data-value]")
					.forEach((c) => c.classList.remove("selected"));
			}
		}
	}
	// Show/hide tachycardic/bradycardic picker when rate chip toggled
	if (button.dataset.normal === "Normal Rate") {
		const wrap = $("#hrRateDetailWrap");
		if (wrap) {
			wrap.classList.toggle("hidden", next === "normal");
			if (next === "normal") {
				const hidden = $("#hrRateDetail");
				if (hidden) hidden.value = "";
				wrap
					.querySelectorAll("[data-value]")
					.forEach((c) => c.classList.remove("selected"));
			}
		}
	}
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
	const next = isAbnormal ? "normal" : "abnormal";
	state.ros[button.dataset.stateId] = next;
	button.classList.toggle("abnormal", !isAbnormal);
	button.classList.toggle("selected", isAbnormal);
	button.textContent = isAbnormal
		? button.dataset.normal
		: button.dataset.abnormal;
	updateRosBadge(button.dataset.section);

	// Show/hide breathing rate detail picker (tachypnoea / bradypnoea / apnoea)
	if (button.dataset.stateId === "resp_breathingRate") {
		const wrap = $("#rrDetailWrap");
		if (wrap) {
			wrap.classList.toggle("hidden", next === "normal");
			if (next === "normal") {
				const hidden = $("#rrDetail");
				if (hidden) hidden.value = "";
				wrap
					.querySelectorAll("[data-value]")
					.forEach((c) => c.classList.remove("selected"));
			}
		}
	}
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
	const lacksCapacity = status === "Lacks capacity";
	$("#lacksCapReasons")?.classList.toggle("hidden", !lacksCapacity);
	$("#bestInterests").classList.toggle("hidden", !lacksCapacity);
}

function getSelectedParts(set) {
	return [...set]
		.map((id) => $(`#${CSS.escape(id)}`)?.dataset.label || id)
		.join(", ");
}

function rosLine(section) {
	return (
		ROS[section].items
			.map(([id, normal, abnormal]) => {
				if (state.ros[`${section}_${id}`] !== "abnormal") return normal;
				// Substitute specific detail values when a sub-selection has been made
				if (section === "resp" && id === "breathingRate") {
					const detail = val("rrDetail");
					if (detail) return detail;
				}
				return abnormal;
			})
			.join(". ") + "."
	);
}

function abcChipText(button) {
	// Substitute colour detail if "Pale / flushed" and a sub-selection has been made
	if (
		button.dataset.normal === "Good colour" &&
		button.dataset.abcState === "abnormal"
	) {
		const detail = val("colourDetail");
		if (detail) return detail;
	}
	// Substitute rate detail if "Tachycardic / Bradycardic" and a sub-selection has been made
	if (
		button.dataset.normal === "Normal Rate" &&
		button.dataset.abcState === "abnormal"
	) {
		const detail = val("hrRateDetail");
		if (detail) return detail;
	}
	return button.textContent;
}

function abcLine(section) {
	const values = $$(`[data-abc="${section.key}"]`).map(abcChipText);
	const vitals = (section.vitals || [])
		.map(([id, label]) => (val(id) ? `${label}: ${val(id)}` : null))
		.filter(Boolean);
	const notes = val(section.notes);
	return `${section.key} - ${[...values, ...vitals, notes].filter(Boolean).join(", ") || "assessed"}.`;
}

function abcCompactLine(section) {
	const abnormals = $$(`[data-abc="${section.key}"]`)
		.filter((b) => b.dataset.abcState === "abnormal")
		.map(abcChipText);
	const notes = val(section.notes);
	const all = [...abnormals, notes].filter(Boolean);
	if (!all.length) return null;
	return `${section.key} — ${all.join(", ")}.`;
}

function abcHandoverSummary() {
	const lines = ABCDE.map(abcCompactLine).filter(Boolean);
	return lines.length ? lines.join("\n") : "No ABCDE concerns identified.";
}

// TEXT BUILDERS — CLINICAL OUTPUT (ADULT)
// Functions that read current state and produce plain-text strings for each
// output section.  All builders return "" when their section has no data.

function toggleEcgFinding(btn) {
	const finding = btn.dataset.finding;
	if (finding === "Not performed") {
		// Selecting "Not performed" clears everything else
		state.ecgFindings.clear();
		state.ecgFindings.add("Not performed");
		$$(".ecg-finding").forEach((b) =>
			b.classList.toggle("selected", b.dataset.finding === "Not performed"),
		);
	} else {
		// Deselect "Not performed" if switching to a real finding
		if (state.ecgFindings.has("Not performed")) {
			state.ecgFindings.delete("Not performed");
			$(".ecg-finding[data-finding='Not performed']")?.classList.remove(
				"selected",
			);
		}
		if (state.ecgFindings.has(finding)) {
			state.ecgFindings.delete(finding);
			btn.classList.remove("selected");
		} else {
			state.ecgFindings.add(finding);
			btn.classList.add("selected");
		}
	}
	const hasLeadFinding = [...state.ecgFindings].some((f) =>
		ECG_LEAD_FINDINGS.has(f),
	);
	$("#ecgLeadPanel")?.classList.toggle("hidden", !hasLeadFinding);
	if (!hasLeadFinding) {
		state.ecgLeads.clear();
		$$(".ecg-lead").forEach((b) => b.classList.remove("selected"));
	}
}

function toggleEcgLead(btn) {
	const lead = btn.dataset.lead;
	if (state.ecgLeads.has(lead)) {
		state.ecgLeads.delete(lead);
		btn.classList.remove("selected");
	} else {
		state.ecgLeads.add(lead);
		btn.classList.add("selected");
	}
}

function buildEcgText() {
	if (!state.ecgFindings.size) return "";
	const leadFindings = [...state.ecgFindings].filter((f) =>
		ECG_LEAD_FINDINGS.has(f),
	);
	const otherFindings = [...state.ecgFindings].filter(
		(f) => !ECG_LEAD_FINDINGS.has(f),
	);
	const parts = [...otherFindings];
	if (leadFindings.length && state.ecgLeads.size) {
		const leads = [...state.ecgLeads].join(", ");
		parts.push(...leadFindings.map((f) => `${f} (leads: ${leads})`));
	} else if (leadFindings.length) {
		parts.push(...leadFindings);
	}
	return `ECG: ${parts.join("; ")}.`;
}

function generateOe() {
	syncAuscultationOutput();
	const oe = [
		"OE:",
		"",
		ABCDE.map(abcLine).join("\n"),
		"",
		`Resp: ${rosLine("resp")} ${val("respAus") ? `Auscultation: ${val("respAus")}.` : ""}`,
		`CVS: ${rosLine("cvs")} ${buildEcgText()}`,
		`Neuro: ${rosLine("neuro")}`,
		`Abdo/GI: ${rosLine("gi")} ${[
			Object.entries(state.abdoFindings).filter(([, f]) => f.size > 0).length
				? `Palpation: ${Object.entries(state.abdoFindings)
						.filter(([, f]) => f.size > 0)
						.map(([r, f]) => `${r} — ${[...f].join(", ")}`)
						.join("; ")}.`
				: "",
			val("giFluidIntake") ? `Fluid intake: ${val("giFluidIntake")}.` : "",
			val("giAppetite") ? `Appetite: ${val("giAppetite")}.` : "",
			val("bowelSounds") ? `Bowel sounds: ${val("bowelSounds")}.` : "",
		]
			.filter(Boolean)
			.join(" ")}`.trimEnd(),
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
			`${val("coughType")}${val("sputumDesc") ? ` — sputum: ${val("sputumDesc")}` : ""}. ${val("respAus") ? `Auscultation: ${val("respAus")}.` : ""} ${val("respNotes")}`.trim(),
		cvs: () =>
			`${val("bpStatus")}. ${buildEcgText()} ${val("cvsNotes")}`.trim(),
		gi: () => {
			const parts = [];
			const abdoEntries = Object.entries(state.abdoFindings).filter(
				([, f]) => f.size > 0,
			);
			if (abdoEntries.length)
				parts.push(
					`Palpation: ${abdoEntries.map(([r, f]) => `${r} — ${[...f].join(", ")}`).join("; ")}.`,
				);
			if (val("giFluidIntake"))
				parts.push(`Fluid intake: ${val("giFluidIntake")}.`);
			if (val("giAppetite")) parts.push(`Appetite: ${val("giAppetite")}.`);
			if (val("bowelSounds"))
				parts.push(`Bowel sounds: ${val("bowelSounds")}.`);
			if (val("giNotes")) parts.push(val("giNotes"));
			if (isChecked("stomaPresent")) {
				const type = val("stomaType");
				const out = val("stomaOutput");
				const app = val("stomaAppearance");
				parts.push(
					`Stoma present${type ? ` (${type})` : ""}.${out ? ` Output: ${out}.` : ""}${app ? ` Appearance: ${app}.` : ""}`,
				);
			}
			return parts.join(" ");
		},
		urine: () => {
			const parts = [];
			if (isChecked("catheterPresent")) {
				const out = val("catheterOutput");
				const app = val("urineAppearance");
				parts.push(
					`Urinary catheter in situ.${out ? ` Output: ${out}.` : ""}${app ? ` Appearance: ${app}.` : ""}`,
				);
			}
			if (val("urineNotes")) parts.push(val("urineNotes"));
			return parts.join(" ");
		},
		psych: () => {
			const parts = [];
			if (val("psychBehaviour"))
				parts.push(`Appearance/behaviour: ${val("psychBehaviour")}.`);
			if (val("psychSpeech")) parts.push(`Speech: ${val("psychSpeech")}.`);
			if (val("psychRisk")) parts.push(`Risk level: ${val("psychRisk")}.`);
			if (val("psychProtective"))
				parts.push(`Protective factors: ${val("psychProtective")}.`);
			if (val("psychNotes")) parts.push(val("psychNotes"));
			return parts.join(" ");
		},
	};
	return `${rosLine(section)} ${extras[section]?.() || val(`${section}Notes`) || ""}`.trim();
}

// --- Handover document builders ---

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
			`I — Illness/Injury: ${pc}${val("onsetType") ? `. Onset: ${val("onsetType")}${onsetTime() ? `, ${onsetTime()}` : ""}${onsetClockSuffix()}` : ""}.`,
			`C — Condition: ${vitalsLine}.`,
			`E — ETA: ${val("handoverEta") || "Not given"}`,
			...(extraNotes ? ["", extraNotes] : []),
		].join("\n");
	}

	if (format === "SBAR") {
		return [
			`S — Situation: ${pt ? pt + " " : ""}presenting with ${pc.toLowerCase()}${hpc ? `. ${hpc}` : ""}.`,
			`B — Background: PMH: ${pmh}. Medications: ${meds}. Allergies: ${allergies}.`,
			`A — Assessment:\n${abcHandoverSummary()}`,
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

	if (format === "Leave at Home") {
		return buildLahSbarText();
	}

	return "";
}

// --- Leave at Home SBAR document ---

function buildLahSbarText() {
	const div = "─".repeat(44);
	const age = val("ptAge");
	const sex = val("ptSex");
	const pc = getPc();
	const decision = val("conveyanceDecision");

	// ── SITUATION ──────────────────────────────────────────
	const ptLine = [age ? `${age} years` : null, sex || null]
		.filter(Boolean)
		.join(", ");
	const hpcCaller = val("hpcCaller");
	const hpcCat = val("hpcCategory");
	const hpcCatWord = hpcCat === "C4" ? "generated" : "dispatched";
	const callLine =
		hpcCaller && hpcCat
			? `${hpcCaller}, ${hpcCat} ${hpcCatWord}`
			: hpcCaller || (hpcCat ? `${hpcCat} ${hpcCatWord}` : "");
	const situation = [
		ptLine ? `Patient: ${ptLine}` : "Patient: Demographics not recorded",
		`Presenting complaint: ${pc}`,
		callLine
			? `Call summary: ${[val("hpcEvents"), callLine].filter(Boolean).join(". ")}`
			: val("hpcEvents") || null,
	]
		.filter(Boolean)
		.join("\n");

	// ── BACKGROUND ─────────────────────────────────────────
	const pmh = isChecked("noPmh")
		? "No significant PMH"
		: val("pmh") || "Not documented";
	const meds = isChecked("noMeds")
		? "No regular medications"
		: val("medications") || "Not documented";
	const allergies = isChecked("nkda")
		? "NKDA"
		: val("allergies") || "Not documented";
	const loi = [val("loiWhat"), val("loiTime")].filter(Boolean).join(" at ");
	const background = [
		`PMH: ${pmh}`,
		`Medications: ${meds}`,
		`Allergies: ${allergies}`,
		loi ? `Last oral intake: ${loi}` : null,
		val("prevDetails") ? `Previous episodes: ${val("prevDetails")}` : null,
	]
		.filter(Boolean)
		.join("\n");

	// ── ASSESSMENT ─────────────────────────────────────────
	const assessParts = [];

	// Observations
	const obsText = buildObsText();
	if (obsText) {
		assessParts.push(
			`Observations:\n${obsText
				.split("\n")
				.map((l) => `  ${l}`)
				.join("\n")}`,
		);
	}

	// Primary survey (ABCDE) — abnormals only
	const abcSummary = abcHandoverSummary();
	if (abcSummary && abcSummary !== "No ABCDE concerns identified.") {
		assessParts.push(
			`Primary survey:\n  ${abcSummary.split("\n").join("\n  ")}`,
		);
	} else {
		assessParts.push("Primary survey: No ABCDE concerns identified.");
	}

	// ECG
	syncAuscultationOutput();
	const ecgText = buildEcgText();
	if (ecgText) assessParts.push(ecgText);

	// Auscultation
	const aus = val("respAus");
	if (aus) assessParts.push(`Auscultation: ${aus}`);

	// PC-specific assessment tools
	const pcSel = val("pcSelect");
	if (pcSel === "Fall") {
		assessParts.push(
			`Falls assessment (SPLATT):\n  ${buildFallsText().split("\n").join("\n  ")}`,
		);
	} else if (pcSel === "Head injury") {
		assessParts.push(
			`Head injury assessment (NICE CG176):\n  ${buildHeadInjuryText().split("\n").join("\n  ")}`,
		);
	} else if (pcSel === "Seizure") {
		assessParts.push(
			`Seizure assessment:\n  ${buildSeizureText().split("\n").join("\n  ")}`,
		);
	} else if (MH_PCS.includes(pcSel)) {
		assessParts.push(
			`Mental health assessment (MSE):\n  ${buildMhAssessmentText().split("\n").join("\n  ")}`,
		);
	}

	// SOCRATES pain assessment (if not hidden)
	if (!isChecked("noPain")) {
		const site = getSelectedParts(state.siteParts);
		const socratesParts = [
			site ? `Site: ${site}` : null,
			val("onsetType")
				? `Onset: ${val("onsetType")}${onsetTime() ? `, ${onsetTime()}${onsetClockSuffix()}` : ""}${val("onsetDuration") ? `, duration ${val("onsetDuration")}` : ""}`
				: null,
			state.character.size || val("characterOther")
				? `Character: ${listFactors(state.character, "characterOther", "Not characterised")}`
				: null,

			state.associated.size || val("associatedOther")
				? `Associated: ${listFactors(state.associated, "associatedOther", "None reported")}`
				: null,
			val("severity")
				? `Severity: ${val("severity")}/10 now${val("severityWorst") ? `, ${val("severityWorst")}/10 at worst` : ""}`
				: null,
			`Exacerbating: ${listFactors(state.exacerbating, "exacerbatingOther", "None identified")}`,
			`Relieving: ${listFactors(state.relieving, "relievingOther", "None identified")}`,
		]
			.filter(Boolean)
			.join("; ");
		if (socratesParts)
			assessParts.push(`Pain assessment (SOCRATES): ${socratesParts}`);
	}

	// ROS abnormals (only include if user documented something)
	["resp", "cvs", "neuro", "gi", "urine", "integ", "msk", "psych"].forEach(
		(section) => {
			const block = rosBlock(section);
			if (
				block &&
				!block.match(/^(Not auscultated|No cough)/) &&
				block.trim() !== ""
			) {
				const sectionNames = {
					resp: "Respiratory",
					cvs: "Cardiovascular",
					neuro: "Neurological",
					gi: "Gastrointestinal",
					urine: "Urinary",
					integ: "Integumentary",
					msk: "Musculoskeletal",
					psych: "Mental health",
				};
				assessParts.push(`${sectionNames[section]}: ${block}`);
			}
		},
	);

	// On examination (free text)
	if (val("oeText")) assessParts.push(`On examination: ${val("oeText")}`);

	// Treatment given
	const hasTx =
		state.airwayInterventions.size ||
		state.ivEntries.length ||
		state.drugEntries.length ||
		state.woundInterventions.size ||
		state.manualHandling.size ||
		val("otherInterventionsFree") ||
		val("treatmentNotes");
	if (hasTx) {
		assessParts.push(
			`Treatments/interventions:\n  ${buildTreatmentText().split("\n").join("\n  ")}`,
		);
	}

	// Mental capacity
	const capacity = buildCapacityText();
	if (capacity && capacity !== "Not applicable.") {
		assessParts.push(`Mental capacity: ${capacity}`);
	}

	const assessment = assessParts.join("\n");

	// ── RECOMMENDATION ─────────────────────────────────────
	const referrals = listSet(state.referrals, "none");
	const followUp = val("followUp");
	const checks = [
		isChecked("riskExplained") && "risks explained",
		isChecked("alternativesDiscussed") && "alternatives discussed",
		isChecked("understandsRisk") && "patient understands risks",
		isChecked("canRecontact") && "advised they can recontact 999/111",
	]
		.filter(Boolean)
		.join("; ");
	const legalChips = $$(".legal-chip.selected").map((c) => {
		const map = {
			ehcp: "EHCP consulted",
			lpa: "LPA consulted",
			"advance-decision": "Advance decision reviewed",
			"family-carer": "Family/carer agreement obtained",
		};
		return map[c.dataset.legal] || c.dataset.legal;
	});
	const legalDetail = val("legalConsiderationsDetail");
	const recommendation = [
		`Decision: ${decision}`,
		referrals !== "none" ? `Referred / signposted to: ${referrals}` : null,
		followUp ? `Follow-up arrangements: ${followUp}` : null,
		checks ? `Safety netting: ${checks}` : null,
		legalChips.length
			? `Legal / capacity: ${legalChips.join(", ")}${legalDetail ? ". " + legalDetail : ""}`
			: legalDetail
				? `Legal / capacity notes: ${legalDetail}`
				: null,
	]
		.filter(Boolean)
		.join("\n");

	// ── ADDITIONAL INFORMATION ─────────────────────────────
	const addlParts = [];
	const worsening = buildWorseningText();
	if (worsening && !worsening.toLowerCase().includes("not applicable")) {
		addlParts.push(
			`Worsening advice:\n  ${worsening.split("\n").join("\n  ")}`,
		);
	}
	const sg = buildSafeguardingText();
	if (sg) addlParts.push(`Safeguarding: ${sg}`);
	if (val("conveyanceNotes")) addlParts.push(val("conveyanceNotes"));
	if (val("handoverNotes")) addlParts.push(val("handoverNotes"));
	if (state.clinicalChanges.length) {
		addlParts.push(
			`Clinical changes:\n  ${buildChangesText().split("\n").join("\n  ")}`,
		);
	}

	return [
		`SITUATION\n${situation}`,
		`BACKGROUND\n${background}`,
		`ASSESSMENT\n${assessment || "No specific findings documented."}`,
		`RECOMMENDATION\n${recommendation}`,
		...(addlParts.length
			? [`ADDITIONAL INFORMATION\n${addlParts.join("\n")}`]
			: []),
	].join(`\n\n${div}\n\n`);
}

// --- Specialist assessment text builders ---

function getNiceCTCriteria() {
	const criteria = [];
	const gcsTotal = parseInt(val("headGcsTotal")) || 0;
	if (gcsTotal > 0 && gcsTotal < 15)
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
		val("headRetrograde") === "Yes" &&
		val("headRetroDuration") === "> 30 minutes"
	)
		criteria.push("retrograde amnesia > 30 minutes");
	if (val("headAnticoag") === "Yes")
		criteria.push("on anticoagulants — CT within 8 hours");
	return criteria;
}

function buildHeadInjuryText() {
	const mechanism = listSet(state.headMechanism, "Not documented");
	const detail = val("headMechanismDetail");
	const mechanismLine = `Mechanism: ${[mechanism, detail].filter(Boolean).join(" — ")}.`;

	const locVal = val("headLOC");
	const locLine =
		locVal && locVal !== "No LOC"
			? `LOC: ${locVal}. Duration: ${val("headLOCDuration") || "unknown"}.`
			: "LOC: Not reported.";

	const amnesiaLines = [
		val("headRetrograde") === "Yes"
			? `Retrograde amnesia: Yes. Duration: ${val("headRetroDuration") || "unknown"}.`
			: val("headRetrograde")
				? `Retrograde amnesia: ${val("headRetrograde")}.`
				: "Retrograde amnesia: Not assessed.",
		val("headAnterograde") === "Yes"
			? "Anterograde amnesia: Yes."
			: val("headAnterograde")
				? `Anterograde amnesia: ${val("headAnterograde")}.`
				: "",
	]
		.filter(Boolean)
		.join(" ");

	const vomitSuffix =
		state.headSymptoms.has("Vomiting") && val("headVomitingCount")
			? ` (${val("headVomitingCount")})`
			: "";
	const symptomsLine = `Symptoms: ${listSet(state.headSymptoms, "None reported")}${vomitSuffix}.`;

	const gcsE = val("headGcsE"), gcsV = val("headGcsV"), gcsM = val("headGcsM");
	const gcsTotal = parseInt(val("headGcsTotal")) || 0;
	const gcsSuffix = gcsTotal
		? ` GCS ${gcsTotal}/15 (E${gcsE} V${gcsV} M${gcsM}).`
		: "";
	const anticoagSuffix = val("headAnticoag") === "Yes" ? " On anticoagulants." : "";
	const signsLine = `Clinical findings: ${listSet(state.headSigns, "None identified")}.${gcsSuffix}${anticoagSuffix}`;

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
	const symptoms = listFactors(
		state.fallsSymptoms,
		"fallsSymptomsOther",
		"Not Documented",
	);
	const loc = listFactors(
		state.fallsLocation,
		"fallsLocationOther",
		"Not documented",
	);
	const surface = val("fallsSurface");
	const activity = listFactors(
		state.fallsActivity,
		"fallsActivityOther",
		"Not documented",
	);
	const timeUnknown = $("#fallsTimeUnknownBtn")?.classList.contains("selected");
	const time = timeUnknown
		? "Unknown time"
		: val("fallsTime")
			? val("fallsTime")
			: "Not documented";
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
		`S — Symptoms: ${symptoms}. ${val("fallsLOC") ? `${val("fallsLOC")}.` : ""} ${val("fallsWitnessed") ? `${val("fallsWitnessed")}.` : ""}`.trim(),
		`P — Previous falls: ${prevCount}.${isChecked("fallsPreviousInjury") ? " Previous fall-related injury." : ""}`,
		`L — Location: ${locLine}.`,
		`A — Activity: ${activity}.`,
		`T — Time: ${time}. On floor: ${lieTime}.${longLie ? " Long lie." : ""}`,
		`T — Trauma: ${injuries}.${val("fallsAnticoag") ? ` ${val("fallsAnticoag")}.` : ""}`,
		...(val("fallsNotes") ? [`Notes: ${val("fallsNotes")}`] : []),
	].join("\n");
}

// OUTPUT GENERATION
// Assembles all section text builders into an ordered list of sections,
// renders them as copyable cards, and manages the clipboard helpers.

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
			? [
					{
						id: "seizure",
						title: "SEIZURE ASSESSMENT",
						body: buildSeizureText(),
					},
				]
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
			body: `PMH: ${isChecked("noPmh") ? "No significant past medical history" : val("pmh") || "Not documented"}\nMedications: ${isChecked("noMeds") ? "No regular medications" : val("medications") || "Not documented"}\nAllergies: ${isChecked("nkda") ? "NKDA" : val("allergies") || "Not documented"}\nLast oral intake: ${[val("loiWhat"), val("loiTime")].filter(Boolean).join(" at ") || "Not documented"}\nPrevious episodes: ${val("prevDetails") || "Not documented"}`,
		},
		...(() => {
			const card = $("#gynaeCard");
			if (!card || card.classList.contains("hidden")) return [];
			return [
				{
					id: "gynae",
					title: "OBSTETRIC / GYNAECOLOGICAL",
					body: buildGynaeOutput(),
				},
			];
		})(),
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
						`Onset: ${val("onsetType") || "Not documented"}${onsetTime() ? `, ${onsetTime()}${onsetClockSuffix()}` : ""}${val("onsetDuration") ? `, duration ${val("onsetDuration")}` : ""}`,
						`Associated symptoms: ${listFactors(state.associated, "associatedOther", "None reported")}`,
						`Timing: ${val("timingSelect") || "Not documented"}`,
						`Exacerbating factors: ${listFactors(state.exacerbating, "exacerbatingOther", "None identified")}`,
						`Relieving factors: ${listFactors(state.relieving, "relievingOther", "None identified")}`,
						`Severity: ${[val("severity") ? `${val("severity")} now` : null, val("severityWorst") ? `${val("severityWorst")} at worst` : null].filter(Boolean).join(", ") || "Not documented"}`,
					].join("\n")
				: [
						`Site: ${site}`,
						`Onset: ${val("onsetType") || "Not documented"}${onsetTime() ? `, ${onsetTime()}${onsetClockSuffix()}` : ""}${val("onsetDuration") ? `, duration ${val("onsetDuration")}` : ""}`,
						`Character: ${listFactors(state.character, "characterOther", "Not characterised")}`,
						`Radiation: ${radiation}`,
						`Associated symptoms: ${listFactors(state.associated, "associatedOther", "None reported")}`,
						`Timing: ${val("timingSelect") || "Not documented"}`,
						`Exacerbating factors: ${listFactors(state.exacerbating, "exacerbatingOther", "None identified")}`,
						`Relieving factors: ${listFactors(state.relieving, "relievingOther", "None identified")}`,
						`Severity: ${[val("severity") ? `${val("severity")} now` : null, val("severityWorst") ? `${val("severityWorst")} at worst` : null].filter(Boolean).join(", ") || "Not documented"}`,
					].join("\n"),
		},
		...(() => {
			const obs = buildObsText();
			return obs ? [{ id: "obs", title: "OBSERVATIONS", body: obs }] : [];
		})(),
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
				val("otherInterventionsFree") ||
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
			const hasChanges = state.clinicalChanges.length || val("additionalInfo");
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
		...(val("conveyanceDecision") !== "Conveyed"
			? [
					{
						id: "worsening",
						title: "PLAN — WORSENING ADVICE",
						body: worseningText,
					},
				]
			: []),
		{
			id: "conveyance",
			title: "PLAN — CONVEYANCE DECISION",
			body: buildConveyanceText(),
		},
		...(() => {
			const sg = buildSafeguardingText();
			return sg
				? [{ id: "safeguarding", title: "SCENE & SAFEGUARDING", body: sg }]
				: [];
		})(),
		{
			id: "handover",
			title:
				val("handoverFormat") === "Leave at Home"
					? "LEAVE AT HOME — SBAR"
					: `HANDOVER — ${val("handoverFormat") || "ASHICE"}`,
			body: buildHandoverText(),
		},
		...(() => {
			const dept = val("conveyDepartment");
			const isEd =
				dept.toLowerCase().includes("ed") ||
				dept.toLowerCase().includes("emergency");
			return val("conveyanceDecision") === "Conveyed" && isEd
				? [
						{
							id: "ed-handover",
							title: "ED HANDOVER",
							body: buildEdHandoverText(),
						},
					]
				: [];
		})(),
	];
}

// OBSERVATIONS & NEWS2
// Supports multiple timed observation sets. Each set auto-calculates a NEWS2
// score.  GCS within each obs set uses the shared buildGcsCalcHTML() helper
// with a unique prefix to avoid ID collisions with the primary survey GCS.

// Monotonically increasing counter ensures each obs set gets a unique prefix.
let obsCounter = 0;

function newsScore(rr, spo2, o2On, sbp, hr, temp, avpu) {
	let score = 0;
	let hasThree = false;
	const add = (s) => {
		score += s;
		if (s === 3) hasThree = true;
	};

	if (!isNaN(rr))
		add(rr <= 8 ? 3 : rr <= 11 ? 1 : rr <= 20 ? 0 : rr <= 24 ? 2 : 3);
	if (!isNaN(spo2)) add(spo2 <= 91 ? 3 : spo2 <= 93 ? 2 : spo2 <= 95 ? 1 : 0);
	if (o2On) add(2);
	if (!isNaN(sbp))
		add(sbp <= 90 ? 3 : sbp <= 100 ? 2 : sbp <= 110 ? 1 : sbp <= 219 ? 0 : 3);
	if (!isNaN(hr))
		add(
			hr <= 40
				? 3
				: hr <= 50
					? 1
					: hr <= 90
						? 0
						: hr <= 110
							? 1
							: hr <= 130
								? 2
								: 3,
		);
	if (!isNaN(temp))
		add(
			temp <= 35.0
				? 3
				: temp <= 36.0
					? 1
					: temp <= 38.0
						? 0
						: temp <= 39.0
							? 1
							: 2,
		);
	if (avpu && avpu !== "A") add(3);

	const risk = score >= 7 ? "HIGH" : score >= 5 || hasThree ? "MEDIUM" : "LOW";
	return { score, risk, hasThree };
}

function updateNews2(setEl) {
	const n = (field) => {
		const v = parseFloat(
			setEl.querySelector(`[data-obs-field="${field}"]`)?.value,
		);
		return isNaN(v) ? NaN : v;
	};
	const chip = (key) =>
		setEl.querySelector(`[data-obs-key="${key}"].selected`)?.dataset.obsVal;

	const rr = n("rr"),
		spo2 = n("spo2"),
		sbp = n("sbp"),
		hr = n("hr"),
		temp = n("temp");
	const o2On = chip("o2") === "Supplemental";
	const avpu = chip("avpu");

	const anyEntered = [rr, spo2, sbp, hr, temp].some((v) => !isNaN(v)) || avpu;
	const scoreEl = setEl.querySelector(".news2-score");
	const riskEl = setEl.querySelector(".news2-risk");
	const badgeEl = setEl.querySelector(".obs-news2");

	if (!anyEntered) {
		if (scoreEl) scoreEl.textContent = "–";
		if (riskEl) {
			riskEl.textContent = "";
			riskEl.className = "news2-risk";
		}
		if (badgeEl) badgeEl.className = "obs-news2";
		return;
	}

	const { score, risk } = newsScore(rr, spo2, o2On, sbp, hr, temp, avpu);
	if (scoreEl) scoreEl.textContent = score;
	const riskClass =
		risk === "HIGH"
			? "news2-high"
			: risk === "MEDIUM"
				? "news2-medium"
				: "news2-low";
	if (riskEl) {
		riskEl.textContent = risk;
		riskEl.className = `news2-risk ${riskClass}`;
	}
	if (badgeEl) badgeEl.className = `obs-news2 obs-news2--${risk.toLowerCase()}`;
}

function createObsSet() {
	const idx = obsCounter++;
	const gcsPfx = `obsGcs${idx}`;
	const now = new Date();
	const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

	// Build radio chip row using app's standard radio-chip class
	const chips = (key, options) =>
		`<div class="radio-chip-group" style="flex-wrap:wrap;gap:6px;margin-top:4px">` +
		options
			.map(
				([v, l]) =>
					`<button type="button" class="radio-chip" data-obs-key="${key}" data-obs-val="${v}">${l}</button>`,
			)
			.join("") +
		`</div>`;

	const div = document.createElement("div");
	div.className = "obs-set";
	div.dataset.obsIdx = idx;

	div.innerHTML = `
		<div class="obs-set-head">
			<span class="obs-set-label">Obs set</span>
			<input type="time" data-obs-field="time" value="${timeStr}" />
			<button type="button" class="obs-remove">Remove</button>
		</div>

		<div class="obs-vitals-grid">
			<div class="obs-field">
				<label class="obs-label">RR (bpm)</label>
				<input type="number" min="0" max="80" data-obs-field="rr" placeholder="—" />
			</div>
			<div class="obs-field">
				<label class="obs-label">SpO₂ (%)</label>
				<input type="number" min="50" max="100" data-obs-field="spo2" placeholder="—" />
			</div>
			<div class="obs-field">
				<label class="obs-label">Temp (°C)</label>
				<input type="number" min="25" max="45" step="0.1" data-obs-field="temp" placeholder="—" />
			</div>
			<div class="obs-field">
				<label class="obs-label">BM (mmol/L)</label>
				<input type="number" min="0" max="50" step="0.1" data-obs-field="bm" placeholder="—" />
			</div>
			<div class="obs-field">
				<label class="obs-label">Ketones (mmol/L)</label>
				<input type="number" min="0" max="20" step="0.1" data-obs-field="ketones" placeholder="—" />
			</div>
		</div>

		<div class="obs-row-group">
			<label class="obs-label">O₂</label>
			<div class="obs-inline-row">
				${chips("o2", [
					["Air", "Air"],
					["Supplemental", "Supplemental O₂"],
				])}
				<input type="number" min="1" max="15" step="0.5" data-obs-field="o2Flow"
					placeholder="L/min" class="obs-o2-flow hidden" style="width:80px;margin-top:4px" />
			</div>
		</div>

		<div class="obs-row-group">
			<label class="obs-label">HR (bpm)</label>
			<div class="obs-inline-row">
				<input type="number" min="0" max="300" data-obs-field="hr"
					placeholder="—" style="width:90px" />
				${chips("hrRhythm", [
					["Regular", "Regular"],
					["Irregular", "Irregular"],
				])}
			</div>
		</div>

		<div class="obs-row-group">
			<label class="obs-label">BP (mmHg)</label>
			<div class="obs-inline-row" style="flex-wrap:wrap;gap:6px;align-items:center">
				<input type="number" min="0" max="300" data-obs-field="sbp"
					placeholder="Systolic" style="width:100px" />
				<span style="color:var(--text-secondary);font-weight:600">/</span>
				<input type="number" min="0" max="200" data-obs-field="dbp"
					placeholder="Diastolic" style="width:100px" />
				${chips("bpPos", [
					["Lying", "Lying"],
					["Sitting", "Sitting"],
					["Standing", "Standing"],
				])}
				${chips("bpArm", [
					["L", "L arm"],
					["R", "R arm"],
				])}
			</div>
		</div>

		<div class="obs-row-group">
			<label class="obs-label">AVPU</label>
			${chips("avpu", [
				["A", "A — Alert"],
				["C", "C — Confusion"],
				["V", "V — Voice"],
				["P", "P — Pain"],
				["U", "U — Unresponsive"],
			])}
		</div>

		<div class="obs-row-group">
			${buildGcsCalcHTML(gcsPfx)}
		</div>

		<div class="obs-news2">
			<span class="news2-label">NEWS2</span>
			<span class="news2-score">–</span>
			<span class="news2-risk"></span>
		</div>`;

	// Remove button
	div.querySelector(".obs-remove").addEventListener("click", () => {
		div.remove();
		updateObsSetNumbers();
	});

	// Obs radio chips — delegate on this set's container (tap again to deselect)
	div.addEventListener("click", (e) => {
		const chip = e.target.closest("[data-obs-key]");
		if (!chip) return;
		const key = chip.dataset.obsKey;
		const wasSelected = chip.classList.contains("selected");
		div
			.querySelectorAll(`[data-obs-key="${key}"]`)
			.forEach((c) => c.classList.remove("selected"));
		if (!wasSelected) chip.classList.add("selected");
		// Hide O2 flow input whenever Supplemental is not the active selection
		if (key === "o2") {
			const supplementalActive =
				!wasSelected && chip.dataset.obsVal === "Supplemental";
			div
				.querySelector(".obs-o2-flow")
				?.classList.toggle("hidden", !supplementalActive);
		}
		updateNews2(div);
	});

	// Number/time inputs
	div.querySelectorAll("input").forEach((el) => {
		el.addEventListener("input", () => updateNews2(div));
	});

	return div;
}

function updateObsSetNumbers() {
	$$(".obs-set").forEach((set, i) => {
		const label = set.querySelector(".obs-set-label");
		if (label) label.textContent = `Obs set ${i + 1}`;
	});
}

function readObsSetData(setEl) {
	const n = (field) => {
		const v = setEl.querySelector(`[data-obs-field="${field}"]`)?.value?.trim();
		return v || null;
	};
	const chip = (key) =>
		setEl.querySelector(`[data-obs-key="${key}"].selected`)?.dataset.obsVal ||
		null;
	// GCS values come from the calculator sentinels (data-gcs-selected on hidden spans)
	const gcsPfx = `obsGcs${setEl.dataset.obsIdx}`;
	const gcsE = $("#" + gcsPfx + "Eye")?.dataset.gcsSelected || null;
	const gcsV = $("#" + gcsPfx + "Verbal")?.dataset.gcsSelected || null;
	const gcsM = $("#" + gcsPfx + "Motor")?.dataset.gcsSelected || null;
	return {
		time: n("time"),
		rr: n("rr"),
		spo2: n("spo2"),
		o2: chip("o2"),
		o2Flow: n("o2Flow"),
		hr: n("hr"),
		hrRhythm: chip("hrRhythm"),
		sbp: n("sbp"),
		dbp: n("dbp"),
		bpPos: chip("bpPos"),
		bpArm: chip("bpArm"),
		temp: n("temp"),
		bm: n("bm"),
		ketones: n("ketones"),
		avpu: chip("avpu"),
		gcsE,
		gcsV,
		gcsM,
	};
}

function buildObsText() {
	const sets = $$(".obs-set");
	if (!sets.length) return null;
	return sets
		.map((setEl, i) => {
			const d = readObsSetData(setEl);
			const lines = [];

			// Vitals line
			const vitals = [];
			if (d.rr) vitals.push(`RR: ${d.rr}`);
			if (d.spo2) {
				const o2Str =
					d.o2 === "Supplemental"
						? `supplemental O₂${d.o2Flow ? ` ${d.o2Flow}L/min` : ""}`
						: "air";
				vitals.push(`SpO₂: ${d.spo2}% (${o2Str})`);
			}
			if (d.hr) {
				const rhythm = d.hrRhythm ? ` (${d.hrRhythm.toLowerCase()})` : "";
				vitals.push(`HR: ${d.hr}${rhythm}`);
			}
			if (d.sbp || d.dbp) {
				const bp = [d.sbp, d.dbp].filter(Boolean).join("/");
				const pos = d.bpPos ? ` ${d.bpPos.toLowerCase()}` : "";
				const arm = d.bpArm ? ` ${d.bpArm}` : "";
				vitals.push(`BP: ${bp}mmHg${pos}${arm}`);
			}
			if (d.temp) vitals.push(`Temp: ${d.temp}°C`);
			if (d.bm) vitals.push(`BM: ${d.bm} mmol/L`);
			if (d.ketones) vitals.push(`Ketones: ${d.ketones} mmol/L`);
			if (vitals.length) lines.push(vitals.join(", "));

			// Neuro line
			const neuro = [];
			if (d.avpu) neuro.push(`AVPU: ${d.avpu}`);
			if (d.gcsE && d.gcsV && d.gcsM) {
				const total = parseInt(d.gcsE) + parseInt(d.gcsV) + parseInt(d.gcsM);
				neuro.push(`GCS: ${total} (E${d.gcsE} V${d.gcsV} M${d.gcsM})`);
			}
			if (neuro.length) lines.push(neuro.join(", "));

			// NEWS2
			const rr = parseFloat(d.rr),
				spo2 = parseFloat(d.spo2),
				sbp = parseFloat(d.sbp),
				hr = parseFloat(d.hr),
				temp = parseFloat(d.temp);
			const anyVitals =
				[rr, spo2, sbp, hr, temp].some((v) => !isNaN(v)) || d.avpu;
			if (anyVitals) {
				const { score, risk } = newsScore(
					rr,
					spo2,
					d.o2 === "Supplemental",
					sbp,
					hr,
					temp,
					d.avpu,
				);
				lines.push(`NEWS2: ${score} — ${risk}`);
			}

			const header = `Set ${i + 1}${d.time ? ` — ${d.time}` : ""}`;
			return `${header}\n${lines.map((l) => `  ${l}`).join("\n")}`;
		})
		.join("\n\n");
}

// CLIPBOARD & COPY UTILITIES
// Sections store their plain-text content in Maps rather than reading from the
// DOM on copy — this avoids URL-encoding artefacts from innerHTML round-trips.

// Adult section plain-text bodies keyed by section ID.
const outputSectionTexts = new Map();

// Paediatric section plain-text bodies keyed by section ID.
const paedsOutputSectionTexts = new Map();

function renderOutputSections(sections) {
	outputSectionTexts.clear();
	const root = $("#outputSections");
	if (!root) return;
	root.innerHTML = "";
	sections.forEach((section) => {
		outputSectionTexts.set(section.id, section.body);
		const card = document.createElement("article");
		card.className = "output-card";
		card.innerHTML = `<div class="output-card-head"><h3>${section.title}</h3><button type="button" class="secondary-action" data-copy-section="${section.id}">Copy</button></div>`;
		const pre = document.createElement("pre");
		pre.className = "output-snippet";
		pre.textContent = section.body;
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
	const newMode = decision === "Conveyed" ? "Not applicable" : "Standard";
	setRadioChip("worseningMode", newMode);
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
	return `"Call 999 immediately if you notice:
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
	if (status === "Lacks capacity") {
		const unable = ["Understand", "Retain", "Weigh", "Communicate"]
			.filter((_, i) =>
				isChecked(
					["lacksUnderstand", "lacksRetain", "lacksWeigh", "lacksCommunicate"][
						i
					],
				),
			)
			.map((s) => s.toLowerCase() + " information")
			.join(", ");
		const reason = val("lacksCausation");
		const bi = val("bestInterests");
		return [
			"Patient assessed as lacking capacity for the relevant decision at this time.",
			unable ? `Unable to: ${unable}.` : "",
			reason ? `Reason for incapacity: ${reason}.` : "",
			bi ? `Best interests decision: ${bi}` : "",
		]
			.filter(Boolean)
			.join(" ");
	}
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

	// Auto-select handover format based on conveyance decision
	const currentFmt = val("handoverFormat");
	const lahFormats = ["Leave at Home"];
	const conveyFormats = ["SBAR", "ASHICE", "ATMIST"];
	if (!conveyed && !lahFormats.includes(currentFmt)) {
		$$("[data-radio-group='handoverFormat'] [data-value]").forEach((b) =>
			b.classList.toggle("selected", b.dataset.value === "Leave at Home"),
		);
		const hiddenInput = $("#handoverFormat");
		if (hiddenInput) {
			hiddenInput.value = "Leave at Home";
			hiddenInput.dispatchEvent(new Event("change"));
		}
	} else if (conveyed && lahFormats.includes(currentFmt)) {
		$$("[data-radio-group='handoverFormat'] [data-value]").forEach((b) =>
			b.classList.toggle("selected", b.dataset.value === "SBAR"),
		);
		const hiddenInput = $("#handoverFormat");
		if (hiddenInput) {
			hiddenInput.value = "SBAR";
			hiddenInput.dispatchEvent(new Event("change"));
		}
	}

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

	// Legal / capacity considerations (EHCP, LPA, advance decision)
	const legalChips = $$(".legal-chip.selected").map((c) => {
		const map = {
			ehcp: "EHCP consulted",
			lpa: "LPA consulted",
			"advance-decision": "Advance decision reviewed",
			"family-carer": "Family/carer agreement obtained",
		};
		return map[c.dataset.legal] || c.dataset.legal;
	});
	const legalDetail = val("legalConsiderationsDetail");
	const legalLine = legalChips.length
		? `Legal / capacity: ${legalChips.join(", ")}.${legalDetail ? " " + legalDetail : ""}`
		: legalDetail
			? `Legal / capacity: ${legalDetail}`
			: null;

	return [
		`${decision}. Referred/signposted to: ${listSet(state.referrals, "not documented")}.`,
		val("followUp") ? val("followUp") + "." : null,
		checks ? `Safety netting: ${checks}.` : null,
		legalLine,
		notes || null,
	]
		.filter(Boolean)
		.join(" ");
}

// UTILITY & RESET HELPERS
// Body-map clearing, pain assessment reset, auscultation preview sync.

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
		"severityWorst",
		"characterOther",
		"associatedOther",
		"exacerbatingOther",
		"relievingOther",
	].forEach((id) => {
		const field = $(`#${id}`);
		if (field) field.value = "";
	});
	$$(
		"#painScoreGrid .pain-score-btn, #painScoreWorstGrid .pain-score-btn",
	).forEach((b) => b.classList.remove("selected"));
	setOtherFactorVisible("exacerbating", false);
	setOtherFactorVisible("relieving", false);
	updateMapTags();
}

function syncAuscultationOutput() {
	const entries = Object.entries(state.auscFindings).filter(
		([, f]) => f.size > 0,
	);
	let text;
	if (!entries.length) {
		text = "Not auscultated";
	} else {
		// Check if all regions have only "Clear"
		const allClear = entries.every(([, f]) => f.size === 1 && f.has("Clear"));
		if (allClear && entries.length >= 4) {
			text = "Equal and clear air entry throughout";
		} else {
			text = entries
				.map(([region, findings]) => `${region}: ${[...findings].join(", ")}`)
				.join("; ");
		}
	}
	const hidden = $("#respAus");
	if (hidden) hidden.value = text;
	const preview = $("#auscPreview");
	if (preview) preview.textContent = text;
}

// PAEDIATRIC PRF — constants, helpers, init

// ── Paeds treatment constants ─────────────────────────────
const PAEDS_TX_AIRWAY = [
	"Jaw thrust",
	"Head tilt / chin lift",
	"Airway positioning",
	"OPA inserted",
	"NPA inserted",
	"i-gel (supraglottic)",
	"Endotracheal intubation",
	"Suction",
	"BVM ventilation",
	"Oxygen therapy",
	"High-flow nasal cannula",
	"Nebulisation",
	"CPAP",
];

const PAEDS_TX_WOUND = [
	"Direct pressure",
	"Simple dressing",
	"Wound closure strips",
	"Haemostatic dressing",
	"Tourniquet applied",
	"Wound packing",
	"Wound irrigation",
	"Burn dressing",
	"Eye irrigation",
];

const PAEDS_TX_POSITIONING = [
	"Recovery position",
	"Upright / seated",
	"Supine / flat",
	"Sniffing position",
	"Spinal precautions",
	"Limb elevation",
];

const PAEDS_ABCDENT = [
	{
		key: "A",
		title: "Airway",
		icon: "p-airway",
		chips: [
			["Patent", "Obstructed / at risk"],
			["Self-maintained", "Airway support required"],
			["No abnormal sounds", "Airway sounds present (stridor / gurgling)"],
			["Mouth opening normal", "Restricted mouth opening"],
		],
		vitals: [],
		notes: "pAbcNotes_A",
		icon: "p-airway",
	},
	{
		key: "B",
		title: "Breathing",
		chips: [
			["Adequate rate", "Tachypnoea / bradypnoea"],
			["No WOB", "Increased work of breathing"],
			["Equal chest expansion", "Asymmetric chest expansion"],
			["No cyanosis", "Cyanosis present"],
			["No retractions", "Intercostal / subcostal retractions"],
			["No nasal flaring", "Nasal flaring"],
			["No grunting", "Expiratory grunting"],
		],
		vitals: [
			["pRr", "RR /min", "Age-appropriate"],
			["pSpo2", "SpO2 %", "≥95"],
			["pO2Flow", "O2 L/min", ""],
		],
		notes: "pAbcNotes_B",
		icon: "p-breathing",
	},
	{
		key: "C",
		title: "Circulation",
		chips: [
			["Good colour", "Pallor / mottling"],
			["Warm peripheries", "Cold peripheries"],
			["CRT <2s", "CRT ≥2s"],
			["Strong peripheral pulse", "Weak / absent peripheral pulse"],
			["Regular rhythm", "Irregular rhythm"],
			["No haemorrhage", "Active haemorrhage"],
		],
		vitals: [
			["pHr", "HR bpm", "Age-appropriate"],
			["pBp", "BP mmHg", ""],
			["pBm", "BM mmol/L", ""],
		],
		notes: "pAbcNotes_C",
		icon: "p-circulation",
	},
	{
		key: "D",
		title: "Disability (Neurology)",
		chips: [
			["Alert (AVPU)", "Voice / Pain / Unresponsive"],
			["Fontanelle normal", "Bulging fontanelle"],
			["PEARL", "Pupils unequal / unreactive"],
			["Normal tone", "Hypotonic / hypertonic"],
			["Age-appropriate behaviour", "Abnormal behaviour / irritable"],
			["No seizure activity", "Seizure activity"],
		],
		vitals: [
			["pGcs", "PGCS / AVPU", "15 / A"],
			["pPupils", "Pupils", "Equal & reactive"],
		],
		notes: "pAbcNotes_D",
		icon: "p-disability",
	},
	{
		key: "E",
		title: "Exposure",
		chips: [
			["Apyrexial", "Pyrexia / hypothermia"],
			["No rash", "Rash present"],
			["No non-blanching rash", "Non-blanching rash — urgent"],
			["No injury found", "Injury found"],
			["No bruising", "Bruising / marks noted"],
			["Skin colour normal", "Pallor / mottling / jaundice"],
		],
		vitals: [["pTemp", "Temp °C", "36.5–37.5"]],
		notes: "pAbcNotes_E",
		icon: "p-exposure",
	},
	{
		key: "ENT",
		title: "Ears, Nose & Throat",
		chips: [
			["No ear pain / discharge", "Ear pain / discharge present"],
			["No ear tugging", "Ear tugging (infant)"],
			["No nasal discharge", "Nasal discharge present"],
			["No nasal obstruction", "Nasal obstruction"],
			["Throat — no erythema", "Throat erythema / exudate"],
			["No tonsillar swelling", "Tonsillar enlargement"],
			["No stridor", "Stridor present"],
			["No drooling", "Drooling / dysphagia"],
		],
		vitals: [],
		notes: "pAbcNotes_ENT",
		icon: "p-ent",
	},
	{
		key: "T",
		title: "Tummy (Abdomen)",
		chips: [
			["No abdominal pain", "Abdominal pain present"],
			["Abdomen soft", "Abdomen rigid / guarded"],
			["No distension", "Abdominal distension"],
			["Not tender on palpation", "Tenderness on palpation"],
			["No rebound tenderness", "Rebound tenderness"],
			["No vomiting", "Vomiting present"],
			["No diarrhoea", "Diarrhoea present"],
			["No blood in stool", "Blood in stool"],
		],
		vitals: [],
		notes: "pAbcNotes_T",
		icon: "p-tummy",
	},
	{
		key: "DEFG",
		title: "Don't Ever Forget Glucose",
		chips: [
			["BM checked", "BM not checked"],
			["BM within normal range", "BM abnormal"],
			["No signs of hypoglycaemia", "Signs of hypoglycaemia"],
			["No signs of hyperglycaemia", "Signs of hyperglycaemia"],
			["Alert and responsive", "Altered consciousness / drowsy"],
		],
		vitals: [
			["pDefgBm", "BM mmol/L", "4.0–7.0"],
			["pDefgGcs", "AVPU / PGCS", "A / 15"],
		],
		notes: "pAbcNotes_DEFG",
		icon: "p-defg",
	},
];

// ── Paediatric worsening advice ──────────────────────────
const PAEDS_WORSENING_GENERIC = [
	"breathing becomes very fast, noisy, or your child is working hard to breathe",
	"your child's lips, tongue or fingernails turn blue",
	"your child becomes very difficult to wake or does not respond to you",
	"your child has a fit (seizure) or repeated seizures",
	"a rash appears that does not fade when you press a glass firmly against it",
	"you notice signs of severe allergic reaction — throat swelling, difficulty swallowing, or collapse",
	"you are worried at any point — trust your instincts as a parent or carer",
];

// Per-PC advice — { call999: [], call111: [], guidance: "" }
const PAEDS_WORSENING_PC = {
	"Fever / pyrexia": {
		call999: [
			"your child has a non-blanching rash — a rash that does not fade when pressed with a glass",
			"your child is under 3 months with a temperature of 38°C or above",
			"your child is 3–6 months with a temperature of 39°C or above",
			"breathing becomes fast, noisy or difficult",
			"your child becomes floppy, very drowsy or difficult to rouse",
			"your child develops a stiff neck, cannot look at light, or has a severe headache",
		],
		call111: [
			"fever has not come down after the correct doses of paracetamol or ibuprofen (do not give both at the same time)",
			"fever lasts longer than 5 days",
			"your child will not drink or has had no wet nappy or has not urinated for 8 or more hours",
			"you are worried or unsure at any point",
		],
		guidance:
			"NICE NG143 — feverish illness in children under 5. Do not sponge your child with cold water. Dress them comfortably — do not over-wrap or under-dress. Encourage regular fluids.",
	},
	"Respiratory distress": {
		call999: [
			"breathing becomes much more difficult — ribs visible, pulling in at the throat or tummy, or the child is silent and not moving air",
			"your child cannot speak, cry or feed because of their breathing",
			"lips or tongue turn blue",
			"your child becomes exhausted or limp",
		],
		call111: [
			"breathing rate increases noticeably or breathing sounds noisier",
			"your child will not feed or drink",
			"symptoms have not improved after prescribed treatment",
		],
		guidance:
			"JRCALC guidelines. Do not leave the child unattended. Keep the child calm and in a position they find comfortable — do not force them to lie down.",
	},
	Wheeze: {
		call999: [
			"breathing becomes very difficult and is not improving with inhalers",
			"your child cannot speak or cry normally",
			"wheeze disappears but breathing is still very difficult — this may mean the chest is too tight to wheeze (silent chest)",
			"lips or tongue turn blue",
		],
		call111: [
			"inhaler is needed more frequently than prescribed",
			"symptoms are not improving or are returning quickly after inhaler use",
			"your child is too breathless to eat or drink normally",
		],
		guidance:
			"JRCALC / BTS asthma guidelines. Give reliever inhaler (usually salbutamol) via spacer — up to 10 puffs one at a time, each with 5–10 breaths, every 20 minutes if needed while awaiting help.",
	},
	"Stridor / croup": {
		call999: [
			"stridor (harsh noise when breathing in) is present at rest, not just when crying or upset",
			"your child is drooling or having difficulty swallowing",
			"your child becomes very distressed, very quiet or floppy",
			"lips or tongue turn blue",
		],
		call111: [
			"croup symptoms return or worsen after initially improving",
			"barking cough or noisy breathing continues for more than a few days",
			"your child is not drinking or eating normally",
		],
		guidance:
			"Keep the child calm — distress worsens stridor. Cool humid air may help (sitting in a steamy bathroom briefly). Do not put anything in the child's mouth.",
	},
	Bronchiolitis: {
		call999: [
			"breathing stops for a few seconds (apnoea) or your child goes blue",
			"breathing is very laboured — you can see the ribs or the tummy is being sucked in",
			"your child becomes very difficult to rouse",
		],
		call111: [
			"your child is taking less than half their usual feeds",
			"there has been no wet nappy for 8 or more hours",
			"symptoms are getting worse rather than gradually improving",
		],
		guidance:
			"Bronchiolitis typically peaks at 3–5 days and lasts 2–3 weeks. Small, frequent feeds are better tolerated. Keep the head slightly elevated if comfortable. No evidence for salbutamol in bronchiolitis.",
	},
	Seizure: {
		call999: [
			"another seizure occurs",
			"a seizure lasts more than 5 minutes",
			"your child does not recover to normal within 30–60 minutes",
			"your child is injured during the seizure",
			"you are unsure or concerned at any point after the seizure",
		],
		call111: [
			"this was the first-ever seizure — follow-up is required even if recovered",
			"your child appears different or confused for longer than expected after the seizure",
		],
		guidance:
			"If a seizure occurs: do not restrain the child. Clear the area of hazards. Time the seizure. Place on their side when convulsing has stopped. Call 999 if the seizure lasts more than 5 minutes or does not stop.",
	},
	"Febrile seizure": {
		call999: [
			"another seizure occurs in the same illness",
			"a seizure lasts more than 5 minutes",
			"your child does not recover fully within 30–60 minutes",
			"a non-blanching rash develops alongside fever",
			"you have any concerns about their condition",
		],
		call111: [
			"fever returns and you are worried",
			"this was the first febrile seizure — a follow-up appointment with GP or paediatrician is recommended",
		],
		guidance:
			"Febrile seizures are caused by the sudden rise in temperature, not the height of the fever. Give regular paracetamol or ibuprofen to manage fever. If a further seizure occurs, call 999 — do not administer rectal diazepam unless prescribed and instructed to do so.",
	},
	"Reduced / altered consciousness": {
		call999: [
			"your child becomes less responsive or does not respond to their name or touch",
			"your child has a seizure",
			"breathing becomes abnormal",
			"there is any decline from their current level of consciousness",
		],
		call111: [
			"your child is unusually sleepy or difficult to rouse but does respond to you",
			"behaviour is significantly different from normal",
		],
		guidance:
			"Monitor closely and do not leave the child unattended. Keep them in the recovery position if unconscious and breathing. Reassess frequently.",
	},
	Vomiting: {
		call999: [
			"vomit is green or contains bile",
			"your child is showing signs of dehydration — sunken eyes, no tears when crying, dry mouth, no wet nappy for 8 hours",
			"severe abdominal pain alongside vomiting",
			"your child becomes unresponsive or has a seizure",
		],
		call111: [
			"your child cannot keep any fluids down for more than 8 hours",
			"there is blood in the vomit",
			"vomiting is getting worse rather than better",
		],
		guidance:
			"Offer small sips of fluid frequently rather than large amounts. Oral rehydration solution (e.g. Dioralyte) is recommended. Avoid fruit juice and fizzy drinks.",
	},
	"Diarrhoea and vomiting": {
		call999: [
			"your child shows signs of severe dehydration — very drowsy, sunken eyes, no tears, cold hands and feet, no wet nappy for 8 or more hours",
			"blood appears in the stool or vomit",
			"bile (green) appears in the vomit",
			"severe abdominal pain develops",
		],
		call111: [
			"symptoms are not improving after 24–48 hours",
			"your child cannot tolerate oral fluids",
			"you are worried about their level of hydration or overall condition",
		],
		guidance:
			"NICE NG172 — gastroenteritis in children under 5. Use oral rehydration solution (Dioralyte) as the first-line treatment for mild-moderate dehydration. Avoid anti-diarrhoeal medications in children. Reassess frequently.",
	},
	"Abdominal pain": {
		call999: [
			"abdominal pain becomes severe, constant, or makes the child double over",
			"the abdomen feels rigid or board-like",
			"green or bile-stained vomiting",
			"blood appears in the vomit or stool",
		],
		call111: [
			"pain persists for more than a few hours or is returning repeatedly",
			"your child develops fever alongside the abdominal pain",
			"your child will not eat or drink",
		],
		guidance:
			"Appendicitis classically starts around the navel and moves to the right lower abdomen. If in doubt, seek urgent assessment.",
	},
	Rash: {
		call999: [
			"a rash appears or spreads that does not fade when you press a glass firmly against it — this could indicate meningitis or septicaemia",
			"your child develops fever with the rash",
			"the rash spreads rapidly",
			"your child becomes drowsy, stiff, or photophobic (dislike of light)",
		],
		call111: [
			"the rash is spreading or changing",
			"your child is very unwell alongside the rash",
			"you are uncertain about the nature of the rash",
		],
		guidance:
			"The glass test: press a clear glass firmly against the rash. If the rash does not fade (non-blanching), call 999 immediately. Meningococcal disease can deteriorate very rapidly.",
	},
	"Head injury": {
		call999: [
			"your child loses consciousness, even briefly",
			"there are three or more episodes of vomiting after the injury",
			"your child develops a severe or worsening headache",
			"your child becomes confused, drowsy or difficult to rouse",
			"you notice unequal pupils or vision problems",
			"your child has a seizure",
			"a large, soft swelling appears on the head (especially in infants)",
			"the injury was significant — fall from height, road traffic collision",
		],
		call111: [
			"you have any concerns about your child's behaviour or level of alertness after the injury",
			"headache persists beyond a few hours",
		],
		guidance:
			"NICE CG176 head injury guidelines. The child should be supervised closely for at least 24 hours. Avoid giving ibuprofen for head injury — paracetamol at correct dose is preferred for pain relief.",
	},
	"Allergic reaction / anaphylaxis": {
		call999: [
			"breathing becomes difficult, noisy or your child is wheezing",
			"throat tightening or swelling — your child is having difficulty swallowing or speaking",
			"face or tongue swelling worsens",
			"your child collapses or becomes unresponsive",
			"symptoms return after initial improvement (biphasic reaction — can occur up to 72 hours later)",
		],
		call111: [
			"you are concerned about ongoing symptoms",
			"if an adrenaline auto-injector was used — an ED assessment is always required even if the child has improved",
		],
		guidance:
			"If prescribed: use adrenaline auto-injector (EpiPen / Jext / Emerade) immediately if anaphylaxis is suspected — do not wait. Lie the child flat unless they have breathing difficulty (sit up). Call 999. JRCALC anaphylaxis guidelines.",
	},
	"Diabetic emergency": {
		call999: [
			"your child becomes unconscious or unresponsive",
			"blood glucose falls below 4 mmol/L and does not improve with treatment",
			"your child has a seizure",
		],
		call111: [
			"blood glucose remains outside target range despite treatment",
			"your child is unable to keep fluids or glucose down",
			"you are unsure how to manage the blood glucose level",
		],
		guidance:
			"For hypoglycaemia (BM <4 mmol/L): fast-acting glucose (Glucogel, juice, glucose tablets) if conscious and able to swallow. Recheck in 10–15 minutes. Give a starchy snack once recovered. Do not give food or drink if the child is not fully conscious.",
	},
	"Sepsis concern": {
		call999: [
			"your child develops a non-blanching rash",
			"breathing becomes very fast or difficult",
			"your child becomes very drowsy, floppy or unresponsive",
			"your child's hands and feet become cold or mottled while the rest of the body is hot",
			"any rapid or significant deterioration in your child's condition",
		],
		call111: [
			"fever does not respond to paracetamol or ibuprofen",
			"your child appears more unwell than expected for a simple illness",
		],
		guidance:
			"NICE NG51 — sepsis in children. Trust your instincts — sepsis can deteriorate very rapidly. If in doubt, call 999.",
	},
	"Meningitis concern": {
		call999: [
			"a rash appears that does not fade under glass pressure — call 999 immediately, do not wait",
			"neck stiffness or dislike of bright light develops",
			"your child becomes extremely difficult to rouse or unresponsive",
			"your child develops a high-pitched or unusual cry",
			"cold hands and feet with a fever, or pale and blotchy skin",
		],
		call111: [
			"any new or worsening symptoms — for meningitis concern, do not wait: seek urgent medical advice immediately",
		],
		guidance:
			"Meningococcal disease can deteriorate within hours. Do not wait for a rash — if you suspect meningitis or septicaemia, call 999 immediately. The glass test should be performed if any rash develops.",
	},
	"Overdose / poisoning": {
		call999: [
			"your child loses consciousness or is unresponsive",
			"breathing becomes slow, shallow or stops",
			"your child has a seizure",
			"you are unsure what has been taken or how much",
		],
		call111: [
			"you are unsure whether your child has taken something harmful",
			"you have any concern about their condition",
		],
		guidance:
			"If you know what substance was taken, tell the ambulance crew. Do not induce vomiting. Keep any packaging or containers to hand for the clinical team. TOXBASE is available to NHS clinicians.",
	},
	"Trauma / injury": {
		call999: [
			"there is heavy uncontrolled bleeding",
			"your child loses consciousness",
			"there is concern about injury to the spine or neck",
			"your child develops breathing difficulty after a chest injury",
			"any rapid deterioration in their condition",
		],
		call111: [
			"pain is increasing rather than settling",
			"swelling or bruising is significant and spreading",
			"you are worried about a possible fracture",
		],
		guidance:
			"JRCALC trauma guidelines. Keep injured limbs supported and still. Apply gentle pressure to any wound that is bleeding. Do not remove any impaled objects.",
	},
	"Mental health (adolescent)": {
		call999: [
			"your child has taken an overdose or you believe they may have harmed themselves",
			"they are in immediate danger to themselves or others",
			"they become unresponsive or have a seizure",
		],
		call111: [
			"you are concerned about your child's mental health and need urgent advice",
			"your child is expressing thoughts of self-harm or suicide and you are unsure what to do",
		],
		guidance:
			"Keep communication open and non-judgmental. Remove access to means of self-harm where possible and safe to do so. Local CAMHS crisis lines and crisis cafes are available in many areas — ask your GP or 111 for local services.",
	},
	Fall: {
		call999: [
			"loss of consciousness occurs, even briefly",
			"three or more episodes of vomiting after the fall",
			"severe or worsening headache",
			"confusion, drowsiness or unusual behaviour",
			"there is concern about a significant mechanism of injury",
		],
		call111: [
			"pain is not settling or is worsening",
			"swelling, bruising or deformity is significant",
			"you have concerns about your child following the fall",
		],
		guidance:
			"NICE CG176 head injury guidance applies if the head was struck. Observe the child closely for the 24 hours following a significant fall.",
	},
};

const PAEDS_VITALS_REF = {
	neonate: {
		label: "Neonate (0–28 days)",
		hr: "100–160",
		rr: "30–50",
		sbp: "50–90",
		spo2: "≥95",
		apls: (mo) => Math.round((mo + 9) / 2),
	},
	infant: {
		label: "Infant (1–12 months)",
		hr: "100–160",
		rr: "25–50",
		sbp: "70–90",
		spo2: "≥95",
		apls: (mo) => Math.round((mo + 9) / 2),
	},
	toddler: {
		label: "Toddler (1–2 years)",
		hr: "90–150",
		rr: "20–40",
		sbp: "80–95",
		spo2: "≥95",
		apls: (yrs) => 2 * (yrs + 4),
	},
	preschool: {
		label: "Pre-school (2–5 years)",
		hr: "80–130",
		rr: "20–30",
		sbp: "80–100",
		spo2: "≥95",
		apls: (yrs) => 2 * (yrs + 4),
	},
	school: {
		label: "School age (5–12 years)",
		hr: "70–120",
		rr: "15–25",
		sbp: "90–110",
		spo2: "≥95",
		apls: (yrs) => 3 * yrs,
	},
	adolescent: {
		label: "Adolescent (12–16 years)",
		hr: "60–100",
		rr: "12–20",
		sbp: "100–120",
		spo2: "≥95",
		apls: () => null,
	},
};

const PAEDS_SAFEGUARDING = [
	"None identified on scene",
	"Child at risk",
	"Non-accidental injury concern",
	"Unexplained bruising / marks",
	"Neglect indicators",
	"Poor living conditions",
	"Domestic abuse in household",
	"Carer interaction concerns",
	"Inappropriate response from carer",
	"FGM concern",
	"CSE / trafficking indicators",
	"Parent / carer unavailable",
];

// PAEDIATRIC ePRF — STATE & INITIALISATION
// Separate state object and lazy-init flag for the paeds tool.
// initPaeds() is called once on first entry to avoid duplicate DOM building.

// Guards against initialising the paeds tool more than once.
let _paedsInited = false;

// Mutable state for the paediatric ePRF (mirrors the adult state object).
const paedsState = {
	sgConcerns: new Set(),
	pIvEntries: [],
	pDrugEntries: [],
	pAirwayInterventions: new Set(),
	pWoundInterventions: new Set(),
	pPositioningInterventions: new Set(),
};

function initPaeds() {
	if (_paedsInited) return;
	_paedsInited = true;

	buildPaedsAbcdent();
	buildPaedsSafeguardingGrid();
	buildPaedsTreatmentSection();
	buildPConveyTransferChips();
	bindPaedsEvents();
	updatePaedsAgeRef();
	updateFlaccTotal();
}

// ── Build ABCDENT sections ───────────────────────────────
function buildPaedsAbcdent() {
	const root = $("#paedsAbcdentContainer");
	if (!root) return;
	PAEDS_ABCDENT.forEach((section) => {
		const details = document.createElement("details");
		details.className = "section-card";
		if (section.icon) details.dataset.sectionIcon = section.icon;
		details.innerHTML = `
			<summary><span>${section.key} — ${section.title}</span><small>${section.key}</small></summary>
			<div class="section-body">
				<div class="square-grid pabc-grid"></div>
				<div class="vital-grid"></div>
				<label class="field-label" for="${section.notes}">Notes</label>
				<input id="${section.notes}" type="text" />
			</div>`;
		const chipRoot = $(".pabc-grid", details);
		section.chips.forEach(([normal, abnormal]) => {
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "square-btn p-abc-chip selected";
			btn.textContent = normal;
			btn.dataset.pAbc = section.key;
			btn.dataset.normal = normal;
			btn.dataset.abnormal = abnormal;
			btn.dataset.abcState = "normal";
			btn.dataset.value = normal;
			chipRoot.append(btn);
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

// ── Build paeds safeguarding chip grid ────────────────────
function buildPaedsSafeguardingGrid() {
	const grid = $("#pSgGrid");
	if (!grid) return;
	PAEDS_SAFEGUARDING.forEach((item) => {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "square-btn";
		btn.textContent = item;
		btn.dataset.pSgGroup = "pSafeguarding";
		btn.dataset.pSgValue = item;
		grid.append(btn);
	});
}

// ── APLS weight & vital sign reference ────────────────────
function aplsWeight(ageYears, ageMonths) {
	const totalMonths = (ageYears || 0) * 12 + (ageMonths || 0);
	const yrs = ageYears || 0;
	if (totalMonths < 1) return 3.5; // newborn estimate
	if (totalMonths < 12) return Math.round((totalMonths + 9) / 2);
	if (yrs < 6) return 2 * (yrs + 4);
	if (yrs <= 12) return 3 * yrs;
	return null; // adolescent
}

function detectAgeGroup(ageYears, ageMonths) {
	const totalMonths = (ageYears || 0) * 12 + (ageMonths || 0);
	if (totalMonths < 1) return "neonate";
	if (totalMonths < 12) return "infant";
	if (ageYears < 2) return "toddler";
	if (ageYears < 5) return "preschool";
	if (ageYears < 12) return "school";
	return "adolescent";
}

function updatePaedsAgeRef() {
	const years = parseInt(val("pAgeYears")) || 0;
	const months = parseInt(val("pAgeMonths")) || 0;
	const manualGroup = val("pAgeGroup");

	// APLS weight
	const wt = aplsWeight(years, months);
	const pill = $("#pAplsEstimate");
	if (pill) {
		pill.textContent =
			years === 0 && months === 0
				? "Enter age above"
				: wt !== null
					? `≈ ${wt} kg (APLS)`
					: "Use actual weight";
	}

	// Vitals reference
	const group =
		manualGroup ||
		(years === 0 && months === 0 ? "" : detectAgeGroup(years, months));
	const ref = PAEDS_VITALS_REF[group];
	const refBox = $("#pVitalsRef");
	if (!refBox) return;
	if (!ref) {
		refBox.classList.add("hidden");
		return;
	}
	refBox.classList.remove("hidden");
	refBox.innerHTML = `
		<strong>${ref.label} — Normal Ranges</strong>
		<div class="pvr-grid">
			<div class="pvr-item"><span class="pvr-label">HR: </span>${ref.hr} bpm</div>
			<div class="pvr-item"><span class="pvr-label">RR: </span>${ref.rr} /min</div>
			<div class="pvr-item"><span class="pvr-label">SBP: </span>${ref.sbp} mmHg</div>
			<div class="pvr-item"><span class="pvr-label">SpO2: </span>${ref.spo2}%</div>
		</div>
		<div style="margin-top:5px;font-size:11px;color:#15803d;font-style:italic">Reference only — assess in clinical context (Spotting the Sick Child)</div>`;

	// Also auto-select age group chip if not manually set
	if (!manualGroup && group) {
		setRadioChip("pAgeGroup", group);
	}
}

// ── WETFLAG calculator ────────────────────────────────────
function calcWetflag(weight) {
	if (!weight || weight <= 0) return null;
	const w = parseFloat(weight);
	const ageApprox = w < 10 ? Math.round(w / 2) : Math.round(w / 3); // rough age in years
	const tubeSizeUncuffed = (ageApprox / 4 + 4).toFixed(1);
	const tubeSizeCuffed = (ageApprox / 4 + 3.5).toFixed(1);
	return {
		weight: `${w} kg`,
		energy: `${(4 * w).toFixed(0)} J (4 J/kg)`,
		tube: `${tubeSizeUncuffed} mm uncuffed / ${tubeSizeCuffed} mm cuffed`,
		fluid: `${(10 * w).toFixed(0)}–${(20 * w).toFixed(0)} mL (10–20 mL/kg crystalloid)`,
		lorazepam: `${(0.1 * w).toFixed(2)} mg IV/IO (0.1 mg/kg, max 4 mg)`,
		adrenaline: `${(0.1 * w).toFixed(1)} mL of 1:10,000 (10 mcg/kg = 0.1 mL/kg)`,
		glucose: `${(2 * w).toFixed(0)} mL of 10% dextrose (2 mL/kg)`,
	};
}

// ── FLACC total ───────────────────────────────────────────
function updateFlaccTotal() {
	const ids = [
		"flaccFace",
		"flaccLegs",
		"flaccActivity",
		"flaccCry",
		"flaccConsolability",
	];
	const total = ids.reduce((sum, id) => sum + (parseInt(val(id)) || 0), 0);
	const el = $("#flaccTotal");
	if (!el) return;
	let label = "No pain / relaxed";
	let cls = "pain-low";
	if (total >= 1 && total <= 3) {
		label = "Mild pain";
		cls = "pain-low";
	}
	if (total >= 4 && total <= 6) {
		label = "Moderate pain";
		cls = "pain-mod";
	}
	if (total >= 7) {
		label = "Severe pain";
		cls = "pain-high";
	}
	el.className = `flacc-total ${cls}`;
	el.textContent = `FLACC total: ${total} / 10 — ${label}`;
}

// ── Radio chip group helpers ──────────────────────────────

// Programmatically select a chip in a radio group and update its hidden input.
// Used by auto-detection (e.g. age group).

function setRadioChip(fieldId, value) {
	const group = $(`[data-radio-group="${fieldId}"]`);
	const inp = $(`#${fieldId}`);
	if (!group || !inp) return;
	group.querySelectorAll("[data-value]").forEach((chip) => {
		chip.classList.toggle("selected", chip.dataset.value === value);
	});
	inp.value = value;
}

//
// Wire up all .radio-chip-group elements so that tapping a chip:
// 1. Adds .selected to the tapped chip, removes it from siblings
// 2. Updates the matching hidden <input id="...">
// 3. Dispatches a synthetic "change" event on the hidden input
//    so any existing listeners (pain tool toggle, convey decision, etc.) still fire.

function bindRadioChipGroups() {
	// Standard radio chip groups (class="radio-chip") and faces chip groups
	$$("[data-radio-group]").forEach((group) => {
		group.addEventListener("click", (e) => {
			const chip = e.target.closest("[data-value]");
			if (!chip || !group.contains(chip)) return;
			const fieldId = group.dataset.radioGroup;
			const wasSelected = chip.classList.contains("selected");
			// Deselect all chips in this group
			group
				.querySelectorAll("[data-value]")
				.forEach((c) => c.classList.remove("selected"));
			// Toggle: re-select only if it wasn't already selected
			if (!wasSelected) chip.classList.add("selected");
			// Update hidden input (empty string if deselected)
			const inp = $(`#${fieldId}`);
			if (inp) {
				inp.value = wasSelected ? "" : chip.dataset.value;
				inp.dispatchEvent(new Event("change"));
			}
		});
	});
}

// EVENT BINDING — PAEDIATRIC ePRF
// All DOM event listeners for the paeds form, including WETFLAG, FLACC, PAT,
// drug/IV entry, and the paeds output/copy buttons.

function bindPaedsEvents() {
	// ── Radio chip groups (single-select) ──────────────────
	bindRadioChipGroups();

	// ── Tab switching ──────────────────────────────────────
	$$("[data-paeds-tab]").forEach((tab) => {
		tab.addEventListener("click", () => {
			const target = tab.dataset.paedsTab;
			$$("[data-paeds-tab]").forEach((t) => t.classList.remove("active"));
			tab.classList.add("active");
			$$(".panel[id^='paeds-panel-']").forEach((p) =>
				p.classList.remove("active"),
			);
			$(`#paeds-panel-${target}`)?.classList.add("active");
			if (target === "output") buildPaedsOutputSections();
		});
	});

	// ── ABCDENT chip toggle ────────────────────────────────
	$("#paedsAbcdentContainer")?.addEventListener("click", (e) => {
		const chip = e.target.closest("[data-p-abc]");
		if (!chip) return;
		const isNormal = chip.dataset.abcState === "normal";
		chip.dataset.abcState = isNormal ? "abnormal" : "normal";
		chip.textContent = isNormal ? chip.dataset.abnormal : chip.dataset.normal;
		chip.classList.toggle("selected", !isNormal);
		chip.classList.toggle("abnormal", isNormal);
	});

	// ── PAT chip toggle ────────────────────────────────────
	["patAppearanceGrid", "patWobGrid", "patCircGrid"].forEach((gridId) => {
		$(`#${gridId}`)?.addEventListener("click", (e) => {
			const chip = e.target.closest("[data-pat]");
			if (!chip) return;
			const isNormal = chip.dataset.patState === "normal";
			chip.dataset.patState = isNormal ? "abnormal" : "normal";
			chip.textContent = isNormal
				? chip.dataset.patAbnormal
				: chip.dataset.patNormal;
			chip.classList.toggle("selected", !isNormal);
			chip.classList.toggle("abnormal", isNormal);
		});
	});

	// ── Age inputs → reference update ─────────────────────
	["pAgeYears", "pAgeMonths", "pAgeGroup"].forEach((id) => {
		$(`#${id}`)?.addEventListener("change", updatePaedsAgeRef);
		$(`#${id}`)?.addEventListener("input", updatePaedsAgeRef);
	});

	// ── FLACC chip rows ────────────────────────────────────
	$$("[data-flacc-field]").forEach((row) => {
		row.addEventListener("click", (e) => {
			const chip = e.target.closest(".flacc-chip");
			if (!chip) return;
			const field = row.dataset.flaccField;
			$$(`[data-flacc-field="${field}"] .flacc-chip`).forEach((c) =>
				c.classList.remove("selected"),
			);
			chip.classList.add("selected");
			const inp = $(`#${field}`);
			if (inp) {
				inp.value = chip.dataset.value;
				inp.dispatchEvent(new Event("change"));
			}
		});
	});
	[
		"flaccFace",
		"flaccLegs",
		"flaccActivity",
		"flaccCry",
		"flaccConsolability",
	].forEach((id) => {
		$(`#${id}`)?.addEventListener("change", updateFlaccTotal);
	});

	// ── Pain tool toggle ───────────────────────────────────
	$("#pPainTool")?.addEventListener("change", () => {
		const tool = val("pPainTool");
		$("#flaccWrap")?.classList.toggle("hidden", tool !== "flacc");
		$("#pNrsWrap")?.classList.toggle("hidden", tool !== "nrs");
		$("#pFacesWrap")?.classList.toggle("hidden", tool !== "faces");
	});

	// ── NRS pain score grids (paeds) ───────────────────────
	[
		{ gridId: "pPainScoreGrid", inputId: "pSeverity" },
		{ gridId: "pPainScoreWorstGrid", inputId: "pSeverityWorst" },
	].forEach(({ gridId, inputId }) => {
		$(`#${gridId}`)?.addEventListener("click", (e) => {
			const btn = e.target.closest(".pain-score-btn");
			if (!btn) return;
			const score = btn.dataset.score;
			const already = btn.classList.contains("selected");
			$$(`#${gridId} .pain-score-btn`).forEach((b) =>
				b.classList.remove("selected"),
			);
			if (!already) {
				btn.classList.add("selected");
				const inp = $(`#${inputId}`);
				if (inp) inp.value = `${score}/10`;
			} else {
				const inp = $(`#${inputId}`);
				if (inp) inp.value = "";
			}
		});
	});

	// ── Safeguarding chips ─────────────────────────────────
	$("#pSgGrid")?.addEventListener("click", (e) => {
		const chip = e.target.closest("[data-p-sg-group]");
		if (!chip) return;
		const v = chip.dataset.pSgValue;
		if (v === "None identified on scene") {
			paedsState.sgConcerns.clear();
			paedsState.sgConcerns.add(v);
		} else {
			paedsState.sgConcerns.delete("None identified on scene");
			paedsState.sgConcerns.has(v)
				? paedsState.sgConcerns.delete(v)
				: paedsState.sgConcerns.add(v);
		}
		$$("#pSgGrid [data-p-sg-group]").forEach((b) => {
			b.classList.toggle(
				"selected",
				paedsState.sgConcerns.has(b.dataset.pSgValue),
			);
		});
		const hasConcerns =
			paedsState.sgConcerns.size > 0 &&
			!paedsState.sgConcerns.has("None identified on scene");
		$("#pSgDetailWrap")?.classList.toggle("hidden", !hasConcerns);
	});

	// ── Convey decision → wrap visibility + worsening ────
	$("#pConveyDecision")?.addEventListener("change", handlePConveyanceDisplay);
	$("#pConveyHospital")?.addEventListener("change", handlePConveyanceDisplay);
	$("#pConveyDepartment")?.addEventListener("change", handlePConveyanceDisplay);
	// Sync display to default value
	handlePConveyanceDisplay();

	// ── Paeds transfer chip clicks ────────────────────────
	$("#pConveyTransferGrid")?.addEventListener("click", (e) => {
		const chip = e.target.closest(".p-convey-chip");
		if (chip) togglePConveyChip(chip);
	});

	// ── pPc "Other" free-text ─────────────────────────────
	$("#pPc")?.addEventListener("change", () => {
		const isOther = val("pPc") === "Other";
		$("#pPcOtherWrap")?.classList.toggle("hidden", !isOther);
		updatePaedsWorseningScript();
	});

	$(`#pWorseningCustom`)?.addEventListener("input", updatePaedsWorseningScript);
	updatePaedsWorseningScript();

	// ── 3 Minute Toolkit chips (Phase 3 only) ────────────
	$(`#tmtPhase3Grid`)?.addEventListener("click", (e) => {
		const chip = e.target.closest(".tmt-chip");
		if (!chip) return;
		chip.classList.toggle("selected");
	});

	// ── Generate buttons ───────────────────────────────────
	$("#pCopyButton")?.addEventListener("click", async () => {
		buildPaedsOutputSections();
		const all = [...paedsOutputSectionTexts.values()]
			.filter(Boolean)
			.join("\n\n");
		if (all) await copyText(all);
	});

	$("#pRefreshButton")?.addEventListener("click", () => {
		buildPaedsOutputSections();
	});
}

// OUTPUT GENERATION — PAEDIATRIC ePRF
// Assembles all paeds section text builders and renders them as copyable cards.

function buildPaedsOutputSections() {
	const container = $("#pOutputSections");
	if (!container) return;
	container.innerHTML = "";

	const sections = [
		{ id: "p-patient", title: "PATIENT", body: buildPaedsPatientText() },
		{ id: "p-pc", title: "PRESENTING COMPLAINT", body: buildPaedsPcText() },
		{
			id: "p-background",
			title: "BACKGROUND",
			body: buildPaedsBackgroundText(),
		},
		{ id: "p-tmt", title: "3 MINUTE TOOLKIT", body: buildTmtText() },
		{ id: "p-pat", title: "PAT — ACROSS-THE-ROOM", body: buildPaedsPATText() },
		{
			id: "p-primary",
			title: "PRIMARY SURVEY (ABCDE + ENT + T + DEFG)",
			body: buildPaedsAbcdentText(),
		},
		{ id: "p-pain", title: "PAIN ASSESSMENT", body: buildPaedsPainText() },
		{ id: "p-sg", title: "SAFEGUARDING", body: buildPaedsSgText() },
		{
			id: "p-tx",
			title: "TREATMENTS & INTERVENTIONS",
			body: buildPaedsTxText(),
		},
		{
			id: "p-changes",
			title: "CLINICAL CHANGES",
			body: buildPaedsClinChangesText(),
		},
		{
			id: "p-consent",
			title: "CONSENT & CAPACITY",
			body: buildPaedsConsentText(),
		},
		{ id: "p-convey", title: "CONVEYANCE", body: buildPaedsConveyText() },
		...(val("pConveyDecision") !== "Conveyed"
			? [
					{
						id: "p-worsening",
						title: "WORSENING ADVICE",
						body: buildPaedsWorseningText(),
					},
				]
			: []),
		...(() => {
			const wf = buildPaedsWetflagText();
			return wf
				? [{ id: "p-wetflag", title: "WETFLAG REFERENCE", body: wf }]
				: [];
		})(),
	];

	paedsOutputSectionTexts.clear();
	sections.forEach(({ id, title, body }) => {
		if (!body || !body.trim()) return;
		paedsOutputSectionTexts.set(id, body);
		const card = document.createElement("article");
		card.className = "output-card";
		card.innerHTML = `<div class="output-card-head"><h3>${title}</h3><button type="button" class="secondary-action" data-p-copy-section="${id}">Copy</button></div>`;
		const pre = document.createElement("pre");
		pre.className = "output-snippet";
		pre.textContent = body;
		card.append(pre);
		card
			.querySelector("[data-p-copy-section]")
			?.addEventListener("click", async () => {
				await copyText(body);
			});
		container.append(card);
	});
}

// TEXT BUILDERS — PAEDIATRIC ePRF
// One function per output section.  All return "" when their section has no data.

function buildTmtText() {
	const lines = ["3 Minute Toolkit (Spotting the Sick Child)"];

	// Phase 1 — PAT (documented in full via buildPaedsPATText)
	const patImpression = val("patImpression");
	lines.push(`\nLOOK (PAT across the room)`);
	if (patImpression) lines.push(`Initial impression: ${patImpression}`);
	else lines.push(`Initial impression: Not recorded`);

	// Phase 2 — ABCDE + ENT + T + DEFG (documented via buildPaedsAbcdentText)
	lines.push(`\nLISTEN & FEEL (hands-on primary survey)`);
	lines.push(`See primary survey (ABCDE + ENT + T + DEFG) below`);

	// Phase 3 — DECIDE
	const all3 = $$(`#tmtPhase3Grid .tmt-chip`);
	const done3 = all3
		.filter((c) => c.classList.contains("selected"))
		.map((c) => c.dataset.tmtLabel);
	const skip3 = all3
		.filter((c) => !c.classList.contains("selected"))
		.map((c) => c.dataset.tmtLabel);
	const decision = val("tmtDecision");
	const notes = val("tmtNotes");
	lines.push(`\nDECIDE`);
	if (done3.length) lines.push(`Completed: ${done3.join(", ")}`);
	if (skip3.length) lines.push(`Not completed: ${skip3.join(", ")}`);
	if (decision) lines.push(`Management decision: ${decision}`);
	if (notes) lines.push(`Clinical reasoning: ${notes}`);

	return lines.join("\n");
}

function buildPaedsPatientText() {
	const yrs = val("pAgeYears");
	const mo = val("pAgeMonths");
	const ageStr =
		[yrs ? `${yrs} years` : null, mo ? `${mo} months` : null]
			.filter(Boolean)
			.join(" ") || "Age not recorded";
	const sex = val("pSex") || "Sex not recorded";
	const wt =
		val("pWeight") ||
		(aplsWeight(parseInt(yrs) || 0, parseInt(mo) || 0)
			? `≈${aplsWeight(parseInt(yrs) || 0, parseInt(mo) || 0)} kg (APLS estimate)`
			: "Not recorded");
	const group =
		val("pAgeGroup") ||
		detectAgeGroup(parseInt(yrs) || 0, parseInt(mo) || 0) ||
		"";
	const groupLabel = PAEDS_VITALS_REF[group]?.label || group;
	return [
		`Patient: ${ageStr}, ${sex}`,
		`Weight: ${wt}`,
		groupLabel ? `Age group: ${groupLabel}` : null,
	]
		.filter(Boolean)
		.join("\n");
}

function buildPaedsPcText() {
	const lines = [];
	const pcRaw = val("pPc");
	const pc = pcRaw === "Other" ? val("pPcOther") || "Other" : pcRaw;
	const hpc = val("pHpc");
	const onset = val("pOnsetType");
	const duration = val("pOnsetDuration");
	if (pc) lines.push(`Presenting complaint: ${pc}`);
	if (onset || duration)
		lines.push(`Onset: ${[onset, duration].filter(Boolean).join(", ")}`);
	if (hpc) lines.push(`\nHistory:\n${hpc}`);
	return lines.join("\n");
}

function buildPaedsBackgroundText() {
	const lines = [];
	if (isChecked("pNkda")) lines.push("Allergies: NKDA");
	else if (val("pAllergies")) lines.push(`Allergies: ${val("pAllergies")}`);
	if (isChecked("pNoMeds")) lines.push("Medications: None");
	else if (val("pMeds")) lines.push(`Medications: ${val("pMeds")}`);
	if (isChecked("pNoPmh")) lines.push("PMH: None significant");
	else if (val("pPmh")) lines.push(`PMH: ${val("pPmh")}`);
	if (val("pGestation")) lines.push(`Gestation: ${val("pGestation")}`);
	if (val("pBirthHistory"))
		lines.push(`Birth history: ${val("pBirthHistory")}`);
	const imms = val("pImms");
	if (imms && imms !== "Unknown / not checked")
		lines.push(`Immunisations: ${imms}`);
	if (val("pSocial")) lines.push(`Social: ${val("pSocial")}`);
	return lines.join("\n");
}

function buildPaedsPATText() {
	const lines = [];
	["appearance", "wob", "circ"].forEach((component) => {
		const chips = $$(`[data-pat="${component}"]`);
		const abnormal = chips
			.filter((c) => c.dataset.patState === "abnormal")
			.map((c) => c.textContent);
		const componentName = {
			appearance: "Appearance (TICLS)",
			wob: "Work of Breathing",
			circ: "Circulation to skin",
		}[component];
		if (abnormal.length) {
			lines.push(`${componentName}: ABNORMAL — ${abnormal.join(", ")}`);
		} else {
			lines.push(`${componentName}: Normal`);
		}
	});
	const impression = val("patImpression");
	if (impression) lines.push(`\nOverall PAT impression: ${impression}`);
	return lines.join("\n");
}

function buildPaedsAbcdentText() {
	const lines = [];
	PAEDS_ABCDENT.forEach((section) => {
		const chips = $$(`[data-p-abc="${section.key}"]`);
		if (!chips.length) return; // not built yet
		const abnormal = chips
			.filter((c) => c.dataset.abcState === "abnormal")
			.map((c) => c.textContent);
		const vitalsText = section.vitals
			.map(([id, label]) => {
				const v = val(id);
				return v ? `${label}: ${v}` : null;
			})
			.filter(Boolean)
			.join(", ");
		const notes = val(section.notes);
		const status = abnormal.length
			? `ABNORMAL — ${abnormal.join(", ")}`
			: "Within normal limits";
		const parts = [`${section.key} — ${section.title}: ${status}`];
		if (vitalsText) parts.push(`  Obs: ${vitalsText}`);
		if (notes) parts.push(`  Notes: ${notes}`);
		lines.push(parts.join("\n"));
	});
	return lines.join("\n");
}

function buildPaedsPainText() {
	const tool = val("pPainTool");
	const lines = [];
	if (tool === "flacc") {
		const total = [
			"flaccFace",
			"flaccLegs",
			"flaccActivity",
			"flaccCry",
			"flaccConsolability",
		].reduce((sum, id) => sum + (parseInt(val(id)) || 0), 0);
		const label =
			total <= 0
				? "No pain"
				: total <= 3
					? "Mild pain"
					: total <= 6
						? "Moderate pain"
						: "Severe pain";
		lines.push(`Pain assessment tool: FLACC`);
		lines.push(`FLACC score: ${total}/10 — ${label}`);
	} else if (tool === "nrs") {
		lines.push(`Pain assessment tool: NRS (self-report)`);
		const now = val("pSeverity");
		const worst = val("pSeverityWorst");
		if (now) lines.push(`Severity now: ${now}`);
		if (worst) lines.push(`Severity at worst: ${worst}`);
	} else if (tool === "faces") {
		const faces = val("pFacesScore");
		lines.push(`Pain assessment tool: Wong-Baker Faces scale`);
		if (faces !== "") lines.push(`Faces score: ${faces}/10`);
	}
	const notes = val("pPainNotes");
	if (notes) lines.push(`Pain notes: ${notes}`);
	return lines.join("\n");
}

function buildPaedsSgText() {
	const concerns = [...paedsState.sgConcerns];
	const lines = [];
	if (concerns.length) lines.push(`Safeguarding: ${concerns.join(", ")}`);
	if (val("pSgDetail")) lines.push(`Detail: ${val("pSgDetail")}`);
	if (isChecked("pSgReferral")) {
		const ref = val("pSgReferralDetail");
		lines.push(`Safeguarding referral made.${ref ? ` ${ref}` : ""}`);
	}
	return lines.join("\n") || "Safeguarding: None identified on scene";
}

// ── Build paeds treatment section ────────────────────────
function buildPaedsTreatmentSection() {
	// Build chip grids
	const buildPaedsTxGrid = (gridId, items, stateKey) => {
		const grid = $(`#${gridId}`);
		if (!grid) return;
		items.forEach((item) => {
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "square-btn";
			btn.textContent = item;
			btn.dataset.ptxGroup = stateKey;
			btn.dataset.ptxValue = item;
			grid.append(btn);
		});
		grid.addEventListener("click", (e) => {
			const btn = e.target.closest("[data-ptx-group]");
			if (!btn) return;
			const key = btn.dataset.ptxGroup;
			const val = btn.dataset.ptxValue;
			const set = paedsState[key];
			if (!set) return;
			if (set.has(val)) {
				set.delete(val);
				btn.classList.remove("selected");
			} else {
				set.add(val);
				btn.classList.add("selected");
			}
		});
	};

	buildPaedsTxGrid("pAirwayGrid", PAEDS_TX_AIRWAY, "pAirwayInterventions");
	buildPaedsTxGrid("pWoundGrid", PAEDS_TX_WOUND, "pWoundInterventions");
	buildPaedsTxGrid(
		"pPositioningGrid",
		PAEDS_TX_POSITIONING,
		"pPositioningInterventions",
	);

	// VA type → show/hide gauge + site grids
	$("#pVaType")?.addEventListener("change", () => {
		const type = val("pVaType");
		const isIv = type === "IV Cannula";
		const isIo = type === "IO Access";
		$("#pVaGaugeWrap")?.classList.toggle("hidden", !isIv);
		$("#pVaIvSites")?.classList.toggle("hidden", !isIv);
		$("#pVaIoSites")?.classList.toggle("hidden", !isIo);
		// Clear site + gauge selection when type changes
		[
			...$$("[data-radio-group='pVaSite'] [data-value]"),
			...$$("[data-radio-group='pVaGauge'] [data-value]"),
		].forEach((c) => c.classList.remove("selected"));
		const siteInp = $("#pVaSite");
		if (siteInp) siteInp.value = "";
		const gaugeInp = $("#pVaGauge");
		if (gaugeInp) gaugeInp.value = "";
	});

	// Outcome → show flush confirmation when Successful, auto-populate flush chip
	$("#pVaOutcome")?.addEventListener("change", () => {
		const successful = val("pVaOutcome") === "Successful";
		$("#pVaFlushWrap")?.classList.toggle("hidden", !successful);
		if (successful) {
			setRadioChip("pVaFlushed", "Flushed — 5ml NaCl 0.9%");
		} else {
			$$("[data-radio-group='pVaFlushed'] [data-value]").forEach((c) =>
				c.classList.remove("selected"),
			);
			const fi = $("#pVaFlushed");
			if (fi) fi.value = "";
		}
	});

	// Add VA entry
	$("#pAddVaButton")?.addEventListener("click", addPaedsIvEntry);

	// Add drug entry
	$("#pAddDrugButton")?.addEventListener("click", addPaedsDrugEntry);

	// Drug name select → show/hide Other input
	$("#pDrugName")?.addEventListener("change", () => {
		const isOther = val("pDrugName") === "Other";
		$("#pDrugNameOther")?.classList.toggle("hidden", !isOther);
		if (!isOther) {
			const o = $("#pDrugNameOther");
			if (o) o.value = "";
		}
	});

	// Remove / repeat delegation
	$("#pVaEntries")?.addEventListener("click", (e) => {
		const idx = e.target.dataset.removePva;
		if (idx !== undefined) {
			paedsState.pIvEntries.splice(parseInt(idx), 1);
			renderPaedsIvEntries();
		}
	});
	$("#pDrugEntries")?.addEventListener("click", (e) => {
		const ri = e.target.dataset.removePdrug;
		if (ri !== undefined) {
			paedsState.pDrugEntries.splice(parseInt(ri), 1);
			renderPaedsDrugEntries();
		}
		const rp = e.target.dataset.repeatPdrug;
		if (rp !== undefined) repeatPaedsDrugEntry(parseInt(rp));
	});
}

function addPaedsIvEntry() {
	const type = val("pVaType");
	const site = val("pVaSite");
	if (!type || !site) return;
	paedsState.pIvEntries.push({
		type,
		gauge: val("pVaGauge"),
		site,
		outcome: val("pVaOutcome"),
		flushed: val("pVaFlushed"),
		fluids: val("pVaFluids"),
	});
	// Clear inputs
	[
		"pVaType",
		"pVaGauge",
		"pVaSite",
		"pVaOutcome",
		"pVaFlushed",
		"pVaFluids",
	].forEach((id) => {
		const el = $(`#${id}`);
		if (el) el.value = "";
	});
	["pVaGaugeWrap", "pVaIvSites", "pVaIoSites", "pVaFlushWrap"].forEach((id) => {
		$(`#${id}`)?.classList.add("hidden");
	});
	$$(
		"[data-radio-group='pVaType'] [data-value], [data-radio-group='pVaGauge'] [data-value], [data-radio-group='pVaSite'] [data-value], [data-radio-group='pVaOutcome'] [data-value], [data-radio-group='pVaFlushed'] [data-value]",
	).forEach((c) => c.classList.remove("selected"));
	renderPaedsIvEntries();
}

function renderPaedsIvEntries() {
	const root = $("#pVaEntries");
	if (!root) return;
	root.innerHTML = "";
	paedsState.pIvEntries.forEach((e, i) => {
		const parts = [e.type];
		if (e.gauge) parts.push(e.gauge);
		if (e.site) parts.push(`— ${e.site}`);
		if (e.outcome) parts.push(`(${e.outcome})`);
		if (e.flushed) parts.push(`• ${e.flushed}`);
		if (e.fluids) parts.push(`+ ${e.fluids}`);
		const row = document.createElement("div");
		row.className = "ausc-entry";
		row.innerHTML = `<span>${parts.join(" ")}</span><button type="button" data-remove-pva="${i}" aria-label="Remove">×</button>`;
		root.append(row);
	});
}

function addPaedsDrugEntry() {
	const drug =
		val("pDrugName") === "Other" ? val("pDrugNameOther") : val("pDrugName");
	if (!drug) return;
	paedsState.pDrugEntries.push({
		drug,
		dose: val("pDrugDose"),
		route: val("pDrugRoute"),
		time: val("pDrugTime"),
		response: val("pDrugSingleResponse"),
	});
	[
		"pDrugName",
		"pDrugNameOther",
		"pDrugDose",
		"pDrugRoute",
		"pDrugTime",
		"pDrugSingleResponse",
	].forEach((id) => {
		const el = $(`#${id}`);
		if (el) el.value = "";
	});
	$("#pDrugNameOther")?.classList.add("hidden");
	$$("[data-radio-group='pDrugRoute'] [data-value]").forEach((c) =>
		c.classList.remove("selected"),
	);
	renderPaedsDrugEntries();
}

function renderPaedsDrugEntries() {
	const root = $("#pDrugEntries");
	if (!root) return;
	root.innerHTML = "";
	paedsState.pDrugEntries.forEach((e, i) => {
		const parts = [e.drug];
		if (e.dose) parts.push(e.dose);
		if (e.route) parts.push(`via ${e.route}`);
		if (e.time) parts.push(`at ${e.time}`);
		if (e.response) parts.push(`— ${e.response}`);
		const row = document.createElement("div");
		row.className = "ausc-entry";
		row.innerHTML = `<span>${parts.join(" ")}</span><div style="display:flex;gap:4px"><button type="button" class="repeat-drug-btn" data-repeat-pdrug="${i}" aria-label="Repeat dose">↺</button><button type="button" data-remove-pdrug="${i}" aria-label="Remove">×</button></div>`;
		root.append(row);
	});
}

function repeatPaedsDrugEntry(index) {
	const e = paedsState.pDrugEntries[index];
	if (!e) return;
	const now = new Date();
	const hh = String(now.getHours()).padStart(2, "0");
	const mm = String(now.getMinutes()).padStart(2, "0");
	const nameEl = $("#pDrugName");
	if (nameEl) {
		nameEl.value = e.drug;
		nameEl.dispatchEvent(new Event("input"));
	}
	const doseEl = $("#pDrugDose");
	if (doseEl) doseEl.value = e.dose || "";
	const timeEl = $("#pDrugTime");
	if (timeEl) timeEl.value = `${hh}:${mm}`;
	// Re-select route chip
	if (e.route) setRadioChip("pDrugRoute", e.route);
	nameEl?.scrollIntoView({ behavior: "smooth", block: "center" });
	nameEl?.focus();
}

function buildPaedsTxText() {
	const lines = [];

	if (paedsState.pAirwayInterventions.size)
		lines.push(
			`Airway / breathing: ${[...paedsState.pAirwayInterventions].join(", ")}`,
		);

	if (paedsState.pIvEntries.length) {
		lines.push("Vascular access:");
		paedsState.pIvEntries.forEach((e) => {
			const parts = [e.type];
			if (e.gauge) parts.push(e.gauge);
			if (e.site) parts.push(`— ${e.site}`);
			if (e.outcome) parts.push(`(${e.outcome})`);
			if (e.flushed) parts.push(`• ${e.flushed}`);
			if (e.fluids) parts.push(`+ ${e.fluids}`);
			lines.push(`  ${parts.join(" ")}`);
		});
	}

	if (paedsState.pDrugEntries.length) {
		lines.push("Medications given:");
		paedsState.pDrugEntries.forEach((e) => {
			const parts = [e.drug];
			if (e.dose) parts.push(e.dose);
			if (e.route) parts.push(`via ${e.route}`);
			if (e.time) parts.push(`at ${e.time}`);
			if (e.response) parts.push(`— ${e.response}`);
			lines.push(`  ${parts.join(" ")}`);
		});
	}

	if (paedsState.pWoundInterventions.size)
		lines.push(
			`Wound management: ${[...paedsState.pWoundInterventions].join(", ")}`,
		);

	if (paedsState.pPositioningInterventions.size)
		lines.push(
			`Positioning: ${[...paedsState.pPositioningInterventions].join(", ")}`,
		);

	if (val("pOtherTx")) lines.push(`Other: ${val("pOtherTx")}`);
	if (val("pTxResponse"))
		lines.push(`Treatment response: ${val("pTxResponse")}`);

	return lines.join("\n");
}

function buildPaedsClinChangesText() {
	const changes = val("pClinChanges");
	return changes ? `Clinical changes during assessment:\n${changes}` : "";
}

function buildPaedsWetflagText() {
	const w = val("pWetflagWeight") || val("pWeight");
	const data = calcWetflag(w);
	if (!data) return "";
	return [
		`WETFLAG Reference — ${data.weight}`,
		`W (Weight):    ${data.weight}`,
		`E (Energy):    ${data.energy}`,
		`T (Tube):      ${data.tube}`,
		`F (Fluid):     ${data.fluid}`,
		`L (Lorazepam): ${data.lorazepam}`,
		`A (Adrenaline):${data.adrenaline}`,
		`G (Glucose):   ${data.glucose}`,
		``,
		`Verify with JRCALC Plus before administration.`,
	].join("\n");
}

// PAEDIATRIC CONVEYANCE
// Conveyance transfer checklist chips, destination/department, and conveyance
// summary text builder for the paeds ePRF.

function buildPConveyTransferChips() {
	const root = $("#pConveyTransferGrid");
	if (!root) return;
	CONVEY_TRANSFER.forEach(([normal, abnormal]) => {
		const button = document.createElement("button");
		button.type = "button";
		button.className = "square-btn p-convey-chip selected";
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

function togglePConveyChip(button) {
	const isAbnormal = button.dataset.conveyState === "abnormal";
	const next = isAbnormal ? "normal" : "abnormal";
	button.dataset.conveyState = next;
	button.classList.toggle("abnormal", next === "abnormal");
	button.classList.toggle("selected", next === "normal");
	button.textContent =
		next === "abnormal" ? button.dataset.abnormal : button.dataset.normal;
	if (button.dataset.clinicalChange) {
		$("#pConveyChangeWrap")?.classList.toggle("hidden", next !== "abnormal");
	}
	if (button.dataset.escalated) {
		$("#pConveyEscalatedWrap")?.classList.toggle("hidden", next !== "abnormal");
	}
	if (button.dataset.clinicalChange && next === "abnormal") {
		const stable = $(
			'.p-convey-chip[data-normal="Remained stable throughout"]',
		);
		if (stable?.dataset.conveyState === "normal") togglePConveyChip(stable);
	}
}

function handlePConveyanceDisplay() {
	const decision = val("pConveyDecision");
	const conveyed = decision === "Conveyed";
	const notConveyed = decision !== "" && !conveyed;
	$("#pConveyedFields")?.classList.toggle("hidden", !conveyed);
	$("#pNonConveyedFields")?.classList.toggle("hidden", !notConveyed);
	const pWorseningMode = $("#pWorseningMode");
	if (pWorseningMode) pWorseningMode.value = conveyed ? "na" : "standard";
	updatePaedsWorseningScript();
	if (!conveyed) return;
	$("#pHospitalOtherWrap")?.classList.toggle(
		"hidden",
		val("pConveyHospital") !== "Other hospital",
	);
	const dept = val("pConveyDepartment");
	$("#pWardDetailsWrap")?.classList.toggle("hidden", dept !== "Ward");
	$("#pDepartmentOtherWrap")?.classList.toggle(
		"hidden",
		dept !== "Other department",
	);
}

function buildPConveyDestination() {
	const hospital =
		val("pConveyHospital") === "Other hospital"
			? val("pConveyHospitalOther")
			: val("pConveyHospital");
	let department = val("pConveyDepartment");
	if (department === "Ward") {
		const ward = val("pConveyWard");
		department = ward ? `Ward — ${ward}` : "Ward";
	} else if (department === "Other department") {
		department = val("pConveyDepartmentOther") || "Other department";
	}
	return [hospital, department].filter(Boolean).join("; ");
}

function getPConveyTransferText() {
	return $$(".p-convey-chip")
		.map((chip) => chip.textContent)
		.join("; ");
}

function buildPaedsConsentText() {
	const consent = val("pConsentType");
	const notes = val("pConsentNotes");
	const lines = [];
	if (consent) lines.push(`Consent / authority: ${consent}`);
	if (notes) lines.push(`Notes: ${notes}`);
	return lines.join("\n");
}

function buildPaedsConveyText() {
	const decision = val("pConveyDecision");
	const notes = val("pConveyNotes");
	if (decision === "Conveyed") {
		const destination = buildPConveyDestination();
		const transferText = getPConveyTransferText();
		const changeDetail = val("pConveyChangeDetail");
		const escalatedDetail = val("pConveyEscalatedDetail");
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
			val("pConveyTransferNotes")
				? `Transfer / handover notes: ${val("pConveyTransferNotes")}`
				: null,
			notes ? `Additional notes: ${notes}` : null,
		].filter(Boolean);
		return lines.join("\n");
	}
	const checks = [
		isChecked("pRiskExplained") && "risks explained",
		isChecked("pAlternativesDiscussed") && "alternatives discussed",
		isChecked("pUnderstandsRisk") && "parent / carer understands risks",
		isChecked("pCanRecontact") && "advised they can recontact 999/111",
	]
		.filter(Boolean)
		.join("; ");
	return `${decision || "Not documented"}. Referred/signposted to: ${listSet(state.pReferrals, "not documented")}. ${val("pFollowUp") ? val("pFollowUp") + ". " : ""}${checks ? `Safety netting: ${checks}.` : ""}${notes ? " " + notes : ""}`.trim();
}

function buildPaedsWorseningScript() {
	const pc = val("pPc");
	const pcData = PAEDS_WORSENING_PC[pc];
	const conveyed = val("pConveyDecision") === "Conveyed";
	const custom = val("pWorseningCustom");

	const genericLines = PAEDS_WORSENING_GENERIC.map((i) => `• ${i}`).join("\n");

	let script = `"Call 999 immediately if:\n`;

	if (pcData?.call999?.length) {
		script += pcData.call999.map((i) => `• ${i}`).join("\n");
		script += `\n\nAlso call 999 for any of these general warning signs:\n${genericLines}`;
	} else {
		script += genericLines;
	}

	if (pcData?.call111?.length) {
		script += `\n\nCall 111 or see your GP urgently if:\n`;
		script += pcData.call111.map((i) => `• ${i}`).join("\n");
	}

	if (pcData?.guidance) {
		script += `\n\nAdditional guidance:\n${pcData.guidance}`;
	}

	if (custom) {
		script += `\n\n${custom}`;
	}

	if (conveyed) {
		script += `\n\nYour child has been taken to hospital today for further assessment and treatment.`;
	} else {
		script += `\n\nIf you are ever unsure whether something is an emergency, always call 999 — it is better to call and check. You can also call 111 for non-emergency advice at any time."`;
	}

	return script;
}

function updatePaedsWorseningScript() {
	const mode = val("pWorseningMode");
	const scriptWrap = $("#pWorseningScriptWrap");
	const naWrap = $("#pWorseningNaWrap");
	const display = $("#pWorseningScriptDisplay");
	if (!scriptWrap || !naWrap || !display) return;

	const isNa = mode === "na";
	scriptWrap.classList.toggle("hidden", isNa);
	naWrap.classList.toggle("hidden", !isNa);

	if (!isNa) {
		display.textContent = buildPaedsWorseningScript();
	}
}

function buildPaedsWorseningText() {
	const mode = val("pWorseningMode");
	if (mode === "na")
		return "Patient conveyed — worsening advice not applicable for this episode.";

	const script = buildPaedsWorseningScript();
	const lines = [script];
	const checks = [
		[
			isChecked("pAdviceUnderstood"),
			"Advice given and confirmed understood by parent / carer",
		],
		[
			isChecked("pFeverAdviceGiven"),
			"Fever / temperature management advice given",
		],
		[isChecked("pFluidAdviceGiven"), "Hydration / feeding advice given"],
		[
			isChecked("pRecontactAdvice"),
			"Parent / carer advised to call 999 / 111 if concerned",
		],
	];
	const confirmed = checks.filter(([c]) => c).map(([, l]) => l);
	if (confirmed.length) lines.push(`\nConfirmed: ${confirmed.join("; ")}`);
	return lines.join("\n");
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
	const text = outputSectionTexts.get(sectionId);
	if (text) await copyText(text);
}

// SECTION CARD ENHANCEMENTS
// Adds context-sensitive hint text and copy-section shortcut buttons to
// each collapsible section card after all content is built.

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

// DARK MODE TOGGLE
// Persists the user's theme preference to localStorage.

(function () {
	const STORAGE_KEY = "crewmate-theme";
	const toggle = document.getElementById("themeToggle");
	const themeMeta = document.querySelector('meta[name="theme-color"]');

	function applyTheme(theme) {
		const root = document.documentElement;
		const isDark = theme === "dark";

		root.setAttribute("data-theme", theme);

		if (toggle) {
			toggle.setAttribute(
				"aria-label",
				isDark ? "Switch to light mode" : "Switch to dark mode",
			);

			toggle.setAttribute("aria-pressed", String(isDark));
		}

		if (themeMeta) {
			themeMeta.setAttribute("content", isDark ? "#0f1720" : "#075985");
		}
	}

	const savedTheme = localStorage.getItem(STORAGE_KEY);

	const initialTheme = savedTheme || "light";

	applyTheme(initialTheme);

	if (toggle) {
		toggle.addEventListener("click", function () {
			const currentTheme =
				document.documentElement.getAttribute("data-theme") || "light";

			const nextTheme = currentTheme === "dark" ? "light" : "dark";

			localStorage.setItem(STORAGE_KEY, nextTheme);

			applyTheme(nextTheme);
		});
	}
})();

// RESPIRATORY RATE COUNTER
// Standalone timed tapping tool for counting respiratory rate.

const respCounter = {
	duration: 30,
	running: false,
	startTime: null,
	endTime: null,
	count: 0,
	timerId: null,
};

function initRespCounter() {
	const durationSelect = $("#respDuration");
	const startButton = $("#respStartButton");
	const resetButton = $("#respResetButton");
	const tapButton = $("#respTapButton");

	durationSelect?.addEventListener("change", () => {
		if (!respCounter.running) {
			respCounter.duration = Number(durationSelect.value || 30);
			resetRespCounter(false);
		}
	});

	startButton?.addEventListener("click", startRespCounter);
	resetButton?.addEventListener("click", () => resetRespCounter());
	tapButton?.addEventListener("click", () => {
		recordRespTap();
	});
}

function startRespCounter() {
	const durationSelect = $("#respDuration");
	respCounter.duration = Number(durationSelect?.value || 30);
	respCounter.running = true;
	respCounter.count = 0;
	respCounter.startTime = Date.now();
	respCounter.endTime = respCounter.startTime + respCounter.duration * 1000;

	$("#respResultCard")?.classList.add("hidden");
	$("#respDuration")?.setAttribute("disabled", "true");
	if ($("#respStartButton")) $("#respStartButton").textContent = "Counting...";
	if ($("#respTapLabel")) $("#respTapLabel").textContent = "Tap breath";

	clearInterval(respCounter.timerId);
	respCounter.timerId = setInterval(updateRespCounterDisplay, 200);
	updateRespCounterDisplay();
}

function recordRespTap() {
	if (!respCounter.running) return;
	respCounter.count += 1;
	updateRespCounterDisplay();

	const btn = $("#respTapButton");
	btn?.classList.remove("pulse");
	void btn?.offsetWidth;
	btn?.classList.add("pulse");
}

function updateRespCounterDisplay() {
	const now = Date.now();
	const elapsedSeconds = respCounter.startTime
		? Math.max((now - respCounter.startTime) / 1000, 0.1)
		: 0.1;
	const remaining = respCounter.endTime
		? Math.max(Math.ceil((respCounter.endTime - now) / 1000), 0)
		: respCounter.duration;

	const liveRate = Math.round((respCounter.count / elapsedSeconds) * 60);

	if ($("#respLiveRate"))
		$("#respLiveRate").textContent = String(liveRate || 0);
	if ($("#respTimeLeft")) $("#respTimeLeft").textContent = String(remaining);
	if ($("#respTapCount"))
		$("#respTapCount").textContent = String(respCounter.count);

	if (respCounter.running && now >= respCounter.endTime) finishRespCounter();
}

function finishRespCounter() {
	respCounter.running = false;
	clearInterval(respCounter.timerId);

	const rate = Math.round((respCounter.count / respCounter.duration) * 60);

	if ($("#respLiveRate")) $("#respLiveRate").textContent = String(rate);
	if ($("#respTimeLeft")) $("#respTimeLeft").textContent = "0";
	if ($("#respResultTotal"))
		$("#respResultTotal").textContent = String(respCounter.count);
	if ($("#respResultDuration"))
		$("#respResultDuration").textContent = String(respCounter.duration);
	if ($("#respResultRate"))
		$("#respResultRate").textContent = `${rate} resp/min`;

	const isAbnormal = rate < 12 || rate > 20;
	const resultCard = $("#respResultCard");
	resultCard?.classList.remove("hidden");
	resultCard?.classList.toggle("resp-result-card--abnormal", isAbnormal);
	$("#respDuration")?.removeAttribute("disabled");
	if ($("#respStartButton")) $("#respStartButton").textContent = "Start again";
	if ($("#respTapLabel")) $("#respTapLabel").textContent = "Count complete";
}

function resetRespCounter(clearResult = true) {
	clearInterval(respCounter.timerId);
	respCounter.duration = Number($("#respDuration")?.value || 30);
	respCounter.running = false;
	respCounter.startTime = null;
	respCounter.endTime = null;
	respCounter.count = 0;
	respCounter.timerId = null;

	if ($("#respLiveRate")) $("#respLiveRate").textContent = "0";
	if ($("#respTimeLeft"))
		$("#respTimeLeft").textContent = String(respCounter.duration);
	if ($("#respTapCount")) $("#respTapCount").textContent = "0";
	if ($("#respStartButton")) $("#respStartButton").textContent = "Start count";
	if ($("#respTapLabel"))
		$("#respTapLabel").textContent = "Start & tap breaths";

	$("#respDuration")?.removeAttribute("disabled");
	if (clearResult) {
		const rc = $("#respResultCard");
		rc?.classList.add("hidden");
		rc?.classList.remove("resp-result-card--abnormal");
	}
}
