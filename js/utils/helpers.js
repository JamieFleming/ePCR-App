import { $, $$, val } from "./dom.js";
import { state } from "../app.js";

export function formatSet(set, fallback) {
	return set.size ? [...set].join(", ") : fallback;
}

export function listFactors(set, otherFieldId, fallback) {
	const items = [...set].filter((value) => value !== "Other");
	const other = val(otherFieldId);
	if (set.has("Other") && other) items.push(other);
	return items.length ? items.join(", ") : fallback;
}

export function getPc() {
	return val("pcSelect") === "Other"
		? val("pcOther") || "Other"
		: val("pcSelect") || "Not specified";
}

export const onsetTime = () =>
	val("onsetTime") === "Other" ? val("onsetTimeOther") : val("onsetTime");

export const onsetClockSuffix = () => {
	const t = val("onsetClockTime");
	return t ? ` (at ${t})` : "";
};

export function rfSystolic() {
	const bpStr = val("bp");
	if (!bpStr) return null;
	const systolic = parseInt(bpStr.split("/")[0], 10);
	return isNaN(systolic) ? null : systolic;
}

export function getConveyTransferText(isPaeds = false) {
	return $$(isPaeds ? ".p-convey-chip" : ".convey-chip")
		.filter((chip) => chip.dataset.conveyState !== "unselected")
		.map((chip) => chip.textContent)
		.join("; ");
}

export function getNiceCTCriteria() {
	const criteria = [];
	const gcsE = parseInt($("#headGcsEye")?.dataset.gcsSelected || "", 10) || 0;
	const gcsV =
		parseInt($("#headGcsVerbal")?.dataset.gcsSelected || "", 10) || 0;
	const gcsM = parseInt($("#headGcsMotor")?.dataset.gcsSelected || "", 10) || 0;
	const gcsTotal = gcsE && gcsV && gcsM ? gcsE + gcsV + gcsM : 0;
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

export function setRadioChip(fieldId, value) {
	const group = $(`[data-radio-group="${fieldId}"]`);
	const inp = $(`#${fieldId}`);
	if (!group || !inp) return;
	group.querySelectorAll("[data-value]").forEach((chip) => {
		chip.classList.toggle("selected", chip.dataset.value === value);
	});
	inp.value = value;
}
