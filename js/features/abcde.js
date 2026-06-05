import { $, $$, val, isChecked } from "../utils/dom.js";
import { OPTIONS, ABCDE } from "../data/options.js";
import { buildGcsCalcHTML } from "../utils/gcs.js";
import { state } from "../app.js";

function buildAbcde() {
	const root = $("#abcdeContainer");
	ABCDE.sections.forEach((section, index) => {
		const details = document.createElement("details");
		details.className = "section-card";

		details.innerHTML = `<summary><span>${section.key} - ${section.title}</span><small>${section.key}</small></summary><div class="section-body"><div class="square-grid abc-grid"></div><div class="vital-grid"></div><label class="field-label" for="${section.notes}">Notes</label><input id="${section.notes}" type="text" /></div>`;
		const chipRoot = $(".abc-grid", details);
		section.chips.forEach(([normal, abnormal]) => {
			const button = document.createElement("button");
			button.type = "button";
			button.className = "square-btn abc-chip selected";
			button.textContent = normal;
			button.dataset.abc = section.key;
			button.dataset.normal = normal;
			button.dataset.abnormal = abnormal;
			button.dataset.abcState = "normal";
			button.dataset.value = normal;
			chipRoot.append(button);
		});
		if (section.extras) {
			const sectionBody = $(".section-body", details);
			const extraWrap = document.createElement("div");
			extraWrap.innerHTML = section.extras;
			while (extraWrap.firstChild) sectionBody.append(extraWrap.firstChild);
		}
		if (section.key === "D") {
			const sectionBody = $(".section-body", details);
			const calc = document.createElement("div");
			calc.style.cssText = "margin-top:10px";
			calc.innerHTML = buildGcsCalcHTML("gcsCalc");
			sectionBody.append(calc);
		}
		root.append(details);
	});
}

function buildAbdoGrid() {
	const grid = $("#abdoRegionsGrid");
	if (!grid) return;
	OPTIONS.abdominal.regions.forEach((region) => {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "square-btn abdo-region-btn";
		btn.dataset.region = region;
		btn.innerHTML = `<span class="abdo-region-name">${region}</span><span class="abdo-region-tags"></span>`;
		grid.append(btn);
	});
}

function renderAbdoGrid() {
	$$(".abdo-region-btn").forEach((btn) => {
		const region = btn.dataset.region;
		const findings = state.abdoFindings[region];
		const hasFindings = findings && findings.size > 0;
		const isActive = state.abdoActive === region;
		btn.classList.toggle("selected", hasFindings || isActive);
		btn.classList.toggle("abdo-active", isActive);
		const tags = btn.querySelector(".abdo-region-tags");
		if (tags) {
			tags.textContent = hasFindings
				? [...findings]
						.map((f) => OPTIONS.abdominal.findingsShort[f] || f[0])
						.join(" · ")
				: "";
		}
	});

	const panel = $("#abdoFindingPanel");
	if (!panel) return;
	if (!state.abdoActive) {
		panel.classList.add("hidden");
		return;
	}
	const findings = state.abdoFindings[state.abdoActive] || new Set();
	panel.classList.remove("hidden");
	panel.innerHTML =
		`<p class="abdo-finding-label">Findings in <strong>${state.abdoActive}</strong></p>` +
		`<div class="radio-chip-group" style="flex-wrap:wrap;gap:6px;margin-top:6px">` +
		OPTIONS.abdominal.findings
			.map(
				(f) =>
					`<button type="button" class="radio-chip abdo-finding-chip${findings.has(f) ? " selected" : ""}" data-finding="${f}">${f}</button>`,
			)
			.join("") +
		`</div>` +
		(findings.size > 0
			? `<button type="button" class="abdo-clear-btn" data-region="${state.abdoActive}">✕ Clear ${state.abdoActive}</button>`
			: "");
}

function buildAuscGrid() {
	const grid = $("#auscRegionGrid");
	if (!grid) return;
	OPTIONS.respiratory.auscRegions.forEach((region) => {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "square-btn ausc-region-btn";
		if (region === "Trachea") btn.classList.add("ausc-full");
		btn.dataset.region = region;
		btn.innerHTML = `<span class="ausc-region-name">${region}</span><span class="ausc-region-tags"></span>`;
		grid.append(btn);
	});
}

function renderAuscGrid() {
	$$(".ausc-region-btn").forEach((btn) => {
		const region = btn.dataset.region;
		const findings = state.auscFindings[region];
		const hasFindings = findings && findings.size > 0;
		const isActive = state.auscActive === region;
		btn.classList.toggle("selected", hasFindings || isActive);
		btn.classList.toggle("ausc-active", isActive);
		const tags = btn.querySelector(".ausc-region-tags");
		if (tags) {
			tags.textContent = hasFindings
				? [...findings]
						.map((f) => OPTIONS.respiratory.auscFindingsShort[f] || f[0])
						.join(" · ")
				: "";
		}
	});
	const panel = $("#auscFindingPanel");
	if (!panel) return;
	if (!state.auscActive) {
		panel.classList.add("hidden");
		return;
	}
	const findings = state.auscFindings[state.auscActive] || new Set();
	panel.classList.remove("hidden");
	panel.innerHTML =
		`<p class="ausc-finding-label">Findings in <strong>${state.auscActive}</strong></p>` +
		`<div class="radio-chip-group" style="flex-wrap:wrap;gap:6px;margin-top:6px">` +
		OPTIONS.respiratory.auscFindings
			.map(
				(f) =>
					`<button type="button" class="radio-chip ausc-finding-chip${findings.has(f) ? " selected" : ""}" data-finding="${f}">${f}</button>`,
			)
			.join("") +
		`</div>` +
		(findings.size > 0
			? `<button type="button" class="ausc-clear-btn" data-region="${state.auscActive}">✕ Clear ${state.auscActive}</button>`
			: "");
	syncAuscultationOutput();
}

function syncAuscultationOutput() {
	const entries = Object.entries(state.auscFindings).filter(
		([, f]) => f.size > 0,
	);
	let text;
	if (!entries.length) {
		text = "Not auscultated";
	} else {
		const allClear = entries.every(([, f]) => f.size === 1 && f.has("Clear"));
		if (allClear && entries.length >= 4) {
			text = "Equal and clear air entry throughout";
		} else {
			text = entries
				.map(([region, findings]) => `${region}: ${[...findings].join(", ")}`)
				.join("; ");
		}
	}
	const hidden = $("#respAus");
	if (hidden) hidden.value = text;
	const preview = $("#auscPreview");
	if (preview) preview.textContent = text;
}

function buildEcgSection() {
	const findingsGrid = $("#ecgFindingsGrid");
	const leadsGrid = $("#ecgLeadsGrid");
	if (!findingsGrid || !leadsGrid) return;
	OPTIONS.cardiac.ecgFindings.forEach((label) => {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "square-btn ecg-finding";
		btn.textContent = label;
		btn.dataset.finding = label;
		if (label === "Not performed") {
			btn.classList.add("selected");
			state.ecgFindings.add(label);
		}
		findingsGrid.append(btn);
	});
	OPTIONS.cardiac.ecgLeads.forEach((lead) => {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "square-btn ecg-lead";
		btn.textContent = lead;
		btn.dataset.lead = lead;
		leadsGrid.append(btn);
	});
}

function buildEcgText() {
	if (!state.ecgFindings.size) return "";
	const ecgLeadFindings = OPTIONS.cardiac.ecgLeadFindings;
	const leadFindings = [...state.ecgFindings].filter((f) =>
		ecgLeadFindings.includes(f),
	);
	const otherFindings = [...state.ecgFindings].filter(
		(f) => !ecgLeadFindings.includes(f),
	);
	const parts = [...otherFindings];
	if (leadFindings.length && state.ecgLeads.size) {
		const leads = [...state.ecgLeads].join(", ");
		parts.push(...leadFindings.map((f) => `${f} (leads: ${leads})`));
	} else if (leadFindings.length) {
		parts.push(...leadFindings);
	}
	return `ECG: ${parts.join("; ")}.`;
}

function toggleAbc(button) {
	const isAbnormal = button.dataset.abcState === "abnormal";
	const next = isAbnormal ? "normal" : "abnormal";
	setAbcChipState(button, next);
	if (next === "abnormal") {
		syncDisabilityLinks(button);
		const noAbc = $("#oaNoABC");
		if (noAbc) noAbc.checked = false;
		const normPres = $("#oaNormalPresentation");
		if (normPres) normPres.checked = false;
	} else {
		const allNormal = !$$("[data-abc]").some(
			(b) => b.dataset.abcState === "abnormal",
		);
		if (allNormal) {
			const noAbc = $("#oaNoABC");
			if (noAbc) noAbc.checked = true;
			const normPres = $("#oaNormalPresentation");
			if (normPres) normPres.checked = true;
		}
	}
	if (button.dataset.normal === "Good colour") {
		const wrap = $("#colourDetailWrap");
		if (wrap) {
			wrap.classList.toggle("hidden", next === "normal");
			if (next === "normal") {
				const hidden = $("#colourDetail");
				if (hidden) hidden.value = "";
				wrap
					.querySelectorAll("[data-value]")
					.forEach((c) => c.classList.remove("selected"));
			}
		}
	}
	if (button.dataset.normal === "Normal Rate") {
		const wrap = $("#hrRateDetailWrap");
		if (wrap) {
			wrap.classList.toggle("hidden", next === "normal");
			if (next === "normal") {
				const hidden = $("#hrRateDetail");
				if (hidden) hidden.value = "";
				wrap
					.querySelectorAll("[data-value]")
					.forEach((c) => c.classList.remove("selected"));
			}
		}
	}
}
function setAbcChipState(button, state) {
	const isAbnormal = state === "abnormal";
	button.dataset.abcState = state;
	button.classList.toggle("abnormal", isAbnormal);
	button.classList.toggle("selected", !isAbnormal);
	button.textContent = isAbnormal
		? button.dataset.abnormal
		: button.dataset.normal;
	button.dataset.value = button.textContent;
}

function syncDisabilityLinks(button) {
	if (button.dataset.abc !== "D") return;
	const normalLabel = button.dataset.normal;
	ABCDE.dLinks.forEach(([left, right]) => {
		const linkedNormal =
			left === normalLabel ? right : right === normalLabel ? left : null;
		if (!linkedNormal) return;
		const linked = $(`.abc-chip[data-abc="D"][data-normal="${linkedNormal}"]`);
		if (linked && linked.dataset.abcState === "normal")
			setAbcChipState(linked, "abnormal");
	});
}

export function initAbcde() {
	buildAbcde();
	buildAbdoGrid();
	buildAuscGrid();
	buildEcgSection();
}

window.CrewMateAbcde = {
	renderAbdoGrid,
	renderAuscGrid,
	buildEcgText,
	syncAuscultationOutput,
	toggleAbc,
	setAbcChipState,
	syncDisabilityLinks,
};
