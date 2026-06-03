import { $, $$, val, isChecked } from "../utils/dom.js";
import { OPTIONS } from "../data/options.js";

function buildMhSection() {
	buildButtonGrid(
		"mhIntentGrid",
		OPTIONS.mentalHealth.intent,
		"mhGroup",
		"intent",
		"mhValue",
	);
	buildButtonGrid(
		"mhPlanningGrid",
		OPTIONS.mentalHealth.planning,
		"mhGroup",
		"planning",
		"mhValue",
	);
	buildButtonGrid(
		"odPrescribedGrid",
		OPTIONS.mentalHealth.overdose,
		"mhGroup",
		"odPrescribed",
		"mhValue",
	);
	buildButtonGrid(
		"shMethodGrid",
		OPTIONS.mentalHealth.selfharm.method,
		"mhGroup",
		"shMethod",
		"mhValue",
	);
	buildButtonGrid(
		"shDepthGrid",
		OPTIONS.mentalHealth.selfharm.depth,
		"mhGroup",
		"shDepth",
		"mhValue",
	);
	buildButtonGrid(
		"mseAppearanceGrid",
		OPTIONS.mentalHealth.appearance,
		"mhGroup",
		"mseAppearance",
		"mhValue",
	);
	buildButtonGrid(
		"mseBehaviourGrid",
		OPTIONS.mentalHealth.behaviour,
		"mhGroup",
		"mseBehaviour",
		"mhValue",
	);
	buildButtonGrid(
		"mseSpeechGrid",
		OPTIONS.mentalHealth.speech,
		"mhGroup",
		"mseSpeech",
		"mhValue",
	);
	buildButtonGrid(
		"mseThoughtContentGrid",
		OPTIONS.mentalHealth.thought.content,
		"mhGroup",
		"mseThoughtContent",
		"mhValue",
	);
	buildButtonGrid(
		"mseAffectGrid",
		OPTIONS.mentalHealth.affect,
		"mhGroup",
		"mseAffect",
		"mhValue",
	);
	buildButtonGrid(
		"mseThoughtFormGrid",
		OPTIONS.mentalHealth.thought.form,
		"mhGroup",
		"mseThoughtForm",
		"mhValue",
	);
	buildButtonGrid(
		"msePerceptionGrid",
		OPTIONS.mentalHealth.perception,
		"mhGroup",
		"msePerception",
		"mhValue",
	);
	buildButtonGrid(
		"mseInsightGrid",
		OPTIONS.mentalHealth.insight,
		"mhGroup",
		"mseInsight",
		"mhValue",
	);

	const actTypeEl = $("#mhActType");
	if (actTypeEl) {
		const shMethods = OPTIONS.mentalHealth.selfharm.method;
		shMethods.forEach((method) => {
			const opt = document.createElement("option");
			opt.value = `Self-harm — ${method}`;
			opt.textContent = `Self-harm — ${method}`;
			actTypeEl.appendChild(opt);
		});
		OPTIONS.mentalHealth.suicideAttempt.method.forEach((method) => {
			const opt = document.createElement("option");
			opt.value = `Suicide attempt — ${method}`;
			opt.textContent = `Suicide attempt — ${method}`;
			actTypeEl.appendChild(opt);
		});
	}

	$("#mhActsAdmit")?.addEventListener("change", () => {
		const admits = val("mhActsAdmit") === "Admits";
		$("#mhActsPanel")?.classList.toggle("hidden", !admits);
		if (!admits) {
			const typeEl = $("#mhActType");
			if (typeEl) typeEl.value = "";
			$("#odDetailsWrap")?.classList.add("hidden");
			$("#shDetailsWrap")?.classList.add("hidden");
			$("#mhActOtherWrap")?.classList.add("hidden");
		}
	});

	$("#mhActType")?.addEventListener("change", () => {
		const type = val("mhActType");
		const isOd = type === "Overdose";
		const isSh = type.startsWith("Self-harm");
		const showOther = type.endsWith("Other");
		$("#odDetailsWrap")?.classList.toggle("hidden", !isOd);
		$("#shDetailsWrap")?.classList.toggle("hidden", !isSh);
		$("#mhActOtherWrap")?.classList.toggle("hidden", !showOther);
	});

	$("#addMhActButton")?.addEventListener("click", addMhActEntry);
}

function addMhActEntry() {
	const state = window.CrewMateApp.getState();
	const type = val("mhActType");
	if (!type) return;
	const entry = {
		type,
		atTime: val("mhActAtTime"),
		agoTime: val("mhActAgoTime"),
	};
	if (type === "Overdose") {
		entry.substance = val("odSubstance");
		entry.amount = val("odAmount");
		entry.route = val("odRoute");
		entry.alcohol = isChecked("odAlcohol");
		entry.source = [...state.odPrescribed];
		["odSubstance", "odAmount", "odRoute"].forEach((id) => {
			const el = $(`#${id}`);
			if (el) el.value = "";
		});
		const cb = $("#odAlcohol");
		if (cb) cb.checked = false;
		state.odPrescribed.clear();
		$$(
			"[data-radio-group='odRoute'] [data-value], #odPrescribedGrid .square-btn",
		).forEach((b) => b.classList.remove("selected"));
	} else if (type.startsWith("Self-harm")) {
		entry.depth = [...state.shDepth];
		state.shDepth.clear();
		$$("#shDepthGrid .square-btn").forEach((b) =>
			b.classList.remove("selected"),
		);
		if (type.endsWith("Other")) {
			entry.notes = val("mhActNotes");
		}
	} else {
		if (type.endsWith("Other")) {
			entry.notes = val("mhActNotes");
		}
	}
	if (entry.notes !== undefined) {
		const el = $("#mhActNotes");
		if (el) el.value = "";
	}
	state.mhActs.push(entry);
	["mhActType", "mhActAtTime", "mhActAgoTime"].forEach((id) => {
		const el = $(`#${id}`);
		if (el) el.value = "";
	});
	$("#odDetailsWrap")?.classList.add("hidden");
	$("#shDetailsWrap")?.classList.add("hidden");
	$("#mhActOtherWrap")?.classList.add("hidden");
	renderMhActEntries();
}

function renderMhActEntries() {
	const state = window.CrewMateApp.getState();
	const root = $("#mhActEntries");
	if (!root) return;
	root.innerHTML = "";
	state.mhActs.forEach((entry, index) => {
		const div = document.createElement("div");
		div.className = "ausc-entry";
		const timeParts = [
			entry.atTime ? `at ${entry.atTime}` : "",
			entry.agoTime || "",
		]
			.filter(Boolean)
			.join(", ");
		const parts = [entry.type];
		if (timeParts) parts.push(`(${timeParts})`);
		if (entry.substance) parts.push(`— ${entry.substance}`);
		if (entry.amount) parts.push(entry.amount);
		if (entry.route) parts.push(`via ${entry.route}`);
		if (entry.depth?.length) parts.push(`— ${entry.depth.join(", ")}`);
		if (entry.notes) parts.push(`— ${entry.notes}`);
		div.innerHTML = `<span>${parts.join(" ")}</span><button type="button" data-remove-mhact="${index}" aria-label="Remove">×</button>`;
		root.append(div);
	});
}

function buildMhAssessmentText() {
	const state = window.CrewMateApp.getState();
	const lines = [];
	if (state.mhIntent.size)
		lines.push(`Intent: ${[...state.mhIntent].join(", ")}`);
	if (state.mhPlanning.size)
		lines.push(`Nature of act: ${[...state.mhPlanning].join(", ")}`);
	if (val("mhTriggers"))
		lines.push(`Triggers / precipitants: ${val("mhTriggers")}`);
	if (isChecked("mhPrevious")) {
		lines.push(
			`Previous episodes: ${val("mhPreviousDetails") || "Yes — details not documented"}`,
		);
	}
	const actsAdmit = val("mhActsAdmit");
	if (state.mhActs.length) {
		lines.push("Patient admits to:");
		state.mhActs.forEach((entry) => {
			const timeParts = [
				entry.atTime ? `at ${entry.atTime}` : "",
				entry.agoTime || "",
			]
				.filter(Boolean)
				.join(", ");
			const parts = [entry.type];
			if (timeParts) parts.push(`Time: ${timeParts}`);
			if (entry.substance) parts.push(`Substance: ${entry.substance}`);
			if (entry.amount) parts.push(`Amount: ${entry.amount}`);
			if (entry.route) parts.push(`Route: ${entry.route}`);
			if (entry.alcohol) parts.push("Alcohol co-ingestion");
			if (entry.source?.length)
				parts.push(`Source: ${entry.source.join(", ")}`);
			if (entry.depth?.length) parts.push(`Depth: ${entry.depth.join(", ")}`);
			if (entry.notes) parts.push(entry.notes);
			lines.push(`  ${parts.join(". ")}`);
		});
	} else if (actsAdmit === "Denies") {
		lines.push("Patient denies any self-harm, overdose, or harmful acts.");
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
		.map(([s, label]) => `${label}: ${[...s].join(", ")}`);
	if (mseLines.length) lines.push("MSE — " + mseLines.join(" "));
	if (val("mhCurrentServices"))
		lines.push(`Current MH services: ${val("mhCurrentServices")}`);
	if (val("mhS136")) lines.push(`S136 / MHA: ${val("mhS136")}`);
	if (val("mhNotes")) lines.push(val("mhNotes"));
	return lines.length
		? lines.join("\n")
		: "No MH assessment details documented.";
}

export function initMhAssessment() {
	buildMhSection();
}

window.CrewMateMh = { buildMhAssessmentText, renderMhActEntries };
