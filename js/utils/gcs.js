export const GCS_EYE = [
	[4, "Spontaneous"],
	[3, "To voice"],
	[2, "To pain"],
	[1, "None"],
];
export const GCS_VERBAL = [
	[5, "Orientated"],
	[4, "Confused"],
	[3, "Inappropriate"],
	[2, "Sounds only"],
	[1, "None"],
];
export const GCS_MOTOR = [
	[6, "Obeys"],
	[5, "Localises"],
	[4, "Withdraws"],
	[3, "Flexion"],
	[2, "Extension"],
	[1, "None"],
];

export function buildGcsCalcHTML(prefix) {
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

export function updateGcsTally(prefix) {
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

	const isPrimary = prefix === "gcsCalc" || prefix === "rosGcs";
	if (isPrimary) {
		const scoreEl = $("#gcsScore");
		if (scoreEl) scoreEl.value = total;
	}

	if (prefix.startsWith("obsGcs")) {
		const idx = prefix.replace("obsGcs", "");
		const setEl = document.querySelector(`.obs-set[data-obs-idx="${idx}"]`);
		if (setEl) window.CrewMateObsRecorder?.updateObsNewsScore(setEl);
	}
}

window.CrewMateGcs = { buildGcsCalcHTML, updateGcsTally };
