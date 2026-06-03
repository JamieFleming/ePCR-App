export const WORSENING_GENERIC = [
	"chest pain",
	"sudden difficulty breathing or SOB",
	"heavy uncontrolled bleeding",
	"FAST symptoms — face drooping, arm weakness, or speech difficulty",
	"LOC or collapse",
	"seizures",
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
			"any further falls",
			"inability to bear weight or mobilise",
			"new or worsening weakness or numbness in the legs",
			"loss of bladder or bowel control",
			"numbness or tingling in the saddle area (inner thighs, groin, or back passage)",
			"severe worsening pain",
		],
		redFlags:
			"Cauda equina red flags: loss of bladder or bowel control, saddle numbness (numbness of inner thighs, genitals, or back passage), bilateral leg weakness or numbness",
	},
	"Reduced mobility/Off legs": {
		items: [
			"any falls",
			"inability to bear weight or mobilise",
			"new or worsening weakness or numbness in the legs",
			"loss of bladder or bowel control",
			"numbness or tingling in the saddle area (inner thighs, groin, or back passage)",
			"severe worsening pain",
		],
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

export const PAEDS_WORSENING_GENERIC = [
	"breathing becomes very fast, noisy, or your child is working hard to breathe",
	"your child's lips, tongue or fingernails turn blue",
	"your child becomes very difficult to wake or does not respond to you",
	"your child has a fit (seizure) or repeated seizures",
	"a rash appears that does not fade when you press a glass firmly against it",
	"you notice signs of severe allergic reaction — throat swelling, difficulty swallowing, or collapse",
	"you are worried at any point — trust your instincts as a parent or carer",
];

export const PAEDS_WORSENING_PC = {
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

window.CrewMateWorsening = {
	WORSENING_GENERIC,
	WORSENING_PC,
	PAEDS_WORSENING_GENERIC,
	PAEDS_WORSENING_PC,
};
