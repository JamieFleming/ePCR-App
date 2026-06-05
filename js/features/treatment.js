import { $, $$, val, isChecked, buildButtonGrid } from "../utils/dom.js";
import { OPTIONS } from "../data/options.js";

let pendingManualItems = new Set();

const { render: renderIvEntries, remove: removeIvEntry } =
	window.CrewMateApp.makeEntryManager(
		"ivEntries",
		"vaEntries",
		(entry) => {
			const parts = [entry.type];
			if (entry.gauge) parts.push(entry.gauge);
			if (entry.site) parts.push(`— ${entry.site}`);
			if (entry.outcome) parts.push(`(${entry.outcome})`);
			if (entry.fluids) parts.push(`• ${entry.fluids}`);
			const description = parts.join(" ");
			return entry.time ? `[${entry.time}] ${description}` : description;
		},
		"remove-va",
	);

const { render: renderChangeEntries, remove: removeChangeEntry } =
	window.CrewMateApp.makeEntryManager(
		"clinicalChanges",
		"changeEntries",
		(entry) => (entry.time ? `[${entry.time}] ${entry.desc}` : entry.desc),
		"remove-change",
	);

function buildTreatmentSection() {
	buildButtonGrid(
		"airwayInterventionGrid",
		OPTIONS.treatments.airway,
		"txGroup",
		"airway",
		"txValue",
	);
	buildButtonGrid(
		"woundInterventionGrid",
		OPTIONS.treatments.wound,
		"txGroup",
		"wound",
		"txValue",
	);
	buildButtonGrid(
		"manualHandlingGrid",
		OPTIONS.treatments.manualHandling,
		"txGroup",
		"manual",
		"txValue",
	);

	$("#addVaButton")?.addEventListener("click", () => addIvEntry());
	$("#addDrugButton")?.addEventListener("click", () => addDrugEntry());
	$("#addChangeButton")?.addEventListener("click", addChangeEntry);
	$("#addManualButton")?.addEventListener("click", addManualEntry);

	$("#vaOutcome")?.addEventListener("change", () => {
		const successful = val("vaOutcome") === "Successful — patent and flushed";
		$("#vaFlushWrap")?.classList.toggle("hidden", !successful);
		if (successful) {
			setRadioChip("vaFlushed", "Flushed — 5ml NaCl 0.9%");
		} else {
			$$("[data-radio-group='vaFlushed'] [data-value]").forEach((chip) =>
				chip.classList.remove("selected"),
			);
			const flushedInput = $("#vaFlushed");
			if (flushedInput) flushedInput.value = "";
		}
	});

	$("#vaType")?.addEventListener("change", () => {
		const type = val("vaType");
		const isIv = type === "IV Cannula";
		const isIo = type === "IO Access";
		$("#vaGaugeWrap")?.classList.toggle("hidden", !isIv);
		$("#vaIvSites")?.classList.toggle("hidden", !isIv);
		$("#vaIoSites")?.classList.toggle("hidden", !isIo);
		$$("[data-radio-group='vaSite'] [data-value]").forEach((chip) =>
			chip.classList.remove("selected"),
		);
		$$("[data-radio-group='vaGauge'] [data-value]").forEach((chip) =>
			chip.classList.remove("selected"),
		);
		const siteInput = $("#vaSite");
		if (siteInput) siteInput.value = "";
		const gaugeInput = $("#vaGauge");
		if (gaugeInput) gaugeInput.value = "";
	});
}

function buildTreatmentText() {
	const state = window.CrewMateApp.getState();
	const lines = [];
	if (state.airwayInterventions.size)
		lines.push(
			`Airway/breathing: ${[...state.airwayInterventions].join(", ")}`,
		);
	if (state.ivEntries.length) {
		lines.push("Vascular access:");
		state.ivEntries.forEach((entry) => {
			const parts = [entry.type];
			if (entry.gauge) parts.push(entry.gauge);
			if (entry.site) parts.push(`— ${entry.site}`);
			if (entry.outcome) parts.push(`— ${entry.outcome}`);
			if (entry.fluids) parts.push(`(${entry.fluids})`);
			const description = parts.join(" ");
			lines.push(`  ${entry.time ? `[${entry.time}] ` : ""}${description}`);
		});
	}
	if (state.drugEntries.length) {
		lines.push("Medications given:");
		state.drugEntries.forEach((entry) => {
			const parts = [entry.drug];
			if (entry.dose) parts.push(entry.dose);
			if (entry.route) parts.push(`via ${entry.route}`);
			const description = parts.join(" ");
			lines.push(`  ${entry.time ? `[${entry.time}] ` : ""}${description}`);
		});
	}
	if (state.woundInterventions.size) {
		const items = [...state.woundInterventions].map((value) =>
			value === "Other" && val("woundOther") ? val("woundOther") : value,
		);
		lines.push(`Wound management: ${items.join(", ")}`);
	}
	if (state.manualHandling.length) {
		lines.push("Manual handling:");
		state.manualHandling.forEach((entry) => {
			lines.push(
				`  ${entry.time ? `[${entry.time}] ` : ""}${entry.items.join(", ")}`,
			);
		});
	}
	if (val("otherInterventionsFree"))
		lines.push(`Other interventions: ${val("otherInterventionsFree")}`);

	if (val("treatmentNotes")) lines.push(val("treatmentNotes"));
	return lines.length ? lines.join("\n") : "No interventions documented.";
}

function buildChangesText() {
	const state = window.CrewMateApp.getState();
	const lines = [];
	if (state.clinicalChanges.length) {
		lines.push("Clinical changes noted during assessment:");
		state.clinicalChanges.forEach((entry) => {
			lines.push(`  • ${entry.time ? `[${entry.time}] ` : ""}${entry.desc}`);
		});
	}
	const additional = val("additionalInfo");
	if (additional) lines.push(`Additional information: ${additional}`);
	return lines.join("\n");
}

function addIvEntry(isPaeds = false) {
	const state = window.CrewMateApp.getState();
	const fieldPrefix = isPaeds ? "pVa" : "va";
	const stateObj = isPaeds ? window.CrewMatePaeds.paedsState : state;
	const stateKey = isPaeds ? "pIvEntries" : "ivEntries";
	const renderFn = isPaeds
		? window.CrewMatePaeds.renderPaedsIvEntries
		: renderIvEntries;

	const type = val(`${fieldPrefix}Type`);
	const site = val(`${fieldPrefix}Site`);
	if (!type || !site) return;

	const entry = {
		type,
		gauge: val(`${fieldPrefix}Gauge`),
		site,
		outcome: val(`${fieldPrefix}Outcome`),
		time: val(`${fieldPrefix}Time`),
	};
	if (isPaeds) {
		entry.flushed = val(`${fieldPrefix}Flushed`);
		entry.fluids = val(`${fieldPrefix}Fluids`);
	} else {
		entry.fluids = [val(`${fieldPrefix}Flushed`), val(`${fieldPrefix}Fluids`)]
			.filter(Boolean)
			.join("; ");
	}
	stateObj[stateKey].push(entry);

	[
		`${fieldPrefix}Type`,
		`${fieldPrefix}Gauge`,
		`${fieldPrefix}Site`,
		`${fieldPrefix}Outcome`,
		`${fieldPrefix}Flushed`,
		`${fieldPrefix}Fluids`,
		`${fieldPrefix}Time`,
	].forEach((id) => {
		const el = $(`#${id}`);
		if (el) el.value = "";
	});
	[
		`${fieldPrefix}GaugeWrap`,
		`${fieldPrefix}IvSites`,
		`${fieldPrefix}IoSites`,
		`${fieldPrefix}FlushWrap`,
	].forEach((id) => {
		$(`#${id}`)?.classList.add("hidden");
	});
	$$(
		`[data-radio-group='${fieldPrefix}Type'] [data-value], [data-radio-group='${fieldPrefix}Gauge'] [data-value], [data-radio-group='${fieldPrefix}Site'] [data-value], [data-radio-group='${fieldPrefix}Outcome'] [data-value], [data-radio-group='${fieldPrefix}Flushed'] [data-value]`,
	).forEach((chip) => chip.classList.remove("selected"));

	renderFn();
}

function addDrugEntry(isPaeds = false) {
	const state = window.CrewMateApp.getState();
	const fieldPrefix = isPaeds ? "pDrug" : "drug";
	const nameField = isPaeds ? `${fieldPrefix}Name` : "drugName";
	const drug =
		val(nameField) === "Other"
			? val(`${fieldPrefix}NameOther`)
			: val(nameField);
	if (!drug) return;

	const entry = {
		drug,
		dose: val(`${fieldPrefix}Dose`),
		route: val(`${fieldPrefix}Route`),
		time: val(`${fieldPrefix}Time`),
	};
	if (isPaeds) entry.response = val("pDrugSingleResponse");

	if (isPaeds) {
		window.CrewMatePaeds.paedsState.pDrugEntries.push(entry);
	} else {
		state.drugEntries.push(entry);
	}

	const clearIds = [
		`${fieldPrefix}Name`,
		`${fieldPrefix}NameOther`,
		`${fieldPrefix}Dose`,
		`${fieldPrefix}Route`,
		`${fieldPrefix}Time`,
	];
	if (isPaeds) clearIds.push("pDrugSingleResponse");
	clearIds.forEach((id) => {
		const el = $(`#${id}`);
		if (el) el.value = "";
	});
	$(`#${fieldPrefix}NameOther`)?.classList.add("hidden");
	$$(`[data-radio-group='${fieldPrefix}Route'] [data-value]`).forEach((chip) =>
		chip.classList.remove("selected"),
	);

	renderDrugEntries(isPaeds);
}

function removeDrugEntry(index, isPaeds = false) {
	const state = window.CrewMateApp.getState();
	if (isPaeds) {
		window.CrewMatePaeds.paedsState.pDrugEntries.splice(index, 1);
	} else {
		state.drugEntries.splice(index, 1);
	}
	renderDrugEntries(isPaeds);
}

function repeatDrugEntry(index) {
	const state = window.CrewMateApp.getState();
	const entry = state.drugEntries[index];
	if (!entry) return;
	const now = new Date();
	const hours = String(now.getHours()).padStart(2, "0");
	const minutes = String(now.getMinutes()).padStart(2, "0");
	const nameEl = $("#drugName");
	const otherEl = $("#drugNameOther");
	if (nameEl) {
		// Check if the drug is a known option in the select
		const isKnown = [...nameEl.options].some(
			(option) => option.value === entry.drug || option.text === entry.drug,
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
	if (timeEl) timeEl.value = `${hours}:${minutes}`;
	nameEl?.scrollIntoView({ behavior: "smooth", block: "center" });
	nameEl?.focus();
}

function addManualEntry() {
	const state = window.CrewMateApp.getState();
	if (!pendingManualItems.size) return;
	const other = val("manualOther");
	const items = [...pendingManualItems].map((value) =>
		value === "Other" && other ? other : value,
	);
	state.manualHandling.push({ time: val("manualTime"), items });
	pendingManualItems.clear();
	const timeEl = $("#manualTime");
	if (timeEl) timeEl.value = "";
	const otherEl = $("#manualOther");
	if (otherEl) otherEl.value = "";
	$("#manualOtherWrap")?.classList.add("hidden");
	$$("[data-tx-group='manual']").forEach((btn) =>
		btn.classList.remove("selected"),
	);
	renderManualEntries();
}

function renderDrugEntries(isPaeds = false) {
	const state = window.CrewMateApp.getState();
	const entries = isPaeds
		? window.CrewMatePaeds.paedsState.pDrugEntries
		: state.drugEntries;
	const containerId = isPaeds ? "pDrugEntries" : "drugEntries";
	const repeatAttr = isPaeds ? "repeat-pdrug" : "repeat-drug";
	const removeAttr = isPaeds ? "remove-pdrug" : "remove-drug";
	const root = $(`#${containerId}`);
	if (!root) return;
	root.innerHTML = "";
	entries.forEach((entry, index) => {
		const parts = [entry.drug];
		if (entry.dose) parts.push(entry.dose);
		if (entry.route) parts.push(`via ${entry.route}`);
		if (entry.time) parts.push(`at ${entry.time}`);
		if (isPaeds && entry.response) parts.push(`— ${entry.response}`);
		const row = document.createElement("div");
		row.className = "ausc-entry";
		row.innerHTML = `<span>${parts.join(" ")}</span><div style="display:flex;gap:4px"><button type="button" class="repeat-drug-btn" data-${repeatAttr}="${index}" aria-label="Repeat">↺</button><button type="button" data-${removeAttr}="${index}" aria-label="Remove">×</button></div>`;
		root.append(row);
	});
}

function renderManualEntries() {
	const state = window.CrewMateApp.getState();
	const root = $("#manualEntries");
	if (!root) return;
	root.innerHTML = "";
	state.manualHandling.forEach((entry, index) => {
		const div = document.createElement("div");
		div.className = "ausc-entry";
		const label = `${entry.time ? `[${entry.time}] ` : ""}${entry.items.join(", ")}`;
		div.innerHTML = `<span>${label}</span><button type="button" data-remove-manual="${index}" aria-label="Remove">×</button>`;
		root.append(div);
	});
}

function addChangeEntry() {
	const state = window.CrewMateApp.getState();
	const desc = val("changeDesc");
	if (!desc) return;
	state.clinicalChanges.push({ time: val("changeTime"), desc });
	["changeDesc", "changeTime"].forEach((id) => {
		const el = $(`#${id}`);
		if (el) el.value = "";
	});
	renderChangeEntries();
}

export function initTreatment() {
	buildTreatmentSection();
}

window.CrewMateTreatment = {
	buildTreatmentText,
	buildChangesText,
	renderDrugEntries,
	renderIvEntries,
	renderManualEntries,
	removeIvEntry,
	removeDrugEntry,
	repeatDrugEntry,
	removeChangeEntry,
	pendingManualItems,
};
