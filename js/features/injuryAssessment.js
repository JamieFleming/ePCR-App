import { $, $$, val, isChecked } from "../utils/dom.js";
import { OPTIONS } from "../data/options.js";

let pendingInjuryTypes = new Set();
let pendingInjuryInterventions = new Set();
let pendingInjuryNv = {};

function buildInjurySection() {
	const typeGrid = $("#injuryTypeGrid");
	const intGrid = $("#injuryInterventionGrid");
	if (!typeGrid || !intGrid) return;
	const nvGrid = $("#injuryNvGrid");
	if (nvGrid) {
		OPTIONS.injury.neurovascular.forEach(({ key, normal, abnormal }) => {
			pendingInjuryNv[key] = "normal";
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "square-btn selected";
			btn.textContent = normal;
			btn.dataset.injuryNv = key;
			btn.dataset.normal = normal;
			btn.dataset.abnormal = abnormal;
			nvGrid.append(btn);
		});
	}
	const regionSelect = $("#injuryRegion");
	if (regionSelect) {
		OPTIONS.injury.regions.forEach(({ group, items }) => {
			const og = document.createElement("optgroup");
			og.label = group;
			items.forEach((item) => {
				const opt = document.createElement("option");
				opt.textContent = item;
				og.append(opt);
			});
			regionSelect.append(og);
		});
	}
	OPTIONS.injury.type.forEach((type) => {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "square-btn";
		btn.textContent = type;
		btn.dataset.injuryType = type;
		typeGrid.append(btn);
	});
	OPTIONS.injury.interventions.forEach((item) => {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "square-btn";
		btn.textContent = item;
		btn.dataset.injuryIntervention = item;
		intGrid.append(btn);
	});
	populateChipGroup("spinalClearance", OPTIONS.spinal.clearance);
	populateChipGroup("spinalTenderness", OPTIONS.spinal.tenderness);
	populateChipGroup("spinalNeuro", OPTIONS.spinal.neuro);

	$("#addInjuryButton")?.addEventListener("click", addInjuryEntry);
	$("#injuryRegion")?.addEventListener("change", () => {
		const region = val("injuryRegion");
		const headRegions = ["Head", "Face, Scalp", "Neck"];
		const spinalRegions = ["Upper back", "Lower back", "Neck"];
		$("#headInjuryCard")?.classList.toggle(
			"hidden",
			!headRegions.includes(region),
		);
		$("#spinalAssessmentCard")?.classList.toggle(
			"hidden",
			!spinalRegions.includes(region),
		);
	});

	$$("[data-radio-group='spinalNeuro'] [data-value]").forEach((btn) => {
		btn.addEventListener("click", () => {
			$("#spinalNeuroDetailWrap")?.classList.toggle(
				"hidden",
				btn.dataset.value !== "Present",
			);
		});
	});
}

function addInjuryEntry() {
	const state = window.CrewMateApp.getState();
	const region = val("injuryRegion");
	if (!region) return;

	const typeOther = val("injuryTypeOther");
	const intOther = val("injuryIntOther");
	const types = [...pendingInjuryTypes].map((t) =>
		t === "Other" && typeOther ? typeOther : t,
	);
	const interventions = [...pendingInjuryInterventions].map((i) =>
		i === "Other" && intOther ? intOther : i,
	);
	const nvAbnormal = OPTIONS.injury.neurovascular
		.filter(({ key }) => pendingInjuryNv[key] === "abnormal")
		.map(({ abnormal }) => abnormal);
	const nvNotes = val("injuryNvNotes");
	const nv = nvAbnormal.length
		? [...nvAbnormal, ...(nvNotes ? [nvNotes] : [])]
		: nvNotes
			? [nvNotes]
			: [];

	state.injuryEntries.push({
		region,
		types,
		nv,
		interventions,
	});

	pendingInjuryTypes.clear();
	pendingInjuryInterventions.clear();
	OPTIONS.injury.neurovascular.forEach(({ key, normal }) => {
		pendingInjuryNv[key] = "normal";
		const btn = $(`[data-injury-nv="${key}"]`);
		if (btn) {
			btn.classList.add("selected");
			btn.classList.remove("abnormal");
			btn.textContent = normal;
		}
	});
	$("#injuryRegion").value = "";
	const nvNotesEl = $("#injuryNvNotes");
	if (nvNotesEl) nvNotesEl.value = "";
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
	const state = window.CrewMateApp.getState();
	state.injuryEntries.splice(index, 1);
	renderInjuryEntries();
}

function renderInjuryEntries() {
	const state = window.CrewMateApp.getState();
	const root = $("#injuryEntries");
	if (!root) return;
	root.innerHTML = "";
	state.injuryEntries.forEach((entry, index) => {
		const row = document.createElement("div");
		row.className = "ausc-entry";
		const nvText = entry.nv?.length
			? `NV: ${entry.nv.join(", ")}`
			: "NV intact";
		const detail = [
			entry.types.join(", "),
			nvText,
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
	const state = window.CrewMateApp.getState();
	if (!state.injuryEntries.length) return "No injuries documented.";
	return state.injuryEntries
		.map((entry) => {
			const nvText = entry.nv?.length
				? `NV: ${entry.nv.join(", ")}`
				: "NV intact";
			const parts = [
				entry.types.join(", "),
				nvText,
				entry.interventions.length
					? `Interventions: ${entry.interventions.join(", ")}`
					: "",
			]
				.filter(Boolean)
				.join(". ");
			return `${entry.region}: ${parts || "documented"}`;
		})
		.join("\n");
}

function buildHeadInjuryText() {
	const state = window.CrewMateApp.getState();
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

	const gcsE = parseInt($("#headGcsEye")?.dataset.gcsSelected || "", 10) || 0;
	const gcsV =
		parseInt($("#headGcsVerbal")?.dataset.gcsSelected || "", 10) || 0;
	const gcsM = parseInt($("#headGcsMotor")?.dataset.gcsSelected || "", 10) || 0;
	const gcsTotal = gcsE && gcsV && gcsM ? gcsE + gcsV + gcsM : 0;
	const gcsSuffix = gcsTotal
		? ` GCS ${gcsTotal}/15 (E${gcsE} V${gcsV} M${gcsM}).`
		: "";
	const anticoagSuffix =
		val("headAnticoag") === "Yes" ? " On anticoagulants." : "";
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

function buildSpinalText() {
	const clearance = val("spinalClearance");
	if (!clearance) return null;
	const lines = [];
	lines.push(`C-spine: ${clearance}`);
	if (val("spinalMechanism"))
		lines.push(`Mechanism: ${val("spinalMechanism")}`);
	const tenderness = val("spinalTenderness");
	if (tenderness) lines.push(`Midline tenderness: ${tenderness}`);
	const neuro = val("spinalNeuro");
	if (neuro === "Present") {
		const detail = val("spinalNeuroDetail");
		lines.push(`Neurological symptoms: Present${detail ? ` — ${detail}` : ""}`);
	} else if (neuro) {
		lines.push(`Neurological symptoms: ${neuro}`);
	}
	if (val("spinalLevel")) lines.push(`Suspected level: ${val("spinalLevel")}`);
	if (val("spinalNotes")) lines.push(val("spinalNotes"));
	return lines.join("\n");
}

export function initInjuryAssessment() {
	buildInjurySection();
}

window.CrewMateInjury = {
	buildInjuryText,
	buildSpinalText,
	renderInjuryEntries,
	removeInjuryEntry,
	addInjuryEntry,
	pendingInjuryInterventions,
	pendingInjuryTypes,
	pendingInjuryNv,
	buildHeadInjuryText,
};
