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

	const charGrid = $("#pvBleedCharGrid");
	if (charGrid) {
		OPTIONS.gynae.bleedChar.forEach(({ key, label }) => {
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "square-btn gynae-char";
			btn.dataset.gynaeChar = key;
			btn.textContent = label;
			charGrid.append(btn);
		});
	}

	const colourGrid = $("#dischargeColourGrid");
	if (colourGrid) {
		OPTIONS.gynae.dischargeColour.forEach(({ key, label }) => {
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "square-btn gynae-disc";
			btn.dataset.gynaeDisc = key;
			btn.textContent = label;
			colourGrid.append(btn);
		});
	}

	const consistencyGrid = $("#dischargeConsistencyGrid");
	if (consistencyGrid) {
		OPTIONS.gynae.dischargeConsistency.forEach(({ key, label }) => {
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "square-btn gynae-disc";
			btn.dataset.gynaeDisc = key;
			btn.textContent = label;
			consistencyGrid.append(btn);
		});
	}

	const odourGrid = $("#dischargeOdourGrid");
	if (odourGrid) {
		OPTIONS.gynae.dischargeOdour.forEach(({ key, label }) => {
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "square-btn gynae-disc";
			btn.dataset.gynaeDisc = key;
			btn.textContent = label;
			odourGrid.append(btn);
		});
	}

	populateChipGroup("dischargeAmount", OPTIONS.gynae.dischargeAmount);
}

function buildGynaeOutput() {
	const lines = [];

	const status = val("pregnancyStatus");
	if (status) {
		let line = `Pregnancy status: ${status}`;
		if (status !== "Not pregnant") {
			const gestation = val("gestationWeeks");
			const edd = val("edd");
			const gravida = val("gravida");
			const para = val("para");
			const details = [
				gestation ? `${gestation} weeks` : null,
				edd ? `EDD ${edd}` : null,
				gravida || para ? `G${gravida || "?"}P${para || "?"}` : null,
			]
				.filter(Boolean)
				.join(", ");
			if (details) line += ` (${details})`;
		}
		lines.push(line);
	}

	const lmp = val("lmp");
	if (lmp) lines.push(`LMP: ${lmp}`);

	const isSymptom = (key) =>
		!!document
			.querySelector(`.gynae-symptom[data-gynae-symptom="${key}"]`)
			?.classList.contains("selected");
	const isChar = (key) =>
		!!document
			.querySelector(`.gynae-char[data-gynae-char="${key}"]`)
			?.classList.contains("selected");
	const isDisc = (key) =>
		!!document
			.querySelector(`.gynae-disc[data-gynae-disc="${key}"]`)
			?.classList.contains("selected");

	const symptoms = [];
	if (isSymptom("pvBleed")) {
		let bleed = "PV bleeding";
		const severity = val("pvBleedSeverity");
		const chars = [
			isChar("bright") ? "bright red" : null,
			isChar("dark") ? "dark/old blood" : null,
			isChar("clots") ? "clots" : null,
		].filter(Boolean);
		const detail = [severity, ...chars].filter(Boolean).join(", ");
		if (detail) bleed += ` — ${detail}`;
		symptoms.push(bleed);
	}
	if (isSymptom("pelvicPain")) symptoms.push("pelvic pain");
	if (isSymptom("discharge")) {
		const discColours = [
			isDisc("clear") ? "clear/white" : null,
			isDisc("yellow") ? "yellow" : null,
			isDisc("green") ? "green" : null,
			isDisc("grey") ? "grey" : null,
			isDisc("brown") ? "brown" : null,
			isDisc("blood") ? "blood-stained" : null,
		].filter(Boolean);
		const discConsistency = [
			isDisc("watery") ? "watery" : null,
			isDisc("thick") ? "thick" : null,
			isDisc("cottage") ? "cottage cheese" : null,
			isDisc("frothy") ? "frothy" : null,
		].filter(Boolean);
		const discOdour = [
			isDisc("no-odour") ? "no odour" : null,
			isDisc("offensive") ? "offensive odour" : null,
			isDisc("fishy") ? "fishy odour" : null,
		].filter(Boolean);
		const discAmount = val("dischargeAmount");
		const discDuration = val("dischargeDuration");

		let disc = "Vaginal discharge";
		const discParts = [
			discColours.length ? discColours.join("/") : null,
			discConsistency.length ? discConsistency.join(", ") : null,
			discOdour.length ? discOdour.join(", ") : null,
			discAmount ? `${discAmount.toLowerCase()} amount` : null,
			discDuration ? `onset: ${discDuration}` : null,
		].filter(Boolean);
		if (discParts.length) disc += ` — ${discParts.join("; ")}`;
		symptoms.push(disc);
	}
	if (symptoms.length) lines.push(`Symptoms: ${symptoms.join("; ")}`);

	const notes = val("gynaeNotes");
	if (notes) lines.push(notes);

	return lines.length
		? lines.join("\n")
		: "No gynaecological concerns identified";
}

export function initGynae() {
	buildGynaeSection();
}

window.CrewMateGynae = { buildGynaeOutput };
