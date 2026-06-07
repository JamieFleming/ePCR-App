import { $, val, populateChipGroup } from "../utils/dom.js";
import { OPTIONS } from "../data/options.js";

function buildGynaeSection() {
	populateChipGroup("pregnancyStatus", OPTIONS.gynae.pregnancyStatus);

	const symptomGrid = $("#gynaeSymptomGrid");
	if (symptomGrid) {
		OPTIONS.gynae.symptoms.forEach(({ key, label }) => {
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "square-btn gynae-symptom";
			btn.dataset.gynaeSymptom = key;
			btn.textContent = label;
			symptomGrid.append(btn);
		});
	}

	populateChipGroup("pvBleedSeverity", OPTIONS.gynae.bleedSeverity);

	const bleedCharGrid = $("#pvBleedCharGrid");
	if (bleedCharGrid) {
		OPTIONS.gynae.bleedChar.forEach(({ key, label }) => {
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "square-btn gynae-char";
			btn.dataset.gynaeChar = key;
			btn.textContent = label;
			bleedCharGrid.append(btn);
		});
	}

	buildDischargeGrid("dischargeColourGrid", OPTIONS.gynae.dischargeColour);
	buildDischargeGrid("dischargeConsistencyGrid", OPTIONS.gynae.dischargeConsistency);
	buildDischargeGrid("dischargeOdourGrid", OPTIONS.gynae.dischargeOdour);

	populateChipGroup("dischargeAmount", OPTIONS.gynae.dischargeAmount);
}

function buildDischargeGrid(gridId, items) {
	const grid = $(`#${gridId}`);
	if (!grid) return;
	items.forEach(({ key, label }) => {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "square-btn gynae-disc";
		btn.dataset.gynaeDisc = key;
		btn.textContent = label;
		grid.append(btn);
	});
}

function buildGynaeOutput() {
	const lines = [];

	const pregnancyStatus = val("pregnancyStatus");
	if (pregnancyStatus) {
		let pregnancyLine = `Pregnancy status: ${pregnancyStatus}`;
		if (pregnancyStatus !== "Not pregnant") {
			const gestation = val("gestationWeeks");
			const edd = val("edd");
			const gravida = val("gravida");
			const para = val("para");
			const pregnancyDetails = [
				gestation ? `${gestation} weeks` : null,
				edd ? `EDD ${edd}` : null,
				gravida || para ? `G${gravida || "?"}P${para || "?"}` : null,
			]
				.filter(Boolean)
				.join(", ");
			if (pregnancyDetails) pregnancyLine += ` (${pregnancyDetails})`;
		}
		lines.push(pregnancyLine);
	}

	const lmp = val("lmp");
	if (lmp) lines.push(`LMP: ${lmp}`);

	const hasSymptom = (key) =>
		!!document
			.querySelector(`.gynae-symptom[data-gynae-symptom="${key}"]`)
			?.classList.contains("selected");
	const hasBleedChar = (key) =>
		!!document
			.querySelector(`.gynae-char[data-gynae-char="${key}"]`)
			?.classList.contains("selected");
	const hasDischargeAttr = (key) =>
		!!document
			.querySelector(`.gynae-disc[data-gynae-disc="${key}"]`)
			?.classList.contains("selected");

	const symptoms = [];

	if (hasSymptom("pvBleed")) {
		const bleedSeverity = val("pvBleedSeverity");
		const bleedCharacteristics = OPTIONS.gynae.bleedChar
			.filter(({ key }) => hasBleedChar(key))
			.map(({ label }) => label.toLowerCase());
		const bleedDetail = [bleedSeverity, ...bleedCharacteristics]
			.filter(Boolean)
			.join(", ");
		symptoms.push(bleedDetail ? `PV bleeding — ${bleedDetail}` : "PV bleeding");
	}

	if (hasSymptom("pelvicPain")) symptoms.push("Pelvic pain");

	if (hasSymptom("discharge")) {
		const selectedColours = OPTIONS.gynae.dischargeColour
			.filter(({ key }) => hasDischargeAttr(key))
			.map(({ label }) => label);
		const selectedConsistency = OPTIONS.gynae.dischargeConsistency
			.filter(({ key }) => hasDischargeAttr(key))
			.map(({ label }) => label);
		const selectedOdour = OPTIONS.gynae.dischargeOdour
			.filter(({ key }) => hasDischargeAttr(key))
			.map(({ label }) => label);
		const dischargeAmount = val("dischargeAmount");
		const dischargeDuration = val("dischargeDuration");

		const dischargeSummaryParts = [
			selectedColours.length ? selectedColours.join(" / ") : null,
			selectedConsistency.length ? selectedConsistency.join(", ") : null,
			selectedOdour.length ? selectedOdour.join(", ") : null,
			dischargeAmount ? `${dischargeAmount.toLowerCase()} amount` : null,
			dischargeDuration ? `onset: ${dischargeDuration}` : null,
		].filter(Boolean);

		symptoms.push(
			dischargeSummaryParts.length
				? `Vaginal discharge — ${dischargeSummaryParts.join("; ")}`
				: "Vaginal discharge",
		);
	}

	if (symptoms.length) lines.push(`Symptoms: ${symptoms.join("; ")}`);

	const notes = val("gynaeNotes");
	if (notes) lines.push(notes);

	return lines.length ? lines.join("\n") : "No gynaecological concerns identified";
}

export function initGynae() {
	buildGynaeSection();
}

window.CrewMateGynae = { buildGynaeOutput };
