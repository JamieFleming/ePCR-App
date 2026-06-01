export const WORSENING_GENERIC = [
	"chest pain",
	"sudden difficulty breathing or SOB",
	"FAST symptoms — face drooping, arm weakness, or speech difficulty",
	"LOC or collapse",
	"seizures",
	"heavy uncontrolled bleeding",
];

export const WORSENING_PC = {
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
