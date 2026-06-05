import { $, $$, val } from "../utils/dom.js";
import { getPc, rfSystolic } from "../utils/helpers.js";
import { state } from "../app.js";

function rfPc(term) {
	return getPc().toLowerCase().includes(term.toLowerCase());
}
function rfAbcAbnormal(section, label) {
	return $$(`[data-abc="${section}"]`).some(
		(b) => b.dataset.abcState === "abnormal" && b.dataset.abnormal === label,
	);
}
function rfAnySectionAbnormal(section) {
	return $$(`[data-abc="${section}"]`).some(
		(b) => b.dataset.abcState === "abnormal",
	);
}
function rfAssoc(term) {
	return state.associated.has(term);
}
function rfChar(term) {
	return state.character.has(term);
}
function rfEcg(term) {
	return state.ecgFindings.has(term);
}
function rfHR() {
	return parseInt(val("hr"));
}
function rfRR() {
	return parseInt(val("rr"));
}
function rfSpo2() {
	return parseInt(val("spo2"));
}
function rfBm() {
	return parseFloat(val("bm"));
}
function rfGcs() {
	return parseInt(val("gcsScore"));
}
function rfHypotensive() {
	const s = rfSystolic();
	return s !== null && s < 90;
}
function rfTachycardic() {
	const h = rfHR();
	return !isNaN(h) && h > 100;
}
function rfBradycardic() {
	const h = rfHR();
	return !isNaN(h) && h < 50;
}
function rfHypoxic() {
	const s = rfSpo2();
	return !isNaN(s) && s < 94;
}
function rfTachypnoeic() {
	const r = rfRR();
	return !isNaN(r) && r > 20;
}
function rfHypertensive() {
	const s = rfSystolic();
	return s !== null && s >= 180;
}
function rfGcsReduced() {
	const g = rfGcs();
	return !isNaN(g) && g < 15;
}
function rfGcsCritical() {
	const g = rfGcs();
	return !isNaN(g) && g <= 8;
}

const RED_FLAGS = [
	// ── CARDIAC ───────────────────────────────────────────────────
	{
		id: "vf",
		level: "critical",
		title: "Ventricular fibrillation",
		body: "VF detected on ECG. Confirm pulselessness — if confirmed, treat as shockable cardiac arrest. Manage as per JRCALC guidelines.",
		check: () => rfEcg("VF"),
	},
	{
		id: "vt",
		level: "critical",
		title: "Ventricular tachycardia",
		body: "VT on ECG. Assess for pulse — if pulseless, treat as shockable arrest. If pulse present, assess haemodynamic stability. Manage as per JRCALC guidelines.",
		check: () => rfEcg("VT"),
	},
	{
		id: "stemi",
		level: "critical",
		title: "Possible STEMI",
		body: "ST elevation on ECG. Consider immediate PPCI centre activation and pre-alert. Manage as per JRCALC guidelines.",
		check: () => rfEcg("ST elevation"),
	},
	{
		id: "chb",
		level: "critical",
		title: "Complete heart block (3° CHB)",
		body: "Third-degree AV block on ECG. Pre-alert receiving unit. Manage as per JRCALC guidelines.",
		check: () => rfEcg("3° CHB"),
	},
	{
		id: "acs-shock",
		level: "critical",
		title: "ACS with haemodynamic compromise",
		body: "Chest pain with cold/clammy peripheries and hypotension — consistent with cardiogenic shock. High-risk STEMI/NSTEMI. Pre-alert receiving unit. Manage as per JRCALC guidelines.",
		check: () =>
			rfPc("chest pain") &&
			(rfAbcAbnormal("C", "Cold / clammy") ||
				rfAbcAbnormal("E", "Diaphoretic")) &&
			rfHypotensive(),
	},
	{
		id: "acs-classic",
		level: "high",
		title: "High-risk ACS features",
		body: "Chest pain with diaphoresis, radiation, or pressure character. Classic ACS pattern — early 12-lead ECG and pre-alert. Manage as per JRCALC guidelines.",
		check: () =>
			rfPc("chest pain") &&
			(rfAbcAbnormal("E", "Diaphoretic") || rfAssoc("Sweating")) &&
			(rfChar("Crushing / pressure") ||
				rfChar("Tight") ||
				rfChar("Squeezing") ||
				state.radiationParts.size > 0),
	},
	{
		id: "aortic-dissection",
		level: "critical",
		title: "Possible aortic dissection",
		body: "Tearing chest or back pain with haemodynamic compromise. Consider type A/B dissection — pre-alert receiving unit. Manage as per JRCALC guidelines.",
		check: () =>
			(rfPc("chest pain") || rfPc("back pain")) &&
			rfChar("Tearing") &&
			(rfHypotensive() || rfTachycardic()),
	},
	{
		id: "bradycardia-compromise",
		level: "high",
		title: "Bradycardia with haemodynamic compromise",
		body: "HR <50 with hypotension or reduced perfusion. Consider complete heart block, medication toxicity, or vagal cause. Pre-alert receiving unit. Manage as per JRCALC guidelines.",
		check: () =>
			rfBradycardic() &&
			(rfHypotensive() ||
				rfGcsReduced() ||
				rfAbcAbnormal("C", "Cold / clammy")),
	},
	// ── RESPIRATORY ───────────────────────────────────────────────
	{
		id: "resp-failure",
		level: "critical",
		title: "Respiratory failure",
		body: "SpO₂ <94% with increased work of breathing. Pre-alert receiving unit. Manage as per JRCALC guidelines.",
		check: () => rfHypoxic() && rfAnySectionAbnormal("B"),
	},
	{
		id: "pe-massive",
		level: "critical",
		title: "Massive / high-risk PE",
		body: "Chest pain/dyspnoea with tachycardia, hypoxia, and hypotension. Massive PE criteria — pre-alert receiving unit. Manage as per JRCALC guidelines.",
		check: () =>
			(rfPc("chest pain") || rfPc("shortness of breath")) &&
			rfTachycardic() &&
			rfHypoxic() &&
			rfHypotensive(),
	},
	{
		id: "pe-suspected",
		level: "high",
		title: "Possible pulmonary embolism",
		body: "Chest pain/dyspnoea with tachycardia and hypoxia. PE on differential — pre-alert receiving unit. Manage as per JRCALC guidelines.",
		check: () =>
			(rfPc("chest pain") || rfPc("shortness of breath")) &&
			rfTachycardic() &&
			rfHypoxic() &&
			!rfHypotensive(),
	},
	{
		id: "anaphylaxis",
		level: "critical",
		title: "Possible anaphylaxis",
		body: "Allergic reaction with airway/breathing/circulatory compromise. Anaphylaxis criteria — pre-alert receiving unit. Manage as per JRCALC guidelines.",
		check: () =>
			rfPc("allergic reaction") &&
			(rfAbcAbnormal("A", "Airway support required") ||
				rfAbcAbnormal("B", "Wheeze present") ||
				rfHypotensive() ||
				rfTachycardic()),
	},
	// ── NEUROLOGICAL ──────────────────────────────────────────────
	{
		id: "stroke",
		level: "critical",
		title: "Stroke / FAST positive",
		body: "Stroke suspected. Time-critical — identify nearest HASU and pre-alert. Record onset time. Manage as per JRCALC guidelines.",
		check: () => rfPc("stroke") || rfPc("fast positive"),
	},
	{
		id: "sah",
		level: "critical",
		title: "Possible subarachnoid haemorrhage",
		body: "Sudden severe 'thunderclap' headache is SAH until proven otherwise. Pre-alert receiving unit. Manage as per JRCALC guidelines.",
		check: () =>
			rfPc("headache") &&
			rfAssoc("Vomiting") &&
			(val("onsetType").toLowerCase().includes("sudden") ||
				val("hpc").toLowerCase().includes("thunderclap") ||
				val("hpc").toLowerCase().includes("worst")),
	},
	{
		id: "raised-icp",
		level: "high",
		title: "Possible raised intracranial pressure",
		body: "Headache with vomiting and reduced GCS. Consider Cushing's triad (hypertension, bradycardia, irregular respirations). Pre-alert receiving unit. Manage as per JRCALC guidelines.",
		check: () =>
			(rfPc("headache") || rfAssoc("Headache")) &&
			rfAssoc("Vomiting") &&
			rfGcsReduced(),
	},
	{
		id: "meningitis",
		level: "critical",
		title: "Possible meningococcal septicaemia / meningitis",
		body: "Fever with non-blanching rash. Consider meningococcal disease — pre-alert receiving unit. Manage as per JRCALC guidelines.",
		check: () =>
			(rfPc("fever") ||
				rfPc("sepsis") ||
				rfAssoc("Fever") ||
				rfAbcAbnormal("E", "Pyrexia")) &&
			rfAbcAbnormal("E", "Rash present"),
	},
	{
		id: "head-injury-gcs",
		level: "high",
		title: "Significant head injury with reduced GCS",
		body: "Head injury with altered consciousness. Consider intracranial bleed — pre-alert receiving unit. Manage as per JRCALC guidelines.",
		check: () => rfPc("head injury") && rfGcsReduced(),
	},
	// ── SEPSIS ────────────────────────────────────────────────────
	{
		id: "septic-shock",
		level: "critical",
		title: "Possible septic shock",
		body: "Suspected infection with hypotension and altered GCS. Septic shock criteria — pre-alert receiving unit. Manage as per JRCALC guidelines.",
		check: () =>
			(rfPc("sepsis") ||
				rfPc("fever") ||
				rfAssoc("Fever") ||
				rfAbcAbnormal("E", "Pyrexia")) &&
			rfHypotensive() &&
			rfGcsReduced(),
	},
	{
		id: "sepsis",
		level: "high",
		title: "Sepsis concern (NEWS2 trigger)",
		body: "Suspected infection with tachycardia and tachypnoea. Assess NEWS2 score — pre-alert receiving unit. Manage as per JRCALC guidelines.",
		check: () =>
			(rfPc("sepsis") ||
				rfPc("fever") ||
				rfAssoc("Fever") ||
				rfAbcAbnormal("E", "Pyrexia")) &&
			rfTachycardic() &&
			rfTachypnoeic(),
	},
	// ── VASCULAR / ABDOMINAL ──────────────────────────────────────
	{
		id: "aaa",
		level: "critical",
		title: "Possible ruptured AAA",
		body: "Abdominal pain with back pain and haemodynamic compromise. Ruptured AAA until proven otherwise — pre-alert receiving unit, do not delay transport. Manage as per JRCALC guidelines.",
		check: () =>
			rfPc("abdominal pain") &&
			rfAssoc("Back pain") &&
			(rfHypotensive() || rfAbcAbnormal("C", "Cold / clammy")),
	},
	{
		id: "gi-bleed-shock",
		level: "critical",
		title: "GI haemorrhage with haemodynamic compromise",
		body: "Haematemesis/melaena with cardiovascular compromise. Significant upper GI bleed — pre-alert receiving unit. Manage as per JRCALC guidelines.",
		check: () =>
			rfPc("haematemesis") &&
			(rfHypotensive() ||
				rfTachycardic() ||
				rfAbcAbnormal("C", "Cold / clammy")),
	},
	// ── SPINAL ────────────────────────────────────────────────────
	{
		id: "cauda-equina",
		level: "critical",
		title: "Cauda equina syndrome — red flag",
		body: "Back pain with lower limb neurology (numbness, weakness, tingling). Cauda equina syndrome until excluded — pre-alert receiving unit, do not delay transfer. Manage as per JRCALC guidelines.",
		check: () =>
			rfPc("back pain") &&
			(rfAssoc("Numbness") || rfAssoc("Weakness") || rfAssoc("Tingling")),
	},
	// ── DIABETIC ──────────────────────────────────────────────────
	{
		id: "hypoglycaemia",
		level: "high",
		title: "Hypoglycaemia with altered consciousness",
		body: "BM <4 mmol/L with reduced GCS. Pre-alert receiving unit. Manage as per JRCALC guidelines.",
		check: () => {
			const bm = rfBm();
			return !isNaN(bm) && bm < 4.0 && rfGcsReduced();
		},
	},
	{
		id: "hyperglycaemia-crisis",
		level: "high",
		title: "Possible DKA / HHS",
		body: "Elevated BM >15 mmol/L with vomiting, tachypnoea, or altered GCS. Consider DKA/HHS — pre-alert receiving unit. Manage as per JRCALC guidelines.",
		check: () => {
			const bm = rfBm();
			return (
				!isNaN(bm) &&
				bm > 15 &&
				(rfAssoc("Vomiting") || rfTachypnoeic() || rfGcsReduced())
			);
		},
	},
	// ── HYPERTENSIVE ──────────────────────────────────────────────
	{
		id: "hypertensive-emergency",
		level: "high",
		title: "Hypertensive emergency",
		body: "BP ≥180 mmHg systolic with end-organ symptoms. Pre-alert receiving unit. Manage as per JRCALC guidelines.",
		check: () =>
			rfHypertensive() &&
			(rfAssoc("Headache") ||
				rfPc("chest pain") ||
				rfAssoc("Visual change") ||
				rfGcsReduced()),
	},
	// ── ECG ───────────────────────────────────────────────────────
	{
		id: "heart-block-2",
		level: "high",
		title: "Second-degree AV block",
		body: "2° AV block on ECG. Monitor for progression to complete heart block — pre-alert receiving unit. Manage as per JRCALC guidelines.",
		check: () => rfEcg("2° AV block"),
	},
];

function evaluateRedFlags() {
	return RED_FLAGS.filter((rule) => {
		try {
			return rule.check();
		} catch (_) {
			return false;
		}
	});
}

function renderRedFlags() {
	const bar = $("#redFlagBar");
	if (!bar) return;
	const active = evaluateRedFlags();
	if (!active.length) {
		bar.classList.add("hidden");
		return;
	}
	bar.classList.remove("hidden");
	const hasCritical = active.some((f) => f.level === "critical");
	const hasHigh = active.some((f) => f.level === "high");
	bar.className = `rf-bar${hasCritical ? " rf-critical" : hasHigh ? " rf-high" : " rf-moderate"}`;
	// Preserve open state
	const isOpen = bar.dataset.open === "true";
	const summary = $("#rfSummary");
	if (summary) {
		const counts = { critical: 0, high: 0, moderate: 0 };
		active.forEach((f) => counts[f.level]++);
		const parts = [];
		if (counts.critical) parts.push(`${counts.critical} critical`);
		if (counts.high) parts.push(`${counts.high} high`);
		if (counts.moderate) parts.push(`${counts.moderate} moderate`);
		summary.textContent = `${active.length} clinical prompt${active.length !== 1 ? "s" : ""} · ${parts.join(", ")}`;
	}
	const cards = $("#rfCards");
	if (cards) {
		cards.innerHTML = "";
		[...active]
			.sort((a, b) => {
				const o = { critical: 0, high: 1, moderate: 2 };
				return o[a.level] - o[b.level];
			})
			.forEach((flag) => {
				const icon =
					flag.level === "critical"
						? "🔴"
						: flag.level === "high"
							? "🟠"
							: "🟡";
				const div = document.createElement("div");
				div.className = `rf-card ${flag.level}`;
				div.innerHTML = `<div class="rf-card-title">${icon} ${flag.title}</div><div class="rf-card-body">${flag.body}</div>`;
				cards.append(div);
			});
	}
}

let _rfTimer;
function scheduleRedFlags() {
	clearTimeout(_rfTimer);
	_rfTimer = setTimeout(() => {
		renderRedFlags();
		window.CrewMateOutput.renderConveyanceSuggestion();
	}, 200);
}

function bindRedFlagToggle() {
	$("#rfToggle")?.addEventListener("click", () => {
		const bar = $("#redFlagBar");
		const panel = $("#rfPanel");
		if (!bar || !panel) return;
		const open = bar.dataset.open === "true";
		bar.dataset.open = String(!open);
		panel.classList.toggle("hidden", open);
		$("#rfToggle")?.setAttribute("aria-expanded", String(!open));
	});
}

export {
	renderRedFlags,
	scheduleRedFlags,
	bindRedFlagToggle,
	evaluateRedFlags,
	RED_FLAGS,
};

export function initRedFlags() {
	bindRedFlagToggle();
	document.addEventListener("click", scheduleRedFlags, { passive: true });
	document.addEventListener("input", scheduleRedFlags, { passive: true });
	document.addEventListener("change", scheduleRedFlags, { passive: true });
}
