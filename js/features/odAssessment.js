import {
	$,
	val,
	isChecked,
	buildButtonGrid,
	populateChipGroup,
} from "../utils/dom.js";
import { OPTIONS } from "../data/options.js";

function buildOdAssessmentSection() {
	const options = OPTIONS.mentalHealth;

	populateChipGroup(
		"odAssessIntentionality",
		options.odAssessment.intentionality,
	);

	const circumstanceSelect = $("#odAssessCircumstance");
	if (circumstanceSelect) {
		options.odAssessment.circumstance.forEach((c) => {
			const opt = document.createElement("option");
			opt.value = c;
			opt.textContent = c;
			circumstanceSelect.appendChild(opt);
		});
	}

	buildButtonGrid(
		"odAssessSourceGrid",
		options.overdose,
		"mhGroup",
		"odAssessSource",
		"mhValue",
	);

	$("#odAssessIntentionality")?.addEventListener("change", () => {
		const intent = val("odAssessIntentionality");
		$("#odAssessCircumstanceWrap")?.classList.toggle(
			"hidden",
			intent !== "Accidental / unintentional",
		);
	});
}

function buildOdAssessmentText() {
	const state = window.CrewMateApp.getState();
	const lines = [];
	const intent = val("odAssessIntentionality");
	if (intent) lines.push(`Intentionality: ${intent}`);
	if (intent === "Accidental / unintentional" && val("odAssessCircumstance"))
		lines.push(`Circumstance: ${val("odAssessCircumstance")}`);
	if (val("odAssessSubstance"))
		lines.push(`Substance(s): ${val("odAssessSubstance")}`);
	if (val("odAssessAmount")) lines.push(`Amount: ${val("odAssessAmount")}`);
	const timeParts = [
		val("odAssessAtTime") ? `at ${val("odAssessAtTime")}` : "",
		val("odAssessAgoTime") || "",
	]
		.filter(Boolean)
		.join(", ");
	if (timeParts) lines.push(`Time of ingestion: ${timeParts}`);
	if (val("odAssessRoute")) lines.push(`Route: ${val("odAssessRoute")}`);
	if (isChecked("odAssessAlcohol")) lines.push("Alcohol co-ingestion reported");
	if (state.odAssessSource.size)
		lines.push(`Medication source: ${[...state.odAssessSource].join(", ")}`);
	if (val("odAssessSymptoms"))
		lines.push(`Symptoms: ${val("odAssessSymptoms")}.`);
	if (val("odAssessNotes")) lines.push(val("odAssessNotes"));
	return lines.length ? lines.join("\n") : null;
}

export function initOdAssessment() {
	buildOdAssessmentSection();
}

window.CrewMateOd = { buildOdAssessmentText };
