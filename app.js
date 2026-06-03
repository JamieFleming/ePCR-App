"use strict";

const $ = (selector, root = document) => root.querySelector(selector);

const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const val = (id) => ($(`#${id}`)?.value || "").trim();

const isChecked = (id) => Boolean($(`#${id}`)?.checked);

const onsetTime = () =>
	val("onsetTime") === "Other" ? val("onsetTimeOther") : val("onsetTime");

const onsetClockSuffix = () => {
	const t = val("onsetClockTime");
	return t ? ` (at ${t})` : "";
};

function rfSystolic() {
	const bpStr = val("bp");
	if (!bpStr) return null;
	const systolic = parseInt(bpStr.split("/")[0], 10);
	return isNaN(systolic) ? null : systolic;
}

function evaluateRedFlags() {
	return [];
}

const state = {
	mapMode: "site",
	siteParts: new Set(),
	radiationParts: new Set(),
	character: new Set(),
	associated: new Set(),
	exacerbating: new Set(),
	relieving: new Set(),
	referrals: new Set(),
	fallsSymptoms: new Set(),
	fallsActivity: new Set(),
	fallsInjuries: new Set(),
	fallsLocation: new Set(),
	headMechanism: new Set(),
	headSymptoms: new Set(),
	headSigns: new Set(),
	injuryEntries: [],
	abdoFindings: {},
	abdoActive: null,
	ivEntries: [],
	drugEntries: [],
	seizureType: new Set(),
	seizureFeatures: new Set(),
	seizureFindings: new Set(),
	seizurePrecipitants: new Set(),
	seizurePostictalFeatures: new Set(),
	urinaryVolumeFeatures: new Set(),
	urinaryColourFeatures: new Set(),
	aedCompliance: new Set(),
	mhIntent: new Set(),
	mhPlanning: new Set(),
	mhActs: [],
	odPrescribed: new Set(),
	odAssessSource: new Set(),
	shMethod: new Set(),
	shDepth: new Set(),
	mseAppearance: new Set(),
	mseBehaviour: new Set(),
	mseSpeech: new Set(),
	mseThoughtContent: new Set(),
	mseAffect: new Set(),
	mseThoughtForm: new Set(),
	msePerception: new Set(),
	mseInsight: new Set(),
	safeguardingConcerns: new Set(),
	mcaAbilities: new Set([
		"Understands",
		"Retains",
		"Weighs information",
		"Communicates decision",
	]),
	lacksCapAbilities: new Set(),
	airwayInterventions: new Set(),
	woundInterventions: new Set(),
	manualHandling: [],
	clinicalChanges: [],
	ecgFindings: new Set(),
	ecgLeads: new Set(),
	ros: {},
	auscFindings: {},
	auscActive: null,
	worseningAuto: true,
	pReferrals: new Set(),
};
let pendingInjuryTypes = new Set();
let pendingInjuryInterventions = new Set();
let pendingInjuryNv = {};
let pendingManualItems = new Set();

// Option lists

function populateGroupedSelect(selectId, groups) {
	const select = $(`#${selectId}`);
	if (!select) return;
	groups.forEach(({ group, items }) => {
		const optgroup = document.createElement("optgroup");
		optgroup.label = group;
		items.forEach((label) => {
			const opt = document.createElement("option");
			opt.value = label;
			opt.textContent = label;
			optgroup.appendChild(opt);
		});
		select.appendChild(optgroup);
	});
}

function populateFlatSelect(selectId, options) {
	const select = $(`#${selectId}`);
	if (!select) return;
	options.forEach(([value, label]) => {
		const opt = document.createElement("option");
		opt.value = value;
		opt.textContent = label;
		select.appendChild(opt);
	});
}

function populateChipGroup(radioGroup, items) {
	const group = $(`[data-radio-group='${radioGroup}']`);
	if (!group) return;
	items.forEach((item) => {
		const [value, label] = Array.isArray(item) ? item : [item, item];
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "radio-chip";
		btn.dataset.value = value;
		btn.textContent = label;
		group.appendChild(btn);
	});
}

function populateSiteChips(containerId, items) {
	const container = $(`#${containerId}`);
	if (!container) return;
	items.forEach(([value, label]) => {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "radio-chip";
		btn.dataset.value = value;
		btn.textContent = label;
		container.appendChild(btn);
	});
}

function populateGaugeChips(groupId) {
	const group = $(`[data-radio-group='${groupId}']`);
	if (!group) return;
	window.CrewMateOptions.OPTIONS.treatments.accessGauges.forEach(
		({ value, label, cls }) => {
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = `radio-chip ${cls}`;
			btn.dataset.value = value;
			btn.textContent = label;
			group.appendChild(btn);
		},
	);
}

function populatePcSelect() {
	populateGroupedSelect(
		"pcSelect",
		window.CrewMateOptions.OPTIONS.presentingComplaint,
	);
}

function populateCallerSelect() {
	populateGroupedSelect("hpcCaller", window.CrewMateOptions.OPTIONS.caller);
}

function populateOaFoundSelect() {
	populateGroupedSelect(
		"oaFound",
		window.CrewMateOptions.OPTIONS.onArrival.found,
	);
}

function populateMobilityChips() {
	const group = $("[data-radio-group='oaMobility']");
	if (!group) return;
	window.CrewMateOptions.OPTIONS.onArrival.mobility.forEach(
		({ value, label }) => {
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "radio-chip";
			btn.dataset.value = value;
			btn.textContent = label;
			group.appendChild(btn);
		},
	);
}

function populateOnsetTimeSelect() {
	populateFlatSelect("onsetTime", window.CrewMateOptions.OPTIONS.onset.time);
}

function populateOnsetTypeChips() {
	populateChipGroup("onsetType", window.CrewMateOptions.OPTIONS.onset.type);
}

function populateTimingChips() {
	populateChipGroup(
		"timingSelect",
		window.CrewMateOptions.OPTIONS.onset.timing,
	);
}

function populateHeadInjuryChips() {
	populateChipGroup("headLOC", window.CrewMateOptions.OPTIONS.headInjury.loc);
	populateChipGroup(
		"headLOCDuration",
		window.CrewMateOptions.OPTIONS.headInjury.locDuration,
	);
	populateChipGroup(
		"headRetrograde",
		window.CrewMateOptions.OPTIONS.headInjury.amnesia,
	);
	populateChipGroup(
		"headRetroDuration",
		window.CrewMateOptions.OPTIONS.headInjury.retroAmnesiaDuration,
	);
	populateChipGroup(
		"headAnterograde",
		window.CrewMateOptions.OPTIONS.headInjury.amnesia,
	);
	populateChipGroup(
		"headVomitingCount",
		window.CrewMateOptions.OPTIONS.headInjury.vomiting,
	);
	populateChipGroup(
		"headAnticoag",
		window.CrewMateOptions.OPTIONS.headInjury.anticoagulated,
	);
}

function populateDrugSelect() {
	populateGroupedSelect(
		"drugName",
		window.CrewMateOptions.OPTIONS.treatments.drugs,
	);
}

// Primary Survey - ABCs

document.addEventListener("DOMContentLoaded", () => {
	init();
	// initRespCounter();
});

document.addEventListener("crewmate:leave-paeds", () => {
	if (paedsMode) {
		paedsMode = false;
		window.CrewMatePaeds.resetPaeds();
		$("#paedsBanner")?.classList.add("hidden");
		$("#paedsInfoCard")?.classList.add("hidden");
		$("#paedsAssessmentCard")?.classList.add("hidden");
		$("#abcdeContainer")?.classList.remove("hidden");
	}
});

document.addEventListener("crewmate:show-eprf", () => {
	switchTab("history");
});

document.addEventListener("crewmate:show-paeds", () => {
	paedsMode = true;
	window.CrewMatePaeds.initPaeds();
	switchTab("history");
});

let _obsRecInited = false;
let paedsMode = false;

function buildPainScoreGrids() {
	[
		{ gridId: "painScoreGrid", inputId: "severity" },
		{ gridId: "painScoreWorstGrid", inputId: "severityWorst" },
	].forEach(({ gridId, inputId }) => {
		const grid = $(`#${gridId}`);
		if (!grid) return;
		for (let i = 0; i <= 10; i++) {
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "pain-score-btn";
			btn.dataset.score = String(i);
			btn.dataset.grid = gridId;
			btn.dataset.input = inputId;
			btn.textContent = String(i);
			grid.append(btn);
		}
	});
}

// App Init
function init() {
	populatePcSelect();
	populateCallerSelect();
	populateDrugSelect();
	populateOaFoundSelect();
	populateMobilityChips();
	populateChipGroup(
		"drugRoute",
		window.CrewMateOptions.OPTIONS.treatments.drugRoutes,
	);
	populateChipGroup(
		"pDrugRoute",
		window.CrewMateOptions.OPTIONS.treatments.drugRoutes,
	);
	populateChipGroup(
		"vaType",
		window.CrewMateOptions.OPTIONS.treatments.accessType,
	);
	populateChipGroup(
		"pVaType",
		window.CrewMateOptions.OPTIONS.treatments.accessType,
	);
	populateChipGroup(
		"vaOutcome",
		window.CrewMateOptions.OPTIONS.treatments.accessOutcome,
	);
	populateChipGroup(
		"pVaOutcome",
		window.CrewMateOptions.OPTIONS.treatments.accessOutcome,
	);
	populateGaugeChips("vaGauge");
	populateGaugeChips("pVaGauge");
	populateSiteChips(
		"vaIvSites",
		window.CrewMateOptions.OPTIONS.treatments.accessSites.iv,
	);
	populateSiteChips(
		"vaIoSites",
		window.CrewMateOptions.OPTIONS.treatments.accessSites.io,
	);
	populateSiteChips(
		"pVaIvSites",
		window.CrewMateOptions.OPTIONS.treatments.accessSites.ivPaeds,
	);
	populateSiteChips(
		"pVaIoSites",
		window.CrewMateOptions.OPTIONS.treatments.accessSites.ioPaeds,
	);
	populateOnsetTimeSelect();
	populateOnsetTypeChips();
	populateTimingChips();
	populateHeadInjuryChips();
	const headGcsWrap = $("#headGcsCalcWrap");
	if (headGcsWrap)
		headGcsWrap.innerHTML = window.CrewMateGcs.buildGcsCalcHTML("headGcs");
	buildPainScoreGrids();
	buildAbcde();
	buildRos();
	buildUrinaryChips();
	buildOptionButtons();
	buildAbdoGrid();
	buildAuscGrid();
	buildEcgSection();
	buildInjurySection();
	buildTreatmentSection();

	buildOdAssessmentSection();
	buildMhSection();
	populateChipGroup(
		"conveyanceDecision",
		window.CrewMateOptions.OPTIONS.conveyance.conveyanceDecision,
	);
	$(
		"[data-radio-group='conveyanceDecision'] [data-value='Conveyed']",
	)?.classList.add("selected");
	populateChipGroup(
		"pConveyDecision",
		window.CrewMateOptions.OPTIONS.conveyance.pConveyDecision,
	);
	$(
		"[data-radio-group='pConveyDecision'] [data-value='Conveyed']",
	)?.classList.add("selected");
	const riskGrid = $("#riskChecksGrid");
	if (riskGrid) {
		window.CrewMateOptions.OPTIONS.conveyance.riskChecks.forEach(
			({ id, label }) => {
				const lbl = document.createElement("label");
				lbl.className = "check-row";
				const cb = document.createElement("input");
				cb.type = "checkbox";
				cb.id = id;
				cb.checked = true;
				lbl.appendChild(cb);
				lbl.append(` ${label}`);
				riskGrid.appendChild(lbl);
			},
		);
	}

	const legalGrid = $("#legalConsiderationsChips");
	if (legalGrid) {
		window.CrewMateOptions.OPTIONS.conveyance.legalChips.forEach(
			({ key, label }) => {
				const btn = document.createElement("button");
				btn.type = "button";
				btn.className = "square-btn legal-chip";
				btn.dataset.legal = key;
				btn.textContent = label;
				legalGrid.appendChild(btn);
			},
		);
	}

	populateGroupedSelect(
		"conveyHospital",
		window.CrewMateOptions.OPTIONS.conveyance.conveyHospitals,
	);
	(() => {
		const sel = $("#conveyHospital");
		if (!sel) return;
		const opt = document.createElement("option");
		opt.textContent = "Other hospital";
		sel.appendChild(opt);
	})();

	populateChipGroup(
		"conveyDepartment",
		window.CrewMateOptions.OPTIONS.conveyance.conveyDepartment,
	);

	buildConveyTransferChips();

	populateChipGroup(
		"mobilisationToVehicle",
		window.CrewMateOptions.OPTIONS.conveyance.mobilisationToVehicle,
	);

	buildCapacitySection();
	buildGynaeSection();
	buildSafeguardingSection();
	bindEvents();
	updateMapTags();
	applyWorseningDefault();
	updateWorseningScript();
	syncAuscultationOutput();
	handleConveyanceDisplay();
	enhanceSectionCards();
	renderConveyanceSuggestion();
	// bindRedFlagToggle();
	// document.addEventListener("click", scheduleRedFlags, { passive: true });
	// document.addEventListener("input", scheduleRedFlags, { passive: true });
	// document.addEventListener("change", scheduleRedFlags, { passive: true });
	bindRadioChipGroups();
	restoreFormState();
	document.addEventListener("input", scheduleSave, { passive: true });
	document.addEventListener("change", scheduleSave, { passive: true });
	document.addEventListener("click", scheduleSave, { passive: true });
}

// Builders
function buildOptionButtons() {
	// Maps data-state attribute keys to their window.CrewMateOptions.OPTIONS paths.
	const gridMap = {
		character: window.CrewMateOptions.OPTIONS.pain.character,
		associated: window.CrewMateOptions.OPTIONS.pain.associated,
		exacerbating: window.CrewMateOptions.OPTIONS.pain.exacerbating,
		relieving: window.CrewMateOptions.OPTIONS.pain.relieving,
		referrals: window.CrewMateOptions.OPTIONS.referrals.adult,
		pReferrals: window.CrewMateOptions.OPTIONS.referrals.paediatric,
		fallsSymptoms: window.CrewMateOptions.OPTIONS.falls.symptoms,
		fallsLocation: window.CrewMateOptions.OPTIONS.falls.location,
		fallsActivity: window.CrewMateOptions.OPTIONS.falls.activity,
		fallsInjuries: window.CrewMateOptions.OPTIONS.falls.injuries,
		headMechanism: window.CrewMateOptions.OPTIONS.headInjury.mechanism,
		headSymptoms: window.CrewMateOptions.OPTIONS.headInjury.symptoms,
		headSigns: window.CrewMateOptions.OPTIONS.headInjury.signs,
	};
	Object.entries(gridMap).forEach(([key, options]) => {
		const container = $(`[data-state="${key}"]`);
		if (!container) return;
		options.forEach((option) => {
			const button = document.createElement("button");
			button.type = "button";
			button.className = "square-btn";
			button.textContent = option;
			button.dataset.value = option;
			container.append(button);
		});
	});
}

function buildAbdoGrid() {
	const grid = $("#abdoRegionsGrid");
	if (!grid) return;
	window.CrewMateOptions.OPTIONS.abdominal.regions.forEach((region) => {
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
						.map(
							(f) =>
								window.CrewMateOptions.OPTIONS.abdominal.findingsShort[f] ||
								f[0],
						)
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
		window.CrewMateOptions.OPTIONS.abdominal.findings
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

function buildAbcde() {
	const root = $("#abcdeContainer");
	window.CrewMateOptions.ABCDE.sections.forEach((section, index) => {
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
			calc.innerHTML = window.CrewMateGcs.buildGcsCalcHTML("gcsCalc");
			sectionBody.append(calc);
		}
		root.append(details);
	});
}

// ROS Builders

function buildAuscGrid() {
	const grid = $("#auscRegionGrid");
	if (!grid) return;
	window.CrewMateOptions.OPTIONS.respiratory.auscRegions.forEach((region) => {
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
						.map(
							(f) =>
								window.CrewMateOptions.OPTIONS.respiratory.auscFindingsShort[
									f
								] || f[0],
						)
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
		window.CrewMateOptions.OPTIONS.respiratory.auscFindings
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

function buildEcgSection() {
	const findingsGrid = $("#ecgFindingsGrid");
	const leadsGrid = $("#ecgLeadsGrid");
	if (!findingsGrid || !leadsGrid) return;
	window.CrewMateOptions.OPTIONS.cardiac.ecgFindings.forEach((label) => {
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
	window.CrewMateOptions.OPTIONS.cardiac.ecgLeads.forEach((lead) => {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "square-btn ecg-lead";
		btn.textContent = lead;
		btn.dataset.lead = lead;
		leadsGrid.append(btn);
	});
}

function buildInjurySection() {
	const typeGrid = $("#injuryTypeGrid");
	const intGrid = $("#injuryInterventionGrid");
	if (!typeGrid || !intGrid) return;
	const nvGrid = $("#injuryNvGrid");
	if (nvGrid) {
		window.CrewMateOptions.OPTIONS.injury.neurovascular.forEach(
			({ key, normal, abnormal }) => {
				pendingInjuryNv[key] = "normal";
				const btn = document.createElement("button");
				btn.type = "button";
				btn.className = "square-btn selected";
				btn.textContent = normal;
				btn.dataset.injuryNv = key;
				btn.dataset.normal = normal;
				btn.dataset.abnormal = abnormal;
				nvGrid.append(btn);
			},
		);
	}
	const regionSelect = $("#injuryRegion");
	if (regionSelect) {
		window.CrewMateOptions.OPTIONS.injury.regions.forEach(
			({ group, items }) => {
				const og = document.createElement("optgroup");
				og.label = group;
				items.forEach((item) => {
					const opt = document.createElement("option");
					opt.textContent = item;
					og.append(opt);
				});
				regionSelect.append(og);
			},
		);
	}
	window.CrewMateOptions.OPTIONS.injury.type.forEach((type) => {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "square-btn";
		btn.textContent = type;
		btn.dataset.injuryType = type;
		typeGrid.append(btn);
	});
	window.CrewMateOptions.OPTIONS.injury.interventions.forEach((item) => {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "square-btn";
		btn.textContent = item;
		btn.dataset.injuryIntervention = item;
		intGrid.append(btn);
	});
	$("#addInjuryButton")?.addEventListener("click", addInjuryEntry);
}

function addInjuryEntry() {
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
	const nvAbnormal = window.CrewMateOptions.OPTIONS.injury.neurovascular
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
	window.CrewMateOptions.OPTIONS.injury.neurovascular.forEach(
		({ key, normal }) => {
			pendingInjuryNv[key] = "normal";
			const btn = $(`[data-injury-nv="${key}"]`);
			if (btn) {
				btn.classList.add("selected");
				btn.classList.remove("abnormal");
				btn.textContent = normal;
			}
		},
	);
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
	state.injuryEntries.splice(index, 1);
	renderInjuryEntries();
}

function renderInjuryEntries() {
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
			return `${entry.region}: ${parts || "documented"}.`;
		})
		.join("\n");
}

function buildButtonGrid(containerId, items, groupAttr, groupKey, valueAttr) {
	const grid = $(`#${containerId}`);
	if (!grid) return;
	items.forEach((item) => {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "square-btn";
		btn.textContent = item;
		btn.dataset[groupAttr] = groupKey;
		btn.dataset[valueAttr] = item;
		grid.append(btn);
	});
}

function buildTreatmentSection() {
	buildButtonGrid(
		"airwayInterventionGrid",
		window.CrewMateOptions.OPTIONS.treatments.airway,
		"txGroup",
		"airway",
		"txValue",
	);
	buildButtonGrid(
		"woundInterventionGrid",
		window.CrewMateOptions.OPTIONS.treatments.wound,
		"txGroup",
		"wound",
		"txValue",
	);
	buildButtonGrid(
		"manualHandlingGrid",
		window.CrewMateOptions.OPTIONS.treatments.manualHandling,
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
			$$("[data-radio-group='vaFlushed'] [data-value]").forEach((c) =>
				c.classList.remove("selected"),
			);
			const fi = $("#vaFlushed");
			if (fi) fi.value = "";
		}
	});

	$("#vaType")?.addEventListener("change", () => {
		const type = val("vaType");
		const isIv = type === "IV Cannula";
		const isIo = type === "IO Access";
		$("#vaGaugeWrap")?.classList.toggle("hidden", !isIv);
		$("#vaIvSites")?.classList.toggle("hidden", !isIv);
		$("#vaIoSites")?.classList.toggle("hidden", !isIo);
		// Clear site + gauge chip selections when type changes
		$$("[data-radio-group='vaSite'] [data-value]").forEach((c) =>
			c.classList.remove("selected"),
		);
		$$("[data-radio-group='vaGauge'] [data-value]").forEach((c) =>
			c.classList.remove("selected"),
		);
		const siteInp = $("#vaSite");
		if (siteInp) siteInp.value = "";
		const gaugeInp = $("#vaGauge");
		if (gaugeInp) gaugeInp.value = "";
	});
}

// interventions

function makeEntryManager(
	stateKey,
	containerId,
	formatFn,
	removeAttr,
	stateObj = state,
) {
	const render = () => {
		const root = $(`#${containerId}`);
		if (!root) return;
		root.innerHTML = "";
		stateObj[stateKey].forEach((entry, index) => {
			const row = document.createElement("div");
			row.className = "ausc-entry";
			row.innerHTML = `<span>${formatFn(entry)}</span><button type="button" data-${removeAttr}="${index}" aria-label="Remove">×</button>`;
			root.append(row);
		});
	};
	const remove = (index) => {
		stateObj[stateKey].splice(index, 1);
		render();
	};
	return { render, remove };
}

window.CrewMateApp = {
	makeEntryManager,
	getPReferrals: () => state.pReferrals,
	getState: () => state,
};

const { render: renderIvEntries, remove: removeIvEntry } = makeEntryManager(
	"ivEntries",
	"vaEntries",
	(e) => {
		const parts = [e.type];
		if (e.gauge) parts.push(e.gauge);
		if (e.site) parts.push(`— ${e.site}`);
		if (e.outcome) parts.push(`(${e.outcome})`);
		if (e.fluids) parts.push(`• ${e.fluids}`);
		const desc = parts.join(" ");
		return e.time ? `[${e.time}] ${desc}` : desc;
	},
	"remove-va",
);

function renderDrugEntries(isPaeds = false) {
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

function removeDrugEntry(index, isPaeds = false) {
	if (isPaeds) {
		window.CrewMatePaeds.paedsState.pDrugEntries.splice(index, 1);
	} else {
		state.drugEntries.splice(index, 1);
	}
	renderDrugEntries(isPaeds);
}

function repeatDrugEntry(index) {
	const entry = state.drugEntries[index];
	if (!entry) return;
	const now = new Date();
	const hh = String(now.getHours()).padStart(2, "0");
	const mm = String(now.getMinutes()).padStart(2, "0");
	const nameEl = $("#drugName");
	const otherEl = $("#drugNameOther");
	if (nameEl) {
		// Check if the drug is a known option in the select
		const isKnown = [...nameEl.options].some(
			(o) => o.value === entry.drug || o.text === entry.drug,
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
	if (timeEl) timeEl.value = `${hh}:${mm}`;
	nameEl?.scrollIntoView({ behavior: "smooth", block: "center" });
	nameEl?.focus();
}

const { render: renderChangeEntries, remove: removeChangeEntry } =
	makeEntryManager(
		"clinicalChanges",
		"changeEntries",
		(e) => (e.time ? `[${e.time}] ${e.desc}` : e.desc),
		"remove-change",
	);

function addIvEntry(isPaeds = false) {
	const p = isPaeds ? "pVa" : "va";
	const stateObj = isPaeds ? window.CrewMatePaeds.paedsState : state;
	const stateKey = isPaeds ? "pIvEntries" : "ivEntries";
	const renderFn = isPaeds ? renderPaedsIvEntries : renderIvEntries;

	const type = val(`${p}Type`);
	const site = val(`${p}Site`);
	if (!type || !site) return;

	const entry = {
		type,
		gauge: val(`${p}Gauge`),
		site,
		outcome: val(`${p}Outcome`),
		time: val(`${p}Time`),
	};
	if (isPaeds) {
		entry.flushed = val(`${p}Flushed`);
		entry.fluids = val(`${p}Fluids`);
	} else {
		entry.fluids = [val(`${p}Flushed`), val(`${p}Fluids`)]
			.filter(Boolean)
			.join("; ");
	}
	stateObj[stateKey].push(entry);

	[
		`${p}Type`,
		`${p}Gauge`,
		`${p}Site`,
		`${p}Outcome`,
		`${p}Flushed`,
		`${p}Fluids`,
		`${p}Time`,
	].forEach((id) => {
		const el = $(`#${id}`);
		if (el) el.value = "";
	});
	[`${p}GaugeWrap`, `${p}IvSites`, `${p}IoSites`, `${p}FlushWrap`].forEach(
		(id) => {
			$(`#${id}`)?.classList.add("hidden");
		},
	);
	$$(
		`[data-radio-group='${p}Type'] [data-value], [data-radio-group='${p}Gauge'] [data-value], [data-radio-group='${p}Site'] [data-value], [data-radio-group='${p}Outcome'] [data-value], [data-radio-group='${p}Flushed'] [data-value]`,
	).forEach((c) => c.classList.remove("selected"));

	renderFn();
}

function addDrugEntry(isPaeds = false) {
	const p = isPaeds ? "pDrug" : "drug";
	const nameField = isPaeds ? `${p}Name` : "drugName";
	const drug =
		val(nameField) === "Other" ? val(`${p}NameOther`) : val(nameField);
	if (!drug) return;

	const entry = {
		drug,
		dose: val(`${p}Dose`),
		route: val(`${p}Route`),
		time: val(`${p}Time`),
	};
	if (isPaeds) entry.response = val("pDrugSingleResponse");

	if (isPaeds) {
		window.CrewMatePaeds.paedsState.pDrugEntries.push(entry);
	} else {
		state.drugEntries.push(entry);
	}

	const clearIds = [
		`${p}Name`,
		`${p}NameOther`,
		`${p}Dose`,
		`${p}Route`,
		`${p}Time`,
	];
	if (isPaeds) clearIds.push("pDrugSingleResponse");
	clearIds.forEach((id) => {
		const el = $(`#${id}`);
		if (el) el.value = "";
	});
	$(`#${p}NameOther`)?.classList.add("hidden");
	$$(`[data-radio-group='${p}Route'] [data-value]`).forEach((c) =>
		c.classList.remove("selected"),
	);

	renderDrugEntries(isPaeds);
}

function addManualEntry() {
	if (!pendingManualItems.size) return;
	const other = val("manualOther");
	const items = [...pendingManualItems].map((v) =>
		v === "Other" && other ? other : v,
	);
	state.manualHandling.push({ time: val("manualTime"), items });
	pendingManualItems.clear();
	const timeEl = $("#manualTime");
	if (timeEl) timeEl.value = "";
	const otherEl = $("#manualOther");
	if (otherEl) otherEl.value = "";
	$("#manualOtherWrap")?.classList.add("hidden");
	$$("[data-tx-group='manual']").forEach((b) => b.classList.remove("selected"));
	renderManualEntries();
}

function renderManualEntries() {
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
	const desc = val("changeDesc");
	if (!desc) return;
	state.clinicalChanges.push({ time: val("changeTime"), desc });
	["changeDesc", "changeTime"].forEach((id) => {
		const el = $(`#${id}`);
		if (el) el.value = "";
	});
	renderChangeEntries();
}

function buildChangesText() {
	const lines = [];
	if (state.clinicalChanges.length) {
		lines.push("Clinical changes noted during assessment:");
		state.clinicalChanges.forEach((e) => {
			lines.push(`  • ${e.time ? `[${e.time}] ` : ""}${e.desc}`);
		});
	}
	const additional = val("additionalInfo");
	if (additional) lines.push(`Additional information: ${additional}`);
	return lines.join("\n");
}

function buildTreatmentText() {
	const lines = [];
	if (state.airwayInterventions.size)
		lines.push(
			`Airway/breathing: ${[...state.airwayInterventions].join(", ")}.`,
		);
	if (state.ivEntries.length) {
		lines.push("Vascular access:");
		state.ivEntries.forEach((e) => {
			const parts = [e.type];
			if (e.gauge) parts.push(e.gauge);
			if (e.site) parts.push(`— ${e.site}`);
			if (e.outcome) parts.push(`— ${e.outcome}`);
			if (e.fluids) parts.push(`(${e.fluids})`);
			const desc = parts.join(" ");
			lines.push(`  ${e.time ? `[${e.time}] ` : ""}${desc}`);
		});
	}
	if (state.drugEntries.length) {
		lines.push("Medications given:");
		state.drugEntries.forEach((e) => {
			const parts = [e.drug];
			if (e.dose) parts.push(e.dose);
			if (e.route) parts.push(`via ${e.route}`);
			const desc = parts.join(" ");
			lines.push(`  ${e.time ? `[${e.time}] ` : ""}${desc}`);
		});
	}
	if (state.woundInterventions.size) {
		const items = [...state.woundInterventions].map((v) =>
			v === "Other" && val("woundOther") ? val("woundOther") : v,
		);
		lines.push(`Wound management: ${items.join(", ")}.`);
	}
	if (state.manualHandling.length) {
		lines.push("Manual handling:");
		state.manualHandling.forEach((entry) => {
			lines.push(
				`  ${entry.time ? `[${entry.time}] ` : ""}${entry.items.join(", ")}.`,
			);
		});
	}
	if (val("otherInterventionsFree"))
		lines.push(`Other interventions: ${val("otherInterventionsFree")}.`);

	if (val("treatmentNotes")) lines.push(val("treatmentNotes"));
	return lines.length ? lines.join("\n") : "No interventions documented.";
}

function buildUrinaryChips() {
	const buildGrid = (id, options) => {
		const grid = $(`#${id}`);
		if (!grid) return;
		options.forEach((feature) => {
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "square-btn";
			btn.textContent = feature;
			btn.dataset.value = feature;
			grid.append(btn);
		});
	};
	buildGrid(
		"urinaryVolumeGrid",
		window.CrewMateOptions.OPTIONS.urinary.volumeFeatures,
	);
	buildGrid(
		"urinaryColourGrid",
		window.CrewMateOptions.OPTIONS.urinary.colourFeatures,
	);
}

// OD / Poisoning assessment

function buildOdAssessmentSection() {
	const opts = window.CrewMateOptions.OPTIONS.mentalHealth;

	populateChipGroup("odAssessIntentionality", opts.odAssessment.intentionality);

	const circumSelect = $("#odAssessCircumstance");
	if (circumSelect) {
		opts.odAssessment.circumstance.forEach((c) => {
			const opt = document.createElement("option");
			opt.value = c;
			opt.textContent = c;
			circumSelect.appendChild(opt);
		});
	}

	buildButtonGrid(
		"odAssessSourceGrid",
		opts.overdose,
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
	const lines = [];
	const intent = val("odAssessIntentionality");
	if (intent) lines.push(`Intentionality: ${intent}.`);
	if (intent === "Accidental / unintentional" && val("odAssessCircumstance"))
		lines.push(`Circumstance: ${val("odAssessCircumstance")}.`);
	if (val("odAssessSubstance"))
		lines.push(`Substance(s): ${val("odAssessSubstance")}.`);
	if (val("odAssessAmount")) lines.push(`Amount: ${val("odAssessAmount")}.`);
	const timeParts = [
		val("odAssessAtTime") ? `at ${val("odAssessAtTime")}` : "",
		val("odAssessAgoTime") || "",
	]
		.filter(Boolean)
		.join(", ");
	if (timeParts) lines.push(`Time of ingestion: ${timeParts}.`);
	if (val("odAssessRoute")) lines.push(`Route: ${val("odAssessRoute")}.`);
	if (isChecked("odAssessAlcohol"))
		lines.push("Alcohol co-ingestion reported.");
	if (state.odAssessSource.size)
		lines.push(`Medication source: ${[...state.odAssessSource].join(", ")}.`);
	if (val("odAssessSymptoms"))
		lines.push(`Symptoms: ${val("odAssessSymptoms")}.`);
	if (val("odAssessNotes")) lines.push(val("odAssessNotes"));
	return lines.length ? lines.join("\n") : null;
}

// MH assessment

function buildMhSection() {
	buildButtonGrid(
		"mhIntentGrid",
		window.CrewMateOptions.OPTIONS.mentalHealth.intent,
		"mhGroup",
		"intent",
		"mhValue",
	);
	buildButtonGrid(
		"mhPlanningGrid",
		window.CrewMateOptions.OPTIONS.mentalHealth.planning,
		"mhGroup",
		"planning",
		"mhValue",
	);
	buildButtonGrid(
		"odPrescribedGrid",
		window.CrewMateOptions.OPTIONS.mentalHealth.overdose,
		"mhGroup",
		"odPrescribed",
		"mhValue",
	);
	buildButtonGrid(
		"shMethodGrid",
		window.CrewMateOptions.OPTIONS.mentalHealth.selfharm.method,
		"mhGroup",
		"shMethod",
		"mhValue",
	);
	buildButtonGrid(
		"shDepthGrid",
		window.CrewMateOptions.OPTIONS.mentalHealth.selfharm.depth,
		"mhGroup",
		"shDepth",
		"mhValue",
	);
	buildButtonGrid(
		"mseAppearanceGrid",
		window.CrewMateOptions.OPTIONS.mentalHealth.appearance,
		"mhGroup",
		"mseAppearance",
		"mhValue",
	);
	buildButtonGrid(
		"mseBehaviourGrid",
		window.CrewMateOptions.OPTIONS.mentalHealth.behaviour,
		"mhGroup",
		"mseBehaviour",
		"mhValue",
	);
	buildButtonGrid(
		"mseSpeechGrid",
		window.CrewMateOptions.OPTIONS.mentalHealth.speech,
		"mhGroup",
		"mseSpeech",
		"mhValue",
	);
	buildButtonGrid(
		"mseThoughtContentGrid",
		window.CrewMateOptions.OPTIONS.mentalHealth.thought.content,
		"mhGroup",
		"mseThoughtContent",
		"mhValue",
	);
	buildButtonGrid(
		"mseAffectGrid",
		window.CrewMateOptions.OPTIONS.mentalHealth.affect,
		"mhGroup",
		"mseAffect",
		"mhValue",
	);
	buildButtonGrid(
		"mseThoughtFormGrid",
		window.CrewMateOptions.OPTIONS.mentalHealth.thought.form,
		"mhGroup",
		"mseThoughtForm",
		"mhValue",
	);
	buildButtonGrid(
		"msePerceptionGrid",
		window.CrewMateOptions.OPTIONS.mentalHealth.perception,
		"mhGroup",
		"msePerception",
		"mhValue",
	);
	buildButtonGrid(
		"mseInsightGrid",
		window.CrewMateOptions.OPTIONS.mentalHealth.insight,
		"mhGroup",
		"mseInsight",
		"mhValue",
	);

	const actTypeEl = $("#mhActType");
	if (actTypeEl) {
		const shMethods =
			window.CrewMateOptions.OPTIONS.mentalHealth.selfharm.method;
		shMethods.forEach((method) => {
			const opt = document.createElement("option");
			opt.value = `Self-harm — ${method}`;
			opt.textContent = `Self-harm — ${method}`;
			actTypeEl.appendChild(opt);
		});
		window.CrewMateOptions.OPTIONS.mentalHealth.suicideAttempt.method.forEach(
			(method) => {
				const opt = document.createElement("option");
				opt.value = `Suicide attempt — ${method}`;
				opt.textContent = `Suicide attempt — ${method}`;
				actTypeEl.appendChild(opt);
			},
		);
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
	const lines = [];
	if (state.mhIntent.size)
		lines.push(`Intent: ${[...state.mhIntent].join(", ")}.`);
	if (state.mhPlanning.size)
		lines.push(`Nature of act: ${[...state.mhPlanning].join(", ")}.`);
	if (val("mhTriggers"))
		lines.push(`Triggers / precipitants: ${val("mhTriggers")}.`);
	if (isChecked("mhPrevious")) {
		lines.push(
			`Previous episodes: ${val("mhPreviousDetails") || "Yes — details not documented"}.`,
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
			lines.push(`  ${parts.join(". ")}.`);
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
		.map(([s, label]) => `${label}: ${[...s].join(", ")}.`);
	if (mseLines.length) lines.push("MSE — " + mseLines.join(" "));
	if (val("mhCurrentServices"))
		lines.push(`Current MH services: ${val("mhCurrentServices")}.`);
	if (val("mhS136")) lines.push(`S136 / MHA: ${val("mhS136")}.`);
	if (val("mhNotes")) lines.push(val("mhNotes"));
	return lines.length
		? lines.join("\n")
		: "No MH assessment details documented.";
}

// ROS builder

function buildRos() {
	const root = $("#rosContainer");
	Object.entries(window.CrewMateOptions.ROS).forEach(
		([key, section], index) => {
			if (!section?.items) return;
			const details = document.createElement("details");
			details.className = "section-card";

			details.innerHTML = `<summary><span>${section.title}</span><small id="badge-${key}" class="status-pill">All normal</small></summary><div class="section-body"><div class="square-grid ros-grid"></div>${section.extras || ""}</div>`;
			if (key === "mh") {
				details.id = "ros-mh-section";
				details.classList.add("hidden");
			}
			const grid = $(".ros-grid", details);
			section.items.forEach(([id, normal, abnormal]) => {
				const stateId = `${key}_${id}`;
				state.ros[stateId] = "normal";
				const button = document.createElement("button");
				button.type = "button";
				button.className = "square-btn ros-chip selected";
				button.textContent = normal;
				button.dataset.section = key;
				button.dataset.stateId = stateId;
				button.dataset.normal = normal;
				button.dataset.abnormal = abnormal;
				grid.append(button);
			});
			if (key === "neuro") {
				const wrap = $(".ros-gcs-wrap", details);
				if (wrap)
					wrap.innerHTML = window.CrewMateGcs.buildGcsCalcHTML("rosGcs");
			}
			root.append(details);
		},
	);
}

// Capacity
function buildCapacitySection() {
	populateChipGroup(
		"capacityStatus",
		window.CrewMateOptions.OPTIONS.mentalCapacity.capacityStatus,
	);
	const defaultChip = $(
		"[data-radio-group='capacityStatus'] [data-value='Has capacity']",
	);
	if (defaultChip) defaultChip.classList.add("selected");

	const checksWrap = $("#capacityChecks");
	if (checksWrap) {
		window.CrewMateOptions.OPTIONS.mentalCapacity.mcaAbilities.forEach(
			(label) => {
				const btn = document.createElement("button");
				btn.type = "button";
				btn.className = "square-btn selected";
				btn.textContent = label;
				btn.dataset.mcaAbility = label;
				checksWrap.append(btn);
			},
		);
	}

	const lacksWrap = $("#lacksCapGrid");
	if (lacksWrap) {
		window.CrewMateOptions.OPTIONS.mentalCapacity.lacksCapReasons.forEach(
			(label) => {
				const btn = document.createElement("button");
				btn.type = "button";
				btn.className = "square-btn";
				btn.textContent = label;
				btn.dataset.lacksCapReason = label;
				lacksWrap.append(btn);
			},
		);
	}
}

// gynae
function buildGynaeSection() {
	populateChipGroup(
		"pregnancyStatus",
		window.CrewMateOptions.OPTIONS.gynae.pregnancyStatus,
	);

	const symptomGrid = $("#gynaeSymptomGrid");
	if (symptomGrid) {
		window.CrewMateOptions.OPTIONS.gynae.symptoms.forEach(({ key, label }) => {
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "square-btn gynae-symptom";
			btn.dataset.gynaeSymptom = key;
			btn.textContent = label;
			symptomGrid.append(btn);
		});
	}

	populateChipGroup(
		"pvBleedSeverity",
		window.CrewMateOptions.OPTIONS.gynae.bleedSeverity,
	);

	const charGrid = $("#pvBleedCharGrid");
	if (charGrid) {
		window.CrewMateOptions.OPTIONS.gynae.bleedChar.forEach(({ key, label }) => {
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
		window.CrewMateOptions.OPTIONS.gynae.dischargeColour.forEach(
			({ key, label }) => {
				const btn = document.createElement("button");
				btn.type = "button";
				btn.className = "square-btn gynae-disc";
				btn.dataset.gynaeDisc = key;
				btn.textContent = label;
				colourGrid.append(btn);
			},
		);
	}

	const consistencyGrid = $("#dischargeConsistencyGrid");
	if (consistencyGrid) {
		window.CrewMateOptions.OPTIONS.gynae.dischargeConsistency.forEach(
			({ key, label }) => {
				const btn = document.createElement("button");
				btn.type = "button";
				btn.className = "square-btn gynae-disc";
				btn.dataset.gynaeDisc = key;
				btn.textContent = label;
				consistencyGrid.append(btn);
			},
		);
	}

	const odourGrid = $("#dischargeOdourGrid");
	if (odourGrid) {
		window.CrewMateOptions.OPTIONS.gynae.dischargeOdour.forEach(
			({ key, label }) => {
				const btn = document.createElement("button");
				btn.type = "button";
				btn.className = "square-btn gynae-disc";
				btn.dataset.gynaeDisc = key;
				btn.textContent = label;
				odourGrid.append(btn);
			},
		);
	}

	populateChipGroup(
		"dischargeAmount",
		window.CrewMateOptions.OPTIONS.gynae.dischargeAmount,
	);
}

function buildSafeguardingSection() {
	buildButtonGrid(
		"safeguardingGrid",
		window.CrewMateOptions.OPTIONS.safeguarding.concerns,
		"sgGroup",
		"safeguarding",
		"sgValue",
	);
}

function renderConveyanceSuggestion() {
	const box = $("#conveyanceSuggestion");
	if (!box) return;
	const decision = val("conveyanceDecision");
	if (decision === "Conveyed") {
		box.classList.add("hidden");
		return;
	}
	const hr = parseInt(val("hr"));
	const bp = rfSystolic();
	const rr = parseInt(val("rr"));
	const spo2 = parseInt(val("spo2"));
	const gcs = parseInt(val("gcsScore"));
	const criteria = [
		{
			label: "Observations within normal limits",
			met:
				!isNaN(hr) &&
				hr >= 60 &&
				hr <= 100 &&
				bp !== null &&
				bp >= 90 &&
				bp <= 140 &&
				!isNaN(rr) &&
				rr >= 12 &&
				rr <= 20 &&
				!isNaN(spo2) &&
				spo2 >= 95 &&
				!isNaN(gcs) &&
				gcs === 15,
		},
		{
			label: "No ABCDE abnormalities",
			met: !$$("[data-abc]").some((b) => b.dataset.abcState === "abnormal"),
		},
		{
			label: "Patient has capacity",
			met: val("capacityStatus") === "Has capacity",
		},
		{
			label: "No active clinical prompts",
			met: evaluateRedFlags().length === 0,
		},
		{
			label: "Safety netting completed",
			met:
				isChecked("riskExplained") &&
				isChecked("alternativesDiscussed") &&
				isChecked("understandsRisk") &&
				isChecked("canRecontact"),
		},
	];
	const allMet = criteria.every((c) => c.met);
	const metCount = criteria.filter((c) => c.met).length;
	box.classList.remove(
		"hidden",
		"convey-suggest--clear",
		"convey-suggest--partial",
	);
	if (allMet) {
		box.classList.add("convey-suggest--clear");
		box.innerHTML = `<div class="cs-header"><span class="cs-icon">✓</span><strong>Non-conveyance criteria met (${metCount}/${criteria.length})</strong></div>
<p class="cs-criteria">${criteria.map((c) => `<span class="cs-tick">✓ ${c.label}</span>`).join("")}</p>
<p class="cs-label">Suggested wording:</p>
<p class="cs-wording">"Patient assessed as suitable for non-conveyance. Observations within normal limits. No clinical concerns identified on primary survey. Patient assessed as having capacity to make an informed decision. Risks and alternatives have been clearly explained and understood. Patient aware to call 999 should symptoms worsen or new concerns arise."</p>
<p class="cs-disclaimer">Prompt only — clinician must make the final decision based on full clinical assessment.</p>`;
	} else {
		box.classList.add("convey-suggest--partial");
		box.innerHTML = `<div class="cs-header"><span class="cs-icon">◑</span><strong>Non-conveyance criteria — ${metCount}/${criteria.length} met</strong></div>
<p class="cs-criteria">${criteria.map((c) => `<span class="${c.met ? "cs-tick" : "cs-cross"}">${c.met ? "✓" : "✗"} ${c.label}</span>`).join("")}</p>
<p class="cs-disclaimer">Prompt only — clinician must make the final decision based on full clinical assessment.</p>`;
	}
}

function buildSafeguardingText() {
	const concerns = [...state.safeguardingConcerns].map((c) =>
		c === "Other" ? val("safeguardingOtherText") || "Other" : c,
	);
	if (!concerns.length && !val("safeguardingDetail")) return "";
	const lines = [];
	if (concerns.length)
		lines.push(`Safeguarding concerns: ${concerns.join(", ")}.`);
	if (val("safeguardingDetail"))
		lines.push(`Detail: ${val("safeguardingDetail")}`);
	if (isChecked("safeguardingReferral")) {
		const uly = val("ulyssesNumber");
		const ulyStr = uly ? ` Ulysses ref: ULY${uly}.` : "";
		const ref = val("safeguardingReferralDetail");
		lines.push(`Safeguarding referral made.${ulyStr}${ref ? ` ${ref}` : ""}`);
	}
	return lines.join("\n");
}

function updateDemographicVisibility() {
	const sex = val("ptSex");
	const age = parseInt(val("ptAge"), 10);
	const isFemaleOrOther = sex === "Female" || sex === "Other";
	const isReproductiveAge = isNaN(age) || (age >= 10 && age <= 60);
	$("#gynaeCard")?.classList.toggle(
		"hidden",
		!(isFemaleOrOther && isReproductiveAge),
	);
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

function buildEdHandoverText() {
	const now = new Date();
	const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
	const pc = getPc();
	const age = val("ptAge");
	const sex = val("ptSex");
	const demographics = [
		age ? `${age}yr` : null,
		sex !== "Not specified" ? sex : null,
	]
		.filter(Boolean)
		.join(" ");
	const dest = buildConveyDestination("convey");

	// Obs
	const obs = [
		val("hr") ? `HR ${val("hr")}bpm` : null,
		val("bp") ? `BP ${val("bp")}mmHg` : null,
		val("rr") ? `RR ${val("rr")}/min` : null,
		val("spo2") ? `SpO₂ ${val("spo2")}%` : null,
		val("temp") ? `Temp ${val("temp")}°C` : null,
		val("gcsScore") ? `GCS ${val("gcsScore")}/15` : null,
		val("bm") ? `BM ${val("bm")}mmol/L` : null,
	]
		.filter(Boolean)
		.join(" | ");

	// ABCs
	const abcdeAbnormals = [];
	let abcdeAllClear = true;
	window.CrewMateOptions.ABCDE.sections.forEach(({ key, notes: notesId }) => {
		const chips = $$(`[data-abc="${key}"]`);
		const abnormals = chips
			.filter((b) => b.dataset.abcState === "abnormal")
			.map((b) => b.dataset.abnormal);
		const notes = notesId ? val(notesId) : "";
		if (abnormals.length || notes) {
			abcdeAllClear = false;
			abcdeAbnormals.push(
				`${key}: ${[...abnormals, notes].filter(Boolean).join(", ")}.`,
			);
		}
	});
	const abcdeSummary = abcdeAllClear
		? "Primary survey: No ABC concerns."
		: abcdeAbnormals.join("\n");

	const hasPain = !isChecked("noPain");
	const site = getSelectedParts(state.siteParts);
	const radiation = getSelectedParts(state.radiationParts);
	const character = listFactors(state.character, "characterOther", "");
	const associated = listFactors(state.associated, "associatedOther", "");
	const exacerbating = listFactors(state.exacerbating, "exacerbatingOther", "");
	const relieving = listFactors(state.relieving, "relievingOther", "");
	const severityNow = val("severity");
	const severityWorst = val("severityWorst");
	const onsetType = val("onsetType");
	const oTime = onsetTime();
	const duration = val("onsetDuration");
	const clockSuffix = onsetClockSuffix();
	const onsetStr = [
		onsetType,
		oTime ? oTime + clockSuffix : null,
		duration ? `duration ${duration}` : null,
	]
		.filter(Boolean)
		.join(", ");
	const severityStr = [
		severityNow ? `${severityNow}/10 now` : null,
		severityWorst ? `${severityWorst}/10 at worst` : null,
	]
		.filter(Boolean)
		.join(", ");

	const socratesLines = [];
	if (hasPain) {
		if (site) socratesLines.push(`Site: ${site}`);
		if (onsetStr) socratesLines.push(`Onset: ${onsetStr}`);
		if (character) socratesLines.push(`Character: ${character}`);
		if (radiation) socratesLines.push(`Radiation: ${radiation}`);
		if (associated) socratesLines.push(`Associated: ${associated}`);
		if (exacerbating) socratesLines.push(`Worse with: ${exacerbating}`);
		if (relieving) socratesLines.push(`Better with: ${relieving}`);
		if (severityStr) socratesLines.push(`Severity: ${severityStr}`);
	} else {
		if (onsetStr) socratesLines.push(`Onset: ${onsetStr}`);
		if (associated) socratesLines.push(`Associated symptoms: ${associated}`);
		if (severityStr) socratesLines.push(`Severity: ${severityStr}`);
	}

	// Interventions
	const drugs = state.drugEntries.map((e) => {
		const parts = [e.drug];
		if (e.dose) parts.push(e.dose);
		if (e.route) parts.push(`via ${e.route}`);
		if (e.time) parts.push(`at ${e.time}`);
		return parts.join(" ");
	});
	const ivLines = state.ivEntries.map((e) => {
		const parts = [e.type || "IV access"];
		if (e.gauge) parts.push(e.gauge);
		if (e.site) parts.push(`— ${e.site}`);
		if (e.outcome) parts.push(`(${e.outcome})`);
		const desc = parts.join(" ");
		return e.time ? `[${e.time}] ${desc}` : desc;
	});
	const txLines = [
		...(state.airwayInterventions.size
			? [`Airway: ${[...state.airwayInterventions].join(", ")}`]
			: []),
		...(state.woundInterventions.size
			? [`Wound: ${[...state.woundInterventions].join(", ")}`]
			: []),
		...ivLines,
		...drugs,
		...(val("otherInterventionsFree") ? [val("otherInterventionsFree")] : []),
	];
	const ecgLine = buildEcgText();
	const sgText = buildSafeguardingText();
	const clinChanges = state.clinicalChanges.map(
		(e) => `${e.time ? `[${e.time}] ` : ""}${e.text}`,
	);

	//  Assessment — ROS
	const assessmentLines = [];
	Object.entries(window.CrewMateOptions.ROS.labels).forEach(
		([section, label]) => {
			const hasAbnormal =
				window.CrewMateOptions.ROS[section]?.items?.some(
					([id]) => state.ros[`${section}_${id}`] === "abnormal",
				) || false;
			const hasNotes = (
				window.CrewMateOptions.ROS.notes_field[section] || []
			).some((f) => val(f));
			if (hasAbnormal || hasNotes) {
				assessmentLines.push(`${label}: ${rosBlock(section)}`);
			}
		},
	);
	const oeText = val("oeText");

	const lines = [
		`ED HANDOVER ── ${timeStr}`,
		"",
		"PATIENT",
		`${demographics ? demographics + " | " : ""}${pc}`,
		"",
		"BACKGROUND",
		`PMH: ${isChecked("noPmh") ? "No significant past medical history" : val("pmh") || "Not documented"}`,
		`Medications: ${isChecked("noMeds") ? "No regular medications" : val("medications") || "Not documented"}`,
		`Allergies: ${isChecked("nkda") ? "NKDA" : val("allergies") || "Not documented"}`,
		val("prevDetails")
			? `Social / family history: ${val("prevDetails")}`
			: null,
		"",
		"HISTORY",
		val("hpcEvents") || "History not documented.",
		"",
		socratesLines.length ? (hasPain ? "PAIN (SOCRATES)" : "SYMPTOMS") : null,
		socratesLines.length ? socratesLines.join("\n") : null,
		socratesLines.length ? "" : null,
		obs ? `OBSERVATIONS\n${obs}` : null,
		obs ? "" : null,
		"ASSESSMENT",
		abcdeSummary,
		ecgLine ? `ECG: ${ecgLine.replace("ECG: ", "")}` : null,
		assessmentLines.length
			? assessmentLines.join("\n")
			: "Systems review: No abnormalities detected.",
		oeText ? `\nOn examination: ${oeText}` : null,
		"",
		txLines.length ? "INTERVENTIONS" : null,
		txLines.length ? txLines.join("\n") : null,
		txLines.length ? "" : null,
		clinChanges.length ? "CLINICAL CHANGES" : null,
		clinChanges.length ? clinChanges.join("\n") : null,
		clinChanges.length ? "" : null,
		val("capacityStatus") ? `CAPACITY: ${val("capacityStatus")}` : null,
		sgText ? `\nSAFEGUARDING\n${sgText}` : null,
		val("handoverNotes") ? `\nADDITIONAL NOTES\n${val("handoverNotes")}` : null,
		dest ? `\nRECEIVING: ${dest}` : null,
	].filter((l) => l !== null);
	return lines.join("\n");
}

//Binders
function bindEvents() {
	$("#safeguardingReferral")?.addEventListener("change", () => {
		$("#safeguardingReferralFields")?.classList.toggle(
			"hidden",
			!$("#safeguardingReferral").checked,
		);
	});
	$$(".tab").forEach((tab) =>
		tab.addEventListener("click", () => switchTab(tab.dataset.tab)),
	);
	$("#fallsTimeUnknownBtn")?.addEventListener("click", () => {
		const btn = $("#fallsTimeUnknownBtn");
		const input = $("#fallsTime");
		const isUnknown = btn.classList.toggle("selected");
		input.disabled = isUnknown;
		input.style.opacity = isUnknown ? "0.4" : "";
		if (isUnknown) input.value = "";
	});
	$("#seizureTimeUnknownBtn")?.addEventListener("click", () => {
		const btn = $("#seizureTimeUnknownBtn");
		const input = $("#seizureTime");
		const isUnknown = btn.classList.toggle("selected");
		input.disabled = isUnknown;
		input.style.opacity = isUnknown ? "0.4" : "";
		if (isUnknown) input.value = "";
	});
	$("#seizureWitnessed")?.addEventListener("change", () => {
		const v = val("seizureWitnessed");
		$("#seizureWitnessedByWrap")?.classList.toggle("hidden", v !== "Witnessed");
	});
	$("#seizurePostictal")?.addEventListener("change", () => {
		const v = val("seizurePostictal");
		$("#seizurePostictalDetailsWrap")?.classList.toggle("hidden", v !== "Yes");
	});
	document.addEventListener("click", (e) => {
		const btn = e.target.closest("#seizurePostictalFeaturesGrid .square-btn");
		if (!btn) return;
		btn.classList.toggle("selected");
		const feature = btn.dataset.value;
		if (btn.classList.contains("selected"))
			state.seizurePostictalFeatures.add(feature);
		else state.seizurePostictalFeatures.delete(feature);
	});
	document.addEventListener("click", (e) => {
		const btn = e.target.closest("#urinaryVolumeGrid .square-btn");
		if (!btn) return;
		btn.classList.toggle("selected");
		const feature = btn.dataset.value;
		if (btn.classList.contains("selected"))
			state.urinaryVolumeFeatures.add(feature);
		else state.urinaryVolumeFeatures.delete(feature);
	});
	document.addEventListener("click", (e) => {
		const btn = e.target.closest("#urinaryColourGrid .square-btn");
		if (!btn) return;
		btn.classList.toggle("selected");
		const feature = btn.dataset.value;
		if (btn.classList.contains("selected"))
			state.urinaryColourFeatures.add(feature);
		else state.urinaryColourFeatures.delete(feature);
	});
	document.addEventListener("click", (e) => {
		const btn = e.target.closest("[data-mca-ability]");
		if (!btn) return;
		btn.classList.toggle("selected");
		const v = btn.dataset.mcaAbility;
		if (btn.classList.contains("selected")) state.mcaAbilities.add(v);
		else state.mcaAbilities.delete(v);
	});
	document.addEventListener("click", (e) => {
		const btn = e.target.closest("[data-lacks-cap-reason]");
		if (!btn) return;
		btn.classList.toggle("selected");
		const v = btn.dataset.lacksCapReason;
		if (btn.classList.contains("selected")) state.lacksCapAbilities.add(v);
		else state.lacksCapAbilities.delete(v);
	});
	$("#resetButton").addEventListener("click", () => {
		if (confirm("Clear all data and start a new PRF?")) {
			clearSavedState();
			location.reload();
		}
	});
	$("#pcSelect").addEventListener("change", () => {
		const pc = val("pcSelect");
		$("#pcOtherWrap").classList.toggle("hidden", pc !== "Other");
		$("#fallsAssessmentCard").classList.toggle("hidden", pc !== "Fall");
		$("#headInjuryCard").classList.toggle("hidden", pc !== "Head injury");
		$("#seizureAssessmentCard").classList.toggle("hidden", pc !== "Seizure");
		$("#strokeAssessmentCard")?.classList.toggle("hidden", pc !== "Stroke");
		const isMhPc =
			window.CrewMateOptions.OPTIONS.mentalHealth.presentingComplaint.includes(
				pc,
			);
		$("#odAssessmentCard")?.classList.toggle(
			"hidden",
			pc !== "Overdose / poisoning",
		);
		$("#mhAssessmentCard").classList.toggle("hidden", !isMhPc);
		$("#ros-mh-section")?.classList.toggle("hidden", !isMhPc);
		if (state.worseningAuto) applyWorseningDefault();
		else updateWorseningScript();
	});

	// Demographics
	$("#ptSex")?.addEventListener("change", updateDemographicVisibility);
	$("#ptAge")?.addEventListener("input", updateDemographicVisibility);
	$("#pregnancyStatus")?.addEventListener("change", () => {
		const status = val("pregnancyStatus");
		const showDetails =
			status === "Possibly pregnant" || status === "Confirmed pregnant";
		$("#pregnancyDetails")?.classList.toggle("hidden", !showDetails);
	});
	document.addEventListener("click", (e) => {
		const chip = e.target.closest(".gynae-symptom, .gynae-char, .gynae-disc");
		if (!chip) return;
		chip.classList.toggle("selected");
		if (chip.classList.contains("gynae-symptom")) {
			const sym = chip.dataset.gynaeSymptom;
			if (sym === "pvBleed")
				$("#pvBleedDetail")?.classList.toggle(
					"hidden",
					!chip.classList.contains("selected"),
				);
			if (sym === "discharge")
				$("#dischargeDetail")?.classList.toggle(
					"hidden",
					!chip.classList.contains("selected"),
				);
		}
	});

	$("#capacityStatus").addEventListener("change", handleCapacityDisplay);
	$("#onsetTime").addEventListener("change", () => {
		$("#onsetTimeOther")?.classList.toggle(
			"hidden",
			val("onsetTime") !== "Other",
		);
	});
	$("#coughType").addEventListener("change", () => {
		$("#sputumWrap")?.classList.toggle(
			"hidden",
			val("coughType") !== "Productive cough present",
		);
	});
	$("#drugName")?.addEventListener("change", () => {
		const isOther = val("drugName") === "Other";
		$("#drugNameOther")?.classList.toggle("hidden", !isOther);
		if (isOther) setTimeout(() => $("#drugNameOther")?.focus(), 50);
	});
	document.addEventListener("change", (e) => {
		if (e.target.id === "catheterPresent")
			$("#catheterDetails")?.classList.toggle("hidden", !e.target.checked);
		if (e.target.id === "stomaPresent")
			$("#stomaDetails")?.classList.toggle("hidden", !e.target.checked);
	});
	document.addEventListener("click", (e) => {
		const toggle = e.target.closest(".gcs-toggle");
		if (toggle) {
			const prefix = toggle.dataset.gcsToggle;
			const panel = $("#" + prefix + "Panel");
			if (!panel) return;
			const open = !panel.classList.contains("hidden");
			panel.classList.toggle("hidden", open);
			toggle.textContent = (open ? "▸" : "▾") + " GCS Calculator";
		}
	});
	$("#worseningMode").addEventListener("change", () => {
		state.worseningAuto = false;
		$("#customWorsening").classList.toggle(
			"hidden",
			val("worseningMode") !== "Custom",
		);
		updateWorseningScript();
	});
	$("#conveyanceDecision").addEventListener("change", () => {
		handleConveyanceDisplay();
		applyWorseningDefault();
		renderConveyanceSuggestion();
	});
	$("#conveyHospital")?.addEventListener("change", handleConveyanceDisplay);
	$("#conveyDepartment")?.addEventListener("change", handleConveyanceDisplay);
	$("#mobilisationToVehicle")?.addEventListener("change", () => {
		$("#mobilisationOtherWrap")?.classList.toggle(
			"hidden",
			val("mobilisationToVehicle") !== "Other",
		);
	});
	$("#clearPainButton")?.addEventListener("click", clearPainAssessment);
	$("#clearBodyMapButton")?.addEventListener("click", clearBodyMap);
	document.addEventListener("click", (e) => {
		const btn = e.target.closest(".pain-score-btn");
		if (!btn) return;
		const gridId = btn.dataset.grid;
		const inputId = btn.dataset.input;
		const already = btn.classList.contains("selected");
		$$("#" + gridId + " .pain-score-btn").forEach((b) =>
			b.classList.remove("selected"),
		);
		if (!already) {
			btn.classList.add("selected");
			$("#" + inputId).value = `${btn.dataset.score}/10`;
		} else {
			$("#" + inputId).value = "";
		}
	});
	$("#noPain").addEventListener("change", () => {
		const noPain = $("#noPain").checked;
		$("#painBodyMapWrap").classList.toggle("hidden", noPain);
		$("#painCharacterGroup").classList.toggle("hidden", noPain);
	});
	$("#oaFound").addEventListener("change", () => {
		const notPatient = $("#oaFound").value !== "Greeted by patient";
		$("#oaPatientContactWrap").style.display = notPatient ? "" : "none";
		if (!notPatient) {
			$("#oaPatientFoundHow").value = "";
		}
	});
	$("#headLOC")?.addEventListener("change", () => {
		const v = val("headLOC");
		$("#headLOCDurationWrap")?.classList.toggle("hidden", !v || v === "No LOC");
	});
	$("#headRetrograde")?.addEventListener("change", () => {
		const v = val("headRetrograde");
		$("#headRetroDurationWrap")?.classList.toggle("hidden", v !== "Yes");
	});
	$("#handoverFormat").addEventListener("change", () => {
		const fmt = $("#handoverFormat").value;
		const isLah = fmt === "Leave at Home";
		$("#handoverEtaWrap")?.classList.toggle("hidden", fmt !== "ASHICE");
		$("#incidentTimeWrap")?.classList.toggle("hidden", fmt !== "ATMIST");
	});
	$("#generateOeButton").addEventListener("click", generateOe);
	$("#clearOeButton").addEventListener(
		"click",
		() => ($("#oeText").value = ""),
	);
	$("#refreshButton").addEventListener("click", generateOutput);
	$("#copyButton").addEventListener("click", copyOutput);

	// Obs
	$("#addObsBtn")?.addEventListener("click", () => {
		const set = window.CrewMateObsRecorder.createObsSet();
		$("#obsContainer")?.append(set);
		window.CrewMateObsRecorder.updateObsSetNumbers();
	});

	document.addEventListener("click", (e) => {
		const chip = e.target.closest(".legal-chip");
		if (chip) chip.classList.toggle("selected");
	});

	document.addEventListener("click", (event) => {
		const gcsBtn = event.target.closest(".gcs-btn");
		if (gcsBtn) {
			const { gcsPrefix, gcsField, gcsScore } = gcsBtn.dataset;
			gcsBtn
				.closest(".gcs-btn-row")
				?.querySelectorAll(".gcs-btn")
				.forEach((b) => b.classList.remove("selected"));
			gcsBtn.classList.add("selected");
			let sentinel = $("#" + gcsField);
			if (!sentinel) {
				sentinel = document.createElement("span");
				sentinel.id = gcsField;
				sentinel.hidden = true;
				document.body.append(sentinel);
			}
			sentinel.dataset.gcsSelected = gcsScore;
			window.CrewMateGcs.updateGcsTally(gcsPrefix);
			return;
		}

		const option = event.target.closest(".multi-group .square-btn");
		if (option) return toggleMulti(option);

		const abdoRegionBtn = event.target.closest(".abdo-region-btn");
		if (abdoRegionBtn) {
			const region = abdoRegionBtn.dataset.region;
			state.abdoActive = state.abdoActive === region ? null : region;
			renderAbdoGrid();
			return;
		}
		const abdoFindingChip = event.target.closest(".abdo-finding-chip");
		if (abdoFindingChip) {
			const region = state.abdoActive;
			if (!region) return;
			if (!state.abdoFindings[region]) state.abdoFindings[region] = new Set();
			const f = abdoFindingChip.dataset.finding;
			if (state.abdoFindings[region].has(f))
				state.abdoFindings[region].delete(f);
			else state.abdoFindings[region].add(f);
			renderAbdoGrid();
			return;
		}
		const abdoClearBtn = event.target.closest(".abdo-clear-btn");
		if (abdoClearBtn) {
			delete state.abdoFindings[abdoClearBtn.dataset.region];
			state.abdoActive = null;
			renderAbdoGrid();
			return;
		}

		const auscRegionBtn = event.target.closest(".ausc-region-btn");
		if (auscRegionBtn) {
			const region = auscRegionBtn.dataset.region;
			state.auscActive = state.auscActive === region ? null : region;
			renderAuscGrid();
			return;
		}
		const auscFindingChip = event.target.closest(".ausc-finding-chip");
		if (auscFindingChip) {
			const region = state.auscActive;
			if (!region) return;
			if (!state.auscFindings[region]) state.auscFindings[region] = new Set();
			const f = auscFindingChip.dataset.finding;
			if (state.auscFindings[region].has(f))
				state.auscFindings[region].delete(f);
			else state.auscFindings[region].add(f);
			renderAuscGrid();
			return;
		}
		const auscClearBtn = event.target.closest(".ausc-clear-btn");
		if (auscClearBtn) {
			delete state.auscFindings[auscClearBtn.dataset.region];
			state.auscActive = null;
			renderAuscGrid();
			return;
		}

		const abc = event.target.closest(".abc-chip");
		if (abc) return toggleAbc(abc);
		const convey = event.target.closest(".convey-chip");
		if (convey) return toggleConveyChip(convey);
		const ros = event.target.closest(".ros-chip");
		if (ros) return toggleRos(ros);
		const mapTab = event.target.closest("[data-map-mode]");
		if (mapTab) return setMapMode(mapTab.dataset.mapMode);
		const part = event.target.closest(".body-part");
		if (part) return toggleBodyPart(part);
		const remove = event.target.closest("[data-remove-part]");
		if (remove)
			return removeBodyPart(remove.dataset.removePart, remove.dataset.partType);
		const injuryTypeBtn = event.target.closest("[data-injury-type]");
		if (injuryTypeBtn) {
			const v = injuryTypeBtn.dataset.injuryType;
			pendingInjuryTypes.has(v)
				? pendingInjuryTypes.delete(v)
				: pendingInjuryTypes.add(v);
			injuryTypeBtn.classList.toggle("selected", pendingInjuryTypes.has(v));
			if (v === "Other")
				$("#injuryTypeOtherWrap")?.classList.toggle(
					"hidden",
					!pendingInjuryTypes.has("Other"),
				);
			return;
		}
		const injuryIntBtn = event.target.closest("[data-injury-intervention]");
		if (injuryIntBtn) {
			const v = injuryIntBtn.dataset.injuryIntervention;
			pendingInjuryInterventions.has(v)
				? pendingInjuryInterventions.delete(v)
				: pendingInjuryInterventions.add(v);
			injuryIntBtn.classList.toggle(
				"selected",
				pendingInjuryInterventions.has(v),
			);
			if (v === "Other")
				$("#injuryIntOtherWrap")?.classList.toggle(
					"hidden",
					!pendingInjuryInterventions.has("Other"),
				);
			return;
		}
		const injuryNvBtn = event.target.closest("[data-injury-nv]");
		if (injuryNvBtn) {
			const key = injuryNvBtn.dataset.injuryNv;
			const isAbnormal = pendingInjuryNv[key] === "abnormal";
			pendingInjuryNv[key] = isAbnormal ? "normal" : "abnormal";
			injuryNvBtn.classList.toggle("selected", isAbnormal);
			injuryNvBtn.classList.toggle("abnormal", !isAbnormal);
			injuryNvBtn.textContent = isAbnormal
				? injuryNvBtn.dataset.normal
				: injuryNvBtn.dataset.abnormal;
			return;
		}
		const removeInjury = event.target.closest("[data-remove-injury]");
		if (removeInjury)
			return removeInjuryEntry(Number(removeInjury.dataset.removeInjury));
		const szChip = event.target.closest("[data-sz-group]");
		if (szChip) {
			const map = {
				type: "seizureType",
				features: "seizureFeatures",
				findings: "seizureFindings",
				precipitants: "seizurePrecipitants",
				aed: "aedCompliance",
			};
			const set = state[map[szChip.dataset.szGroup]];
			if (!set) return;
			const v = szChip.dataset.szValue;
			set.has(v) ? set.delete(v) : set.add(v);
			szChip.classList.toggle("selected", set.has(v));
			return;
		}
		const mhChip = event.target.closest("[data-mh-group]");
		if (mhChip) {
			const map = {
				intent: "mhIntent",
				planning: "mhPlanning",
				odPrescribed: "odPrescribed",
				odAssessSource: "odAssessSource",
				shMethod: "shMethod",
				shDepth: "shDepth",
				mseAppearance: "mseAppearance",
				mseBehaviour: "mseBehaviour",
				mseSpeech: "mseSpeech",
				mseThoughtContent: "mseThoughtContent",
				mseAffect: "mseAffect",
				mseThoughtForm: "mseThoughtForm",
				msePerception: "msePerception",
				mseInsight: "mseInsight",
			};
			const set = state[map[mhChip.dataset.mhGroup]];
			if (!set) return;
			const v = mhChip.dataset.mhValue;
			set.has(v) ? set.delete(v) : set.add(v);
			mhChip.classList.toggle("selected", set.has(v));
			return;
		}
		const sgChip = event.target.closest("[data-sg-group]");
		if (sgChip) {
			const v = sgChip.dataset.sgValue;
			if (v === "None identified on scene") {
				state.safeguardingConcerns.clear();
				state.safeguardingConcerns.add(v);
			} else {
				state.safeguardingConcerns.delete("None identified on scene");
				state.safeguardingConcerns.has(v)
					? state.safeguardingConcerns.delete(v)
					: state.safeguardingConcerns.add(v);
			}
			$$("[data-sg-group]").forEach((b) =>
				b.classList.toggle(
					"selected",
					state.safeguardingConcerns.has(b.dataset.sgValue),
				),
			);
			const hasConcerns =
				state.safeguardingConcerns.size > 0 &&
				!state.safeguardingConcerns.has("None identified on scene");
			$("#safeguardingDetailWrap")?.classList.toggle("hidden", !hasConcerns);
			$("#safeguardingOtherWrap")?.classList.toggle(
				"hidden",
				!state.safeguardingConcerns.has("Other"),
			);
			renderConveyanceSuggestion();
			return;
		}
		const txChip = event.target.closest("[data-tx-group]");
		if (txChip) {
			const group = txChip.dataset.txGroup;
			const v = txChip.dataset.txValue;
			if (group === "manual") {
				pendingManualItems.has(v)
					? pendingManualItems.delete(v)
					: pendingManualItems.add(v);
				txChip.classList.toggle("selected", pendingManualItems.has(v));
				$("#manualOtherWrap")?.classList.toggle(
					"hidden",
					!pendingManualItems.has("Other"),
				);
				return;
			}
			const map = {
				airway: "airwayInterventions",
				wound: "woundInterventions",
				other: "otherInterventions",
			};
			const otherWrap = {
				wound: "woundOtherWrap",
				other: "otherIntOtherWrap",
			};
			const set = state[map[group]];
			if (!set) return;
			set.has(v) ? set.delete(v) : set.add(v);
			txChip.classList.toggle("selected", set.has(v));
			const wrapId = otherWrap[group];
			if (v === "Other" && wrapId) {
				$(`#${wrapId}`)?.classList.toggle("hidden", !set.has("Other"));
			}
			return;
		}
		const removeVa = event.target.closest("[data-remove-va]");
		if (removeVa) return removeIvEntry(Number(removeVa.dataset.removeVa));
		const removeDrug = event.target.closest("[data-remove-drug]");
		if (removeDrug)
			return removeDrugEntry(Number(removeDrug.dataset.removeDrug));
		const repeatDrug = event.target.closest("[data-repeat-drug]");
		if (repeatDrug)
			return repeatDrugEntry(Number(repeatDrug.dataset.repeatDrug));
		const removeChange = event.target.closest("[data-remove-change]");
		if (removeChange)
			return removeChangeEntry(Number(removeChange.dataset.removeChange));
		const removeManual = event.target.closest("[data-remove-manual]");
		if (removeManual) {
			state.manualHandling.splice(Number(removeManual.dataset.removeManual), 1);
			renderManualEntries();
			return;
		}
		const removeMhAct = event.target.closest("[data-remove-mhact]");
		if (removeMhAct) {
			state.mhActs.splice(Number(removeMhAct.dataset.removeMhact), 1);
			renderMhActEntries();
			return;
		}
		const ecgFinding = event.target.closest(".ecg-finding");
		if (ecgFinding) return toggleEcgFinding(ecgFinding);
		const ecgLead = event.target.closest(".ecg-lead");
		if (ecgLead) return toggleEcgLead(ecgLead);
		const copySectionBtn = event.target.closest("[data-copy-section]");
		if (copySectionBtn)
			return copySectionById(copySectionBtn.dataset.copySection);
	});
}

// User actuions

function switchTab(tabName) {
	$$(".tab").forEach((tab) =>
		tab.classList.toggle("active", tab.dataset.tab === tabName),
	);
	$$(".panel").forEach((panel) =>
		panel.classList.toggle("active", panel.id === `panel-${tabName}`),
	);
	if (tabName === "output") generateOutput();
}

function toggleMulti(button) {
	const stateKey = button.closest(".multi-group").dataset.state;
	const set = state[stateKey];
	const value = button.dataset.value;
	if (set.has(value)) {
		set.delete(value);
		button.classList.remove("selected");
		if (value === "Other") setOtherFactorVisible(stateKey, false);
	} else {
		set.add(value);
		button.classList.add("selected");
		if (value === "Other") setOtherFactorVisible(stateKey, true);
	}
}

function setOtherFactorVisible(stateKey, visible) {
	const wrapIds = {
		character: "characterOtherWrap",
		associated: "associatedOtherWrap",
		exacerbating: "exacerbatingOtherWrap",
		relieving: "relievingOtherWrap",
		fallsSymptoms: "fallsSymptomsOtherWrap",
		fallsLocation: "fallsLocationOtherWrap",
		fallsActivity: "fallsActivityOtherWrap",
	};
	const wrapId = wrapIds[stateKey];
	if (wrapId) $(`#${wrapId}`)?.classList.toggle("hidden", !visible);
}

function buildConveyTransferChips(
	containerId = "conveyTransferGrid",
	chipClass = "convey-chip",
) {
	const root = $(`#${containerId}`);
	if (!root) return;
	window.CrewMateOptions.OPTIONS.conveyance.transferDetails.forEach(
		([normal, abnormal]) => {
			const button = document.createElement("button");
			button.type = "button";
			button.className = `square-btn ${chipClass} selected`;
			button.textContent = normal;
			button.dataset.normal = normal;
			button.dataset.abnormal = abnormal;
			button.dataset.conveyState = "normal";
			if (abnormal === "Clinical change during conveyance")
				button.dataset.clinicalChange = "true";
			if (abnormal === "Care escalated en route")
				button.dataset.escalated = "true";
			root.append(button);
		},
	);
}

function toggleConveyChip(button) {
	const isPaeds = button.classList.contains("p-convey-chip");
	const changeWrapId = isPaeds ? "pConveyChangeWrap" : "conveyChangeWrap";
	const escalateWrapId = isPaeds
		? "pConveyEscalatedWrap"
		: "conveyEscalatedWrap";
	const stableSelector = isPaeds
		? '.p-convey-chip[data-normal="Remained stable throughout"]'
		: '.convey-chip[data-normal="Remained stable throughout"]';

	const isAbnormal = button.dataset.conveyState === "abnormal";
	const next = isAbnormal ? "normal" : "abnormal";
	button.dataset.conveyState = next;
	button.classList.toggle("abnormal", next === "abnormal");
	button.classList.toggle("selected", next === "normal");
	button.textContent =
		next === "abnormal" ? button.dataset.abnormal : button.dataset.normal;

	if (button.dataset.clinicalChange) {
		$(`#${changeWrapId}`)?.classList.toggle("hidden", next !== "abnormal");
	}
	if (button.dataset.escalated) {
		$(`#${escalateWrapId}`)?.classList.toggle("hidden", next !== "abnormal");
	}
	if (button.dataset.clinicalChange && next === "abnormal") {
		const stable = $(stableSelector);
		if (stable?.dataset.conveyState === "normal") toggleConveyChip(stable);
	}
}

function getConveyTransferText(isPaeds = false) {
	return $$(isPaeds ? ".p-convey-chip" : ".convey-chip")
		.map((chip) => chip.textContent)
		.join("; ");
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
	window.CrewMateOptions.ABCDE.dLinks.forEach(([left, right]) => {
		const linkedNormal =
			left === normalLabel ? right : right === normalLabel ? left : null;
		if (!linkedNormal) return;
		const linked = $(`.abc-chip[data-abc="D"][data-normal="${linkedNormal}"]`);
		if (linked && linked.dataset.abcState === "normal")
			setAbcChipState(linked, "abnormal");
	});
}

function toggleRos(button) {
	const isAbnormal = state.ros[button.dataset.stateId] === "abnormal";
	const next = isAbnormal ? "normal" : "abnormal";
	state.ros[button.dataset.stateId] = next;
	button.classList.toggle("abnormal", !isAbnormal);
	button.classList.toggle("selected", isAbnormal);
	button.textContent = isAbnormal
		? button.dataset.normal
		: button.dataset.abnormal;
	updateRosBadge(button.dataset.section);

	if (button.dataset.stateId === "neuro_fast") {
		const card = $("#strokeAssessmentCard");
		if (card) card.classList.toggle("hidden", next === "normal");
	}

	if (button.dataset.stateId === "resp_breathingRate") {
		const wrap = $("#rrDetailWrap");
		if (wrap) {
			wrap.classList.toggle("hidden", next === "normal");
			if (next === "normal") {
				const hidden = $("#rrDetail");
				if (hidden) hidden.value = "";
				wrap
					.querySelectorAll("[data-value]")
					.forEach((c) => c.classList.remove("selected"));
			}
		}
	}

	if (button.dataset.stateId === "urine_volume") {
		const wrap = $("#urinaryVolumeWrap");
		if (wrap) {
			wrap.classList.toggle("hidden", next === "normal");
			if (next === "normal") {
				state.urinaryVolumeFeatures.clear();
				wrap
					.querySelectorAll(".square-btn")
					.forEach((b) => b.classList.remove("selected"));
			}
		}
	}

	if (button.dataset.stateId === "urine_colour") {
		const wrap = $("#urinaryColourWrap");
		if (wrap) {
			wrap.classList.toggle("hidden", next === "normal");
			if (next === "normal") {
				state.urinaryColourFeatures.clear();
				wrap
					.querySelectorAll(".square-btn")
					.forEach((b) => b.classList.remove("selected"));
			}
		}
	}
}

function updateRosBadge(section) {
	const hasAbnormal = Object.entries(state.ros).some(
		([key, value]) => key.startsWith(`${section}_`) && value === "abnormal",
	);
	const badge = $(`#badge-${section}`);
	badge.textContent = hasAbnormal ? "Findings" : "All normal";
	badge.classList.toggle("flagged", hasAbnormal);
}

function setMapMode(mode) {
	state.mapMode = mode;
	$$(".mini-tab").forEach((btn) =>
		btn.classList.toggle("active", btn.dataset.mapMode === mode),
	);
}

function toggleBodyPart(part) {
	const targetSet =
		state.mapMode === "site" ? state.siteParts : state.radiationParts;
	const otherSet =
		state.mapMode === "site" ? state.radiationParts : state.siteParts;
	const id = part.id;
	if (targetSet.has(id)) targetSet.delete(id);
	else {
		targetSet.add(id);
		otherSet.delete(id);
	}
	part.classList.toggle("site", state.siteParts.has(id));
	part.classList.toggle("radiation", state.radiationParts.has(id));
	updateMapTags();
}

function removeBodyPart(id, type) {
	const set = type === "site" ? state.siteParts : state.radiationParts;
	set.delete(id);
	$(`#${CSS.escape(id)}`)?.classList.remove(type);
	updateMapTags();
}

function updateMapTags() {
	renderPartTags("siteTags", state.siteParts, "site", "Not selected");
	renderPartTags(
		"radiationTags",
		state.radiationParts,
		"radiation",
		"No radiation selected",
	);
}

function renderPartTags(containerId, set, type, emptyText) {
	const container = $(`#${containerId}`);
	container.innerHTML = "";
	if (!set.size) {
		container.textContent = emptyText;
		return;
	}
	set.forEach((id) => {
		const part = $(`#${CSS.escape(id)}`);
		const tag = document.createElement("span");
		tag.className = `tag ${type}`;
		tag.innerHTML = `${part?.dataset.label || id}<button type="button" data-remove-part="${id}" data-part-type="${type}" aria-label="Remove ${part?.dataset.label || id}">×</button>`;
		container.append(tag);
	});
}

function handleCapacityDisplay() {
	const status = val("capacityStatus");
	$("#capacityChecks").classList.toggle(
		"hidden",
		status === "Lacks capacity" || status === "Not applicable",
	);
	const lacksCapacity = status === "Lacks capacity";
	$("#lacksCapReasons")?.classList.toggle("hidden", !lacksCapacity);
	$("#bestInterests").classList.toggle("hidden", !lacksCapacity);
}

function getSelectedParts(set) {
	return [...set]
		.map((id) => $(`#${CSS.escape(id)}`)?.dataset.label || id)
		.join(", ");
}

function rosLine(section) {
	return (
		window.CrewMateOptions.ROS[section].items
			.map(([id, normal, abnormal]) => {
				if (state.ros[`${section}_${id}`] !== "abnormal") return normal;
				if (section === "resp" && id === "breathingRate") {
					const detail = val("rrDetail");
					if (detail) return detail;
				}
				return abnormal;
			})
			.join(". ") + "."
	);
}

function abcChipText(button) {
	if (
		button.dataset.normal === "Good colour" &&
		button.dataset.abcState === "abnormal"
	) {
		const detail = val("colourDetail");
		if (detail) return detail;
	}
	if (
		button.dataset.normal === "Normal Rate" &&
		button.dataset.abcState === "abnormal"
	) {
		const detail = val("hrRateDetail");
		if (detail) return detail;
	}
	return button.textContent;
}

function abcLine(section) {
	const values = $$(`[data-abc="${section.key}"]`).map(abcChipText);
	const vitals = (section.vitals || [])
		.map(([id, label]) => (val(id) ? `${label}: ${val(id)}` : null))
		.filter(Boolean);
	const notes = val(section.notes);
	return `${section.key} - ${[...values, ...vitals, notes].filter(Boolean).join(", ") || "assessed"}.`;
}

function abcCompactLine(section) {
	const abnormals = $$(`[data-abc="${section.key}"]`)
		.filter((b) => b.dataset.abcState === "abnormal")
		.map(abcChipText);
	const notes = val(section.notes);
	const all = [...abnormals, notes].filter(Boolean);
	if (!all.length) return null;
	return `${section.key} — ${all.join(", ")}.`;
}

function abcHandoverSummary() {
	const lines = window.CrewMateOptions.ABCDE.sections
		.map(abcCompactLine)
		.filter(Boolean);
	return lines.length ? lines.join("\n") : "No ABCDE concerns identified.";
}

function toggleEcgFinding(btn) {
	const finding = btn.dataset.finding;
	if (finding === "Not performed") {
		state.ecgFindings.clear();
		state.ecgFindings.add("Not performed");
		$$(".ecg-finding").forEach((b) =>
			b.classList.toggle("selected", b.dataset.finding === "Not performed"),
		);
	} else {
		if (state.ecgFindings.has("Not performed")) {
			state.ecgFindings.delete("Not performed");
			$(".ecg-finding[data-finding='Not performed']")?.classList.remove(
				"selected",
			);
		}
		if (state.ecgFindings.has(finding)) {
			state.ecgFindings.delete(finding);
			btn.classList.remove("selected");
		} else {
			state.ecgFindings.add(finding);
			btn.classList.add("selected");
		}
	}
	const hasLeadFinding = [...state.ecgFindings].some((f) =>
		window.CrewMateOptions.OPTIONS.cardiac.ecgLeadFindings.includes(f),
	);
	$("#ecgLeadPanel")?.classList.toggle("hidden", !hasLeadFinding);
	if (!hasLeadFinding) {
		state.ecgLeads.clear();
		$$(".ecg-lead").forEach((b) => b.classList.remove("selected"));
	}
}

function toggleEcgLead(btn) {
	const lead = btn.dataset.lead;
	if (state.ecgLeads.has(lead)) {
		state.ecgLeads.delete(lead);
		btn.classList.remove("selected");
	} else {
		state.ecgLeads.add(lead);
		btn.classList.add("selected");
	}
}

function buildEcgText() {
	if (!state.ecgFindings.size) return "";
	const ecgLeadFindings =
		window.CrewMateOptions.OPTIONS.cardiac.ecgLeadFindings;
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

function generateOe() {
	syncAuscultationOutput();
	const L = window.CrewMateOptions.ROS.oe_label;
	const oe = [
		"OE:",
		"",
		window.CrewMateOptions.ABCDE.sections.map(abcLine).join("\n"),
		"",
		`${L.resp}: ${rosLine("resp")} ${val("respAus") ? `Auscultation: ${val("respAus")}.` : ""}`,
		`${L.cvs}: ${rosLine("cvs")} ${buildEcgText()}`,
		`${L.neuro}: ${rosLine("neuro")}`,
		`${L.gi}: ${rosLine("gi")} ${[
			Object.entries(state.abdoFindings).filter(([, f]) => f.size > 0).length
				? `Palpation: ${Object.entries(state.abdoFindings)
						.filter(([, f]) => f.size > 0)
						.map(([r, f]) => `${r} — ${[...f].join(", ")}`)
						.join("; ")}.`
				: "",
			val("giFluidIntake") ? `Fluid intake: ${val("giFluidIntake")}.` : "",
			val("giAppetite") ? `Appetite: ${val("giAppetite")}.` : "",
			val("bowelSounds") ? `Bowel sounds: ${val("bowelSounds")}.` : "",
		]
			.filter(Boolean)
			.join(" ")}`.trimEnd(),
		`${L.urine}: ${rosLine("urine")}`,
		`${L.integ}: ${rosLine("integ")}`,
		`${L.msk}: ${rosLine("msk")}`,
		`${L.mh}: ${rosLine("mh")}`,
	].join("\n");
	$("#oeText").value = oe;
}

function getPc() {
	return val("pcSelect") === "Other"
		? val("pcOther") || "Other"
		: val("pcSelect") || "Not specified";
}

function listFactors(set, otherFieldId, fallback) {
	const items = [...set].filter((value) => value !== "Other");
	const other = val(otherFieldId);
	if (set.has("Other") && other) items.push(other);
	return items.length ? items.join(", ") : fallback;
}

function rosBlock(section) {
	const extras = {
		resp: () =>
			`${val("coughType")}${val("sputumDesc") ? ` — sputum: ${val("sputumDesc")}` : ""}. ${val("respAus") ? `Auscultation: ${val("respAus")}.` : ""} ${val("respNotes")}`.trim(),
		cvs: () =>
			`${val("bpStatus")}. ${buildEcgText()} ${val("cvsNotes")}`.trim(),
		gi: () => {
			const parts = [];
			const abdoEntries = Object.entries(state.abdoFindings).filter(
				([, f]) => f.size > 0,
			);
			if (abdoEntries.length)
				parts.push(
					`Palpation: ${abdoEntries.map(([r, f]) => `${r} — ${[...f].join(", ")}`).join("; ")}.`,
				);
			if (val("giFluidIntake"))
				parts.push(`Fluid intake: ${val("giFluidIntake")}.`);
			if (val("giAppetite")) parts.push(`Appetite: ${val("giAppetite")}.`);
			if (val("bowelSounds"))
				parts.push(`Bowel sounds: ${val("bowelSounds")}.`);
			if (val("giNotes")) parts.push(val("giNotes"));
			if (isChecked("stomaPresent")) {
				const type = val("stomaType");
				const out = val("stomaOutput");
				const app = val("stomaAppearance");
				parts.push(
					`Stoma present${type ? ` (${type})` : ""}.${out ? ` Output: ${out}.` : ""}${app ? ` Appearance: ${app}.` : ""}`,
				);
			}
			return parts.join(" ");
		},
		urine: () => {
			const parts = [];
			if (state.urinaryVolumeFeatures.size)
				parts.push(
					`Volume change — features: ${[...state.urinaryVolumeFeatures].join(", ")}.`,
				);
			if (state.urinaryColourFeatures.size)
				parts.push(
					`Colour/appearance: ${[...state.urinaryColourFeatures].join(", ")}.`,
				);
			if (isChecked("catheterPresent")) {
				const out = val("catheterOutput");
				const app = val("urineAppearance");
				parts.push(
					`Urinary catheter in situ.${out ? ` Output: ${out}.` : ""}${app ? ` Appearance: ${app}.` : ""}`,
				);
			}
			if (val("urineNotes")) parts.push(val("urineNotes"));
			return parts.join(" ");
		},
		mh: () => {
			const parts = [];
			if (val("psychBehaviour"))
				parts.push(`Appearance/behaviour: ${val("psychBehaviour")}.`);
			if (val("psychSpeech")) parts.push(`Speech: ${val("psychSpeech")}.`);
			if (val("psychRisk")) parts.push(`Risk level: ${val("psychRisk")}.`);
			if (val("psychProtective"))
				parts.push(`Protective factors: ${val("psychProtective")}.`);
			if (val("psychNotes")) parts.push(val("psychNotes"));
			return parts.join(" ");
		},
	};
	return `${rosLine(section)} ${extras[section]?.() || val(`${section}Notes`) || ""}`.trim();
}

function buildHandoverText() {
	const format = val("handoverFormat") || "ASHICE";
	const age = val("ptAge");
	const sex = val("ptSex");
	const sexLabel = sex && sex !== "Not specified" ? sex.toLowerCase() : "";
	const pt = [age ? `${age}yo` : "", sexLabel].filter(Boolean).join(" ");
	const pc = getPc();
	const hpcCaller = val("hpcCaller");
	const hpcCat = val("hpcCategory");
	const hpcCatWord = hpcCat === "C4" ? "generated" : "dispatched";
	const hpcCallLine =
		hpcCaller && hpcCat
			? `${hpcCaller}, ${hpcCat} ${hpcCatWord}`
			: hpcCaller || (hpcCat ? `${hpcCat} ${hpcCatWord}` : "");
	const hpc = [val("hpcEvents"), hpcCallLine].filter(Boolean).join(". ") || "";
	const pmh = isChecked("noPmh")
		? "No significant PMH"
		: val("pmh") || "Not documented";
	const meds = isChecked("noMeds")
		? "No regular medications"
		: val("medications") || "Not documented";
	const allergies = isChecked("nkda")
		? "NKDA"
		: val("allergies") || "Not documented";
	const extraNotes = val("handoverNotes");

	const vitalParts = [
		val("gcsScore")
			? `GCS ${val("gcsScore")}`
			: val("avpu")
				? `AVPU ${val("avpu")}`
				: "",
		val("hr") ? `HR ${val("hr")}` : "",
		val("bp") ? `BP ${val("bp")}` : "",
		val("spo2") ? `SpO2 ${val("spo2")}%` : "",
		val("rr") ? `RR ${val("rr")}` : "",
		val("temp") ? `Temp ${val("temp")}°C` : "",
	].filter(Boolean);
	const vitalsLine = vitalParts.length
		? vitalParts.join(", ")
		: "Not documented";

	const treatmentParts = window.CrewMateOptions.ABCDE.sections.flatMap((s) => {
		const n = val(s.notes);
		return n ? [n] : [];
	});
	const treatment = treatmentParts.length
		? treatmentParts.join(". ")
		: "None documented";

	if (format === "ASHICE") {
		return [
			`A — Age: ${age || "Not documented"}`,
			`S — Sex: ${sex || "Not specified"}`,
			`H — History: ${pc}. ${hpc ? hpc + ". " : ""}PMH: ${pmh}. Medications: ${meds}. Allergies: ${allergies}.`,
			`I — Illness/Injury: ${pc}${val("onsetType") ? `. Onset: ${val("onsetType")}${onsetTime() ? `, ${onsetTime()}` : ""}${onsetClockSuffix()}` : ""}.`,
			`C — Condition: ${vitalsLine}.`,
			`E — ETA: ${val("handoverEta") || "Not given"}`,
			...(extraNotes ? ["", extraNotes] : []),
		].join("\n");
	}

	if (format === "SBAR") {
		return [
			`S — Situation: ${pt ? pt + " " : ""}presenting with ${pc.toLowerCase()}${hpc ? `. ${hpc}` : ""}.`,
			`B — Background: PMH: ${pmh}. Medications: ${meds}. Allergies: ${allergies}.`,
			`A — Assessment:\n${abcHandoverSummary()}`,
			`R — Recommendation: ${buildConveyanceText()}`,
			...(extraNotes ? ["", extraNotes] : []),
		].join("\n\n");
	}

	if (format === "ATMIST") {
		return [
			`A — Age: ${age || "Not documented"}`,
			`T — Time: ${val("incidentTime") || "Not documented"}`,
			`M — Mechanism: ${hpc || val("onsetType") || "Not documented"}`,
			`I — Injuries/Illness: ${pc}`,
			`S — Signs: ${vitalsLine}`,
			`T — Treatment: ${treatment}`,
			...(extraNotes ? ["", extraNotes] : []),
		].join("\n");
	}

	if (format === "Leave at Home") {
		return buildLahSbarText();
	}

	return "";
}

// Leave at home form builder

function buildLahSbarText() {
	const age = val("ptAge");
	const sex = val("ptSex");
	const pc = getPc();
	const decision = val("conveyanceDecision");

	const ptStr = [
		age ? `${age}yr` : null,
		sex && sex !== "Not specified" ? sex : null,
	]
		.filter(Boolean)
		.join(" ");
	const hpcCat = val("hpcCategory");
	const hpcCatWord = hpcCat === "C4" ? "generated" : "dispatched";
	const callStr = [
		val("hpcCaller"),
		hpcCat ? `${hpcCat} ${hpcCatWord}` : null,
		val("hpcEvents"),
	]
		.filter(Boolean)
		.join(", ");
	const situationParts = [
		ptStr ? `${ptStr}` : null,
		`PC: ${pc}`,
		callStr || null,
	].filter(Boolean);

	const pmh = isChecked("noPmh") ? "Nil significant" : val("pmh") || "—";
	const meds = isChecked("noMeds") ? "None" : val("medications") || "—";
	const allergies = isChecked("nkda") ? "NKDA" : val("allergies") || "—";
	const loi = [val("loiWhat"), val("loiTime")].filter(Boolean).join(" at ");
	const backgroundParts = [
		`PMH: ${pmh}`,
		`Meds: ${meds}`,
		`Allergies: ${allergies}`,
		loi ? `LOI: ${loi}` : null,
		val("prevDetails") ? `Prev: ${val("prevDetails")}` : null,
	].filter(Boolean);

	const assessParts = [];

	const obsText = window.CrewMateObsRecorder.buildObsText();
	if (obsText) assessParts.push(`Obs: ${obsText.split("\n").join(", ")}`);

	syncAuscultationOutput();
	const abcSummary = abcHandoverSummary();
	if (abcSummary && abcSummary !== "No ABCDE concerns identified.") {
		assessParts.push(`ABCDE: ${abcSummary.split("\n").join("; ")}`);
	} else {
		assessParts.push("ABCDE: No concerns");
	}

	const ecgText = buildEcgText();
	if (ecgText && !ecgText.includes("Not performed"))
		assessParts.push(`ECG: ${ecgText.split("\n").join("; ")}`);

	const aus = val("respAus");
	if (aus && aus !== "Not auscultated") assessParts.push(`Ausc: ${aus}`);

	if (!isChecked("noPain")) {
		const site = getSelectedParts(state.siteParts);
		const sev = val("severity")
			? `${val("severity")}/10${val("severityWorst") ? ` (worst ${val("severityWorst")}/10)` : ""}`
			: null;
		const painParts = [
			site || null,
			val("onsetType")
				? `${val("onsetType")}${onsetTime() ? ` ${onsetTime()}` : ""}`
				: null,
			state.character.size
				? listFactors(state.character, "characterOther", null)
				: null,
			sev,
			val("radiation") || null,
		]
			.filter(Boolean)
			.join(", ");
		if (painParts) assessParts.push(`Pain: ${painParts}`);
	}

	const pcSel = val("pcSelect");
	if (pcSel === "Fall") {
		const ft = window.CrewMateFalls.buildFallsText();
		if (ft) assessParts.push(`Falls: ${ft.split("\n")[0]}`);
	} else if (pcSel === "Head injury") {
		const ht = buildHeadInjuryText();
		if (ht) assessParts.push(`Head injury: ${ht.split("\n")[0]}`);
	} else if (pcSel === "Seizure") {
		const st = window.CrewMateSeizure.buildSeizureText();
		if (st) assessParts.push(`Seizure: ${st.split("\n")[0]}`);
	} else if (
		window.CrewMateOptions.OPTIONS.mentalHealth.presentingComplaint.includes(
			pcSel,
		)
	) {
		const mht = buildMhAssessmentText();
		if (mht) assessParts.push(`MH: ${mht.split("\n")[0]}`);
	}

	const rosAbbr = {
		resp: "Resp",
		cvs: "CVS",
		neuro: "Neuro",
		gi: "GI",
		urine: "Urine",
		integ: "Skin",
		msk: "MSK",
		mh: "Mental health",
	};
	const isNormalFinding = (f) => {
		const l = f.toLowerCase();
		if (
			l.match(
				/^(no |not |nil |none|normal|regular |well |warm |peripheral|crt |gcs 15|pearl|alert|fast neg|speech clear|full range|able to|gait |mood |oriented|insight|bowel habits unchanged|abdomen soft|non-tender|normotensive|ecg: not|auscultation: not)/,
			)
		)
			return true;
		if (
			l.match(
				/\bnormal\b|\bunchanged\b|\bappropriate|\bcoherent\b|\bnegative\b|\bintact\b|\bpresent\b|\bpalpable\b|\bnormotensive\b|\bengaged\b/,
			)
		)
			return true;
		return false;
	};
	["resp", "cvs", "neuro", "gi", "urine", "integ", "msk", "mh"].forEach((s) => {
		const block = rosBlock(s);
		if (!block || !block.trim()) return;
		const findings = block
			.split(/\.\s+/)
			.map((f) => f.replace(/\.$/, "").trim())
			.filter(Boolean);
		const abnormals = findings.filter((f) => !isNormalFinding(f));
		if (abnormals.length)
			assessParts.push(`${rosAbbr[s]}: ${abnormals.join(". ")}`);
	});

	if (val("oeText")) assessParts.push(`OE: ${val("oeText")}`);

	const hasTx =
		state.airwayInterventions.size ||
		state.ivEntries.length ||
		state.drugEntries.length ||
		state.woundInterventions.size ||
		state.manualHandling.length ||
		val("otherInterventionsFree") ||
		val("treatmentNotes");
	if (hasTx)
		assessParts.push(`Tx: ${buildTreatmentText().split("\n").join("; ")}`);

	const capacityStatus = val("capacityStatus");
	if (capacityStatus && capacityStatus !== "Not applicable") {
		assessParts.push(`Capacity: ${capacityStatus}`);
	}

	const referrals = listSet(state.referrals, "none");
	const followUp = val("followUp");
	const checks = [
		isChecked("riskExplained") && "risks explained",
		isChecked("alternativesDiscussed") && "alternatives discussed",
		isChecked("understandsRisk") && "understands risks",
		isChecked("canRecontact") && "999/111 recontact advised",
	]
		.filter(Boolean)
		.join(", ");
	const legalChips = $$(".legal-chip.selected").map(
		(c) =>
			({
				ehcp: "EHCP",
				lpa: "LPA",
				"advance-decision": "Adv. decision",
				"family-carer": "Family/carer",
			})[c.dataset.legal] || c.dataset.legal,
	);
	const legalDetail = val("legalConsiderationsDetail");
	const worsening = buildWorseningText();
	const sg = buildSafeguardingText();
	const recParts = [
		`Decision: ${decision}`,
		referrals !== "none" ? `Referred: ${referrals}` : null,
		followUp ? `Follow-up: ${followUp}` : null,
		checks ? `Safety netting: ${checks}` : null,
		legalChips.length
			? `Legal: ${legalChips.join(", ")}${legalDetail ? " — " + legalDetail : ""}`
			: legalDetail
				? `Legal: ${legalDetail}`
				: null,
		worsening && !worsening.toLowerCase().includes("not applicable")
			? `Return if: ${worsening.split("\n").join("; ")}`
			: null,
		sg ? `Safeguarding: ${sg.split("\n").join("; ")}` : null,
		val("conveyanceNotes") || null,
	].filter(Boolean);

	return [
		`S — SITUATION\n${situationParts.join("\n")}`,
		`B — BACKGROUND\n${backgroundParts.join("\n")}`,
		`A — ASSESSMENT\n${assessParts.join("\n") || "No specific findings documented."}`,
		`R — RECOMMENDATION\n${recParts.join("\n")}`,
	].join("\n\n");
}

function getNiceCTCriteria() {
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

function buildHeadInjuryText() {
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

function buildOutputSections() {
	const pc = getPc();
	const site = getSelectedParts(state.siteParts) || "Not localised";
	const radiation =
		getSelectedParts(state.radiationParts) || "No radiation selected";
	const worseningText = buildWorseningText();
	return [
		{ id: "pc", title: "PRESENTING COMPLAINT", body: pc },
		{
			id: "hpc",
			title: "HISTORY OF PRESENTING COMPLAINT",
			body: (() => {
				const events = val("hpcEvents") || "Not documented";
				const caller = val("hpcCaller");
				const cat = val("hpcCategory");
				const catWord = cat === "C4" ? "generated" : "dispatched";
				const callLine =
					caller && cat
						? `${caller}, ${cat} ${catWord}.`
						: caller
							? `${caller}.`
							: cat
								? `${cat} ${catWord}.`
								: "";
				return [
					events,
					callLine,
					isChecked("noTravel") ? "No recent travel." : "",
				]
					.filter(Boolean)
					.join("\n");
			})(),
		},
		{
			id: "background",
			title: "BACKGROUND",
			body: `PMH: ${isChecked("noPmh") ? "No significant past medical history" : val("pmh") || "Not documented"}\nMedications: ${isChecked("noMeds") ? "No regular medications" : val("medications") || "Not documented"}\nAllergies: ${isChecked("nkda") ? "NKDA" : val("allergies") || "Not documented"}\nLast oral intake: ${[val("loiWhat"), val("loiTime")].filter(Boolean).join(" at ") || "Not documented"}\nOther Details: ${val("prevDetails") || "Not documented"}`,
		},
		...(() => {
			const card = $("#gynaeCard");
			if (!card || card.classList.contains("hidden")) return [];
			return [
				{
					id: "gynae",
					title: "OBSTETRIC / GYNAECOLOGICAL",
					body: buildGynaeOutput(),
				},
			];
		})(),
		{
			id: "primary",
			title: "PRIMARY SURVEY",
			body:
				`OA: ${val("oaFound")}${val("oaLocation") ? ` at ${val("oaLocation")}` : ""}; ${val("oaMobility").toLowerCase()}. ${val("oaFound") !== "Greeted by patient" && val("oaPatientFoundHow") ? `On reaching patient: ${val("oaPatientFoundHow")}. ` : ""}${isChecked("oaConsent") ? "Consented to assessment. " : ""}${isChecked("oaNoABC") ? "No immediate ABC concerns. " : ""}${isChecked("oaNormalPresentation") ? "Normal presentation on arrival. " : ""}${val("oaNotes")}`.trimEnd() +
				`\n${window.CrewMateOptions.ABCDE.sections.map(abcLine).join("\n")}`,
		},
		{
			id: "pain",
			title: isChecked("noPain")
				? "SOCRATES / SYMPTOM ASSESSMENT"
				: "PAIN ASSESSMENT / SOCRATES",
			body: isChecked("noPain")
				? [
						`Onset: ${val("onsetType") || "Not documented"}${onsetTime() ? `, ${onsetTime()}${onsetClockSuffix()}` : ""}${val("onsetDuration") ? `, duration ${val("onsetDuration")}` : ""}`,
						`Associated symptoms: ${listFactors(state.associated, "associatedOther", "None reported")}`,
						`Timing: ${val("timingSelect") || "Not documented"}`,
						`Exacerbating factors: ${listFactors(state.exacerbating, "exacerbatingOther", "None identified")}`,
						`Relieving factors: ${listFactors(state.relieving, "relievingOther", "None identified")}`,
						`Severity: ${[val("severity") ? `${val("severity")} now` : null, val("severityWorst") ? `${val("severityWorst")} at worst` : null].filter(Boolean).join(", ") || "Not documented"}`,
					].join("\n")
				: [
						`Site: ${site}`,
						`Onset: ${val("onsetType") || "Not documented"}${onsetTime() ? `, ${onsetTime()}${onsetClockSuffix()}` : ""}${val("onsetDuration") ? `, duration ${val("onsetDuration")}` : ""}`,
						`Character: ${listFactors(state.character, "characterOther", "Not characterised")}`,
						`Radiation: ${radiation}`,
						`Associated symptoms: ${listFactors(state.associated, "associatedOther", "None reported")}`,
						`Timing: ${val("timingSelect") || "Not documented"}`,
						`Exacerbating factors: ${listFactors(state.exacerbating, "exacerbatingOther", "None identified")}`,
						`Relieving factors: ${listFactors(state.relieving, "relievingOther", "None identified")}`,
						`Severity: ${[val("severity") ? `${val("severity")} now` : null, val("severityWorst") ? `${val("severityWorst")} at worst` : null].filter(Boolean).join(", ") || "Not documented"}`,
					].join("\n"),
		},
		...(val("pcSelect") === "Fall"
			? [
					{
						id: "falls",
						title: "FALLS ASSESSMENT — SPLATT",
						body: window.CrewMateFalls.buildFallsText(),
					},
				]
			: []),
		...(val("pcSelect") === "Head injury"
			? [
					{
						id: "headinjury",
						title: "HEAD INJURY ASSESSMENT — NICE CG176",
						body: buildHeadInjuryText(),
					},
				]
			: []),
		...(val("pcSelect") === "Seizure"
			? [
					{
						id: "seizure",
						title: "SEIZURE ASSESSMENT",
						body: window.CrewMateSeizure.buildSeizureText(),
					},
				]
			: []),
		...(window.CrewMateOptions.OPTIONS.mentalHealth.presentingComplaint.includes(
			val("pcSelect"),
		)
			? [
					...(val("pcSelect") === "Overdose / poisoning"
						? (() => {
								const t = buildOdAssessmentText();
								return t
									? [
											{
												id: "odassessment",
												title: "OVERDOSE / POISONING ASSESSMENT",
												body: t,
											},
										]
									: [];
							})()
						: []),
					{
						id: "mhassessment",
						title: "MENTAL HEALTH ASSESSMENT",
						body: buildMhAssessmentText(),
					},
				]
			: []),
		...(!$("#strokeAssessmentCard")?.classList.contains("hidden")
			? [
					{
						id: "stroke",
						title: "FAST-PASTA STROKE ASSESSMENT",
						body: window.CrewMateStroke.buildStrokeText(),
					},
				]
			: []),
		...(() => {
			const obs = window.CrewMateObsRecorder.buildObsText();
			return obs ? [{ id: "obs", title: "OBSERVATIONS", body: obs }] : [];
		})(),
		...(state.injuryEntries.length
			? [
					{
						id: "injuries",
						title: "INJURY ASSESSMENT",
						body: buildInjuryText(),
					},
				]
			: []),
		...Object.entries(window.CrewMateOptions.ROS.output_title).map(
			([section, title]) => ({
				id: `ros-${section}`,
				title,
				body: rosBlock(section),
			}),
		),
		...(val("oeText")
			? [
					{
						id: "oe",
						title: "ASSESSMENT — ON EXAMINATION",
						body: val("oeText"),
					},
				]
			: []),
		...(() => {
			const hasTx =
				state.airwayInterventions.size ||
				state.ivEntries.length ||
				state.drugEntries.length ||
				state.woundInterventions.size ||
				state.manualHandling.length ||
				val("otherInterventionsFree") ||
				val("treatmentNotes");
			return hasTx
				? [
						{
							id: "treatment",
							title: "TREATMENT AND INTERVENTIONS",
							body: buildTreatmentText(),
						},
					]
				: [];
		})(),
		...(() => {
			const hasChanges = state.clinicalChanges.length || val("additionalInfo");
			return hasChanges
				? [
						{
							id: "changes",
							title: "CLINICAL CHANGES & ADDITIONAL INFORMATION",
							body: buildChangesText(),
						},
					]
				: [];
		})(),
		{
			id: "capacity",
			title: "ASSESSMENT — MENTAL CAPACITY / CONSENT",
			body: buildCapacityText(),
		},
		...(val("conveyanceDecision") !== "Conveyed"
			? [
					{
						id: "worsening",
						title: "PLAN — WORSENING ADVICE",
						body: worseningText,
					},
				]
			: []),
		{
			id: "conveyance",
			title: "PLAN — CONVEYANCE DECISION",
			body: buildConveyanceText(),
		},
		...(() => {
			const sg = buildSafeguardingText();
			return sg
				? [{ id: "safeguarding", title: "SCENE & SAFEGUARDING", body: sg }]
				: [];
		})(),
		{
			id: "handover",
			title:
				val("handoverFormat") === "Leave at Home"
					? "LEAVE AT HOME — SBAR"
					: `HANDOVER — ${val("handoverFormat") || "ASHICE"}`,
			body: buildHandoverText(),
		},
		...(() => {
			const dept = val("conveyDepartment");
			const isEd =
				dept.toLowerCase().includes("ed") ||
				dept.toLowerCase().includes("emergency");
			return val("conveyanceDecision") === "Conveyed" && isEd
				? [
						{
							id: "ed-handover",
							title: "ED HANDOVER",
							body: buildEdHandoverText(),
						},
					]
				: [];
		})(),
	];
}

// Copy function
const outputSectionTexts = new Map();

function renderOutputSections(sections) {
	outputSectionTexts.clear();
	const root = $("#outputSections");
	if (!root) return;
	root.innerHTML = "";
	sections.forEach((section) => {
		outputSectionTexts.set(section.id, section.body);
		const card = document.createElement("article");
		card.className = "output-card";
		card.innerHTML = `<div class="output-card-head"><h3>${section.title}</h3><button type="button" class="secondary-action" data-copy-section="${section.id}">Copy</button></div>`;
		const pre = document.createElement("pre");
		pre.className = "output-snippet";
		pre.textContent = section.body;
		card.append(pre);
		root.append(card);
	});
}

// Outut page

function generateOutput() {
	syncAuscultationOutput();
	const sections = paedsMode
		? window.CrewMatePaeds.buildPaedsOutputFromAdultForm()
		: buildOutputSections();
	renderOutputSections(sections);
	const fullText = sections
		.map((section) => section.body)
		.join("\n\n" + "─".repeat(46) + "\n\n");
	const legacy = $("#outputText");
	if (legacy) legacy.textContent = fullText;
	return fullText;
}

function listSet(set, fallback) {
	return set.size ? [...set].join(", ") : fallback;
}

function applyWorseningDefault() {
	if (!state.worseningAuto) return;
	const decision = val("conveyanceDecision");
	const newMode = decision === "Conveyed" ? "Not applicable" : "Standard";
	setRadioChip("worseningMode", newMode);
	updateWorseningScript();
}

function buildPatientScript(declined) {
	const pc = getPc();
	const pcData = window.CrewMateWorsening.WORSENING_PC[pc];
	const genericLines = window.CrewMateWorsening.WORSENING_GENERIC.map(
		(i) => `- ${i}`,
	).join("\n");
	const specificLines = pcData?.items.map((i) => `- ${i}`).join("\n") || "";
	const redFlags = pcData?.redFlags
		? `\nImportant — call 999 immediately for:\n${pcData.redFlags}`
		: "";
	const extra = pcData?.extra ? `\n${pcData.extra}` : "";
	const declinedLine = declined
		? "\nYou have declined conveyance to hospital today. You have the right to refuse treatment and transport, but please do not hesitate to call 999 again if you change your mind or feel worse at any time."
		: "";
	return `Call 999 immediately if you notice:
${genericLines}

${specificLines ? `Specific to your condition today (${pc}), also call 999 for:\n${specificLines}\n` : ""}${redFlags}${extra}${declinedLine}

For anything less urgent, please contact your GP or call 111. If you are ever unsure whether something is an emergency, always call 999 — it is better to call and check.`;
}

function updateWorseningScript() {
	const mode = val("worseningMode");
	const wrap = $("#worseningScriptWrap");
	const display = $("#worseningScriptDisplay");
	if (!wrap || !display) return;
	const hidden = mode === "Not applicable";
	wrap.classList.toggle("hidden", hidden);
	if (!hidden && mode !== "Custom") {
		const declined = val("conveyanceDecision") === "Declined conveyance";
		display.textContent = buildPatientScript(declined);
	}
}

function buildWorseningText() {
	const mode = val("worseningMode");
	const decision = val("conveyanceDecision");
	const pc = getPc();
	const pcData = window.CrewMateWorsening.WORSENING_PC[pc];
	const custom = val("customWorsening");

	if (mode === "Not applicable" || decision === "Conveyed")
		return "Patient conveyed to hospital; community worsening advice not applicable.";

	const declined = decision === "Declined conveyance";
	const allItems = [
		...window.CrewMateWorsening.WORSENING_GENERIC,
		...(pcData?.items || []),
	];
	const adviceLine = `Worsening advice given${declined ? " (declined conveyance)" : ""}. Patient${declined ? " and any bystanders" : ""} advised to call 999 for: ${allItems.join("; ")}.`;
	const redFlagLine = pcData?.redFlags ? ` ${pcData.redFlags}` : "";
	const extraLine = pcData?.extra ? ` ${pcData.extra}` : "";
	const customLine = custom ? ` Additional advice: ${custom}` : "";
	const confirmedLine = " Advice confirmed understood.";

	if (mode === "Custom") return custom || "Custom worsening advice given.";

	return `${adviceLine}${redFlagLine}${extraLine}${customLine}${confirmedLine}`;
}

function buildCapacityText() {
	const status = val("capacityStatus");
	if (status === "Not applicable") return "Not applicable.";
	if (status === "Lacks capacity") {
		const unable = [...state.lacksCapAbilities].join(", ");
		const reason = val("lacksCausation");
		const bi = val("bestInterests");
		return [
			"Patient assessed as lacking capacity for the relevant decision at this time.",
			unable ? `Unable to: ${unable}.` : "",
			reason ? `Reason for incapacity: ${reason}.` : "",
			bi ? `Best interests decision: ${bi}` : "",
		]
			.filter(Boolean)
			.join(" ");
	}
	const abilities = [...state.mcaAbilities];
	const ableText = abilities.length
		? `MCA elements documented: able to ${abilities.join(", ")}.`
		: "";
	return `Patient assessed as having capacity for the relevant decision.${ableText ? " " + ableText : ""}`;
}

function handleConveyanceDisplay() {
	const conveyed = val("conveyanceDecision") === "Conveyed";
	$("#conveyedFields")?.classList.toggle("hidden", !conveyed);
	$("#nonConveyedFields")?.classList.toggle("hidden", conveyed);
	$("#worseningSection")?.classList.toggle("hidden", conveyed);
	updateWorseningScript();

	const currentFmt = val("handoverFormat");
	const lahFormats = ["Leave at Home"];
	const conveyFormats = ["SBAR", "ASHICE", "ATMIST"];
	if (!conveyed && !lahFormats.includes(currentFmt)) {
		$$("[data-radio-group='handoverFormat'] [data-value]").forEach((b) =>
			b.classList.toggle("selected", b.dataset.value === "Leave at Home"),
		);
		const hiddenInput = $("#handoverFormat");
		if (hiddenInput) {
			hiddenInput.value = "Leave at Home";
			hiddenInput.dispatchEvent(new Event("change"));
		}
	} else if (conveyed && lahFormats.includes(currentFmt)) {
		$$("[data-radio-group='handoverFormat'] [data-value]").forEach((b) =>
			b.classList.toggle("selected", b.dataset.value === "SBAR"),
		);
		const hiddenInput = $("#handoverFormat");
		if (hiddenInput) {
			hiddenInput.value = "SBAR";
			hiddenInput.dispatchEvent(new Event("change"));
		}
	}

	if (!conveyed) return;
	$("#hospitalOtherWrap")?.classList.toggle(
		"hidden",
		val("conveyHospital") !== "Other hospital",
	);
	const dept = val("conveyDepartment");
	$("#wardDetailsWrap")?.classList.toggle("hidden", dept !== "Ward");
	$("#departmentOtherWrap")?.classList.toggle(
		"hidden",
		dept !== "Other department",
	);
	const changeChip = $('.convey-chip[data-clinical-change="true"]');
	$("#conveyChangeWrap")?.classList.toggle(
		"hidden",
		changeChip?.dataset.conveyState !== "abnormal",
	);
	const escalatedChip = $('.convey-chip[data-escalated="true"]');
	$("#conveyEscalatedWrap")?.classList.toggle(
		"hidden",
		escalatedChip?.dataset.conveyState !== "abnormal",
	);
}

//Conveyance
function buildConveyDestination(prefix = "convey") {
	const hospital =
		val(`${prefix}Hospital`) === "Other hospital"
			? val(`${prefix}HospitalOther`)
			: val(`${prefix}Hospital`);
	let department = val(`${prefix}Department`);
	if (department === "Ward") {
		const ward = val(`${prefix}Ward`);
		department = ward ? `Ward — ${ward}` : "Ward";
	} else if (department === "Other department") {
		department = val(`${prefix}DepartmentOther`) || "Other department";
	}
	return [hospital, department].filter(Boolean).join("; ");
}

function buildConveyanceText() {
	const decision = val("conveyanceDecision");
	const notes = val("conveyanceNotes");
	if (decision === "Conveyed") {
		const destination = buildConveyDestination("convey");
		const transferText = getConveyTransferText();
		const changeDetail = val("conveyChangeDetail");
		const escalatedDetail = val("conveyEscalatedDetail");
		const extraDetail = [
			changeDetail ? `Clinical change detail: ${changeDetail}` : null,
			escalatedDetail ? `Escalation of care detail: ${escalatedDetail}` : null,
		]
			.filter(Boolean)
			.join(" ");
		const mobilisation = (() => {
			const m = val("mobilisationToVehicle");
			if (!m) return null;
			const detail = m === "Other" ? val("mobilisationOther") || "Other" : m;
			return `Mobilisation to vehicle: ${detail}.`;
		})();
		const lines = [
			"Conveyance decision: Patient conveyed to hospital for further assessment and/or treatment.",
			mobilisation,
			destination
				? `Destination: ${destination}.`
				: "Destination: Not specified.",
			transferText
				? `Transfer and handover: ${transferText}.${extraDetail ? ` ${extraDetail}` : ""}`
				: null,
			val("conveyTransferNotes")
				? `Transfer / handover notes: ${val("conveyTransferNotes")}`
				: null,
			notes ? `Additional notes: ${notes}` : null,
		].filter(Boolean);
		return lines.join("\n");
	}
	const checks = [
		isChecked("riskExplained") && "risks explained",
		isChecked("alternativesDiscussed") && "alternatives discussed",
		isChecked("understandsRisk") && "patient understands risks",
		isChecked("canRecontact") && "advised they can recontact 999/111",
	]
		.filter(Boolean)
		.join("; ");

	// Legal / capacity considerations (EHCP, LPA, advance decision)
	const legalChips = $$(".legal-chip.selected").map((c) => {
		const map = {
			ehcp: "EHCP consulted",
			lpa: "LPA consulted",
			"advance-decision": "Advance decision reviewed",
			"family-carer": "Family/carer agreement obtained",
		};
		return map[c.dataset.legal] || c.dataset.legal;
	});
	const legalDetail = val("legalConsiderationsDetail");
	const legalLine = legalChips.length
		? `Legal / capacity: ${legalChips.join(", ")}.${legalDetail ? " " + legalDetail : ""}`
		: legalDetail
			? `Legal / capacity: ${legalDetail}`
			: null;

	return [
		`${decision}. Referred/signposted to: ${listSet(state.referrals, "not documented")}.`,
		val("followUp") ? val("followUp") + "." : null,
		checks ? `Safety netting: ${checks}.` : null,
		legalLine,
		notes || null,
	]
		.filter(Boolean)
		.join(" ");
}

// Pain assessment

function clearBodyMap() {
	state.siteParts.clear();
	state.radiationParts.clear();
	$$(".body-part").forEach((part) =>
		part.classList.remove("site", "radiation"),
	);
	updateMapTags();
}

function clearPainAssessment() {
	state.siteParts.clear();
	state.radiationParts.clear();
	state.character.clear();
	state.associated.clear();
	state.exacerbating.clear();
	state.relieving.clear();
	$$("#painDetails .multi-group .square-btn").forEach((button) =>
		button.classList.remove("selected"),
	);
	$$(".body-part").forEach((part) =>
		part.classList.remove("site", "radiation"),
	);
	[
		"onsetType",
		"onsetDuration",
		"timingSelect",
		"severity",
		"severityWorst",
		"characterOther",
		"associatedOther",
		"exacerbatingOther",
		"relievingOther",
	].forEach((id) => {
		const field = $(`#${id}`);
		if (field) field.value = "";
	});
	$$(
		"#painScoreGrid .pain-score-btn, #painScoreWorstGrid .pain-score-btn",
	).forEach((b) => b.classList.remove("selected"));
	setOtherFactorVisible("exacerbating", false);
	setOtherFactorVisible("relieving", false);
	updateMapTags();
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

function aplsWeight(ageYears, ageMonths) {
	const totalMonths = (ageYears || 0) * 12 + (ageMonths || 0);
	const yrs = ageYears || 0;
	if (totalMonths < 1) return 3.5; // newborn estimate
	if (totalMonths < 12) return Math.round((totalMonths + 9) / 2);
	if (yrs < 6) return 2 * (yrs + 4);
	if (yrs <= 12) return 3 * yrs;
	return null; // adolescent
}

function detectAgeGroup(ageYears, ageMonths) {
	const totalMonths = (ageYears || 0) * 12 + (ageMonths || 0);
	if (totalMonths < 1) return "neonate";
	if (totalMonths < 12) return "infant";
	if (ageYears < 2) return "toddler";
	if (ageYears < 5) return "preschool";
	if (ageYears < 12) return "school";
	return "adolescent";
}

//  WETFLAG calculator - Currently hidden - need to check alllowed
function calcWetflag(weight) {
	if (!weight || weight <= 0) return null;
	const w = parseFloat(weight);
	const ageApprox = w < 10 ? Math.round(w / 2) : Math.round(w / 3);
	const tubeSizeUncuffed = (ageApprox / 4 + 4).toFixed(1);
	const tubeSizeCuffed = (ageApprox / 4 + 3.5).toFixed(1);
	return {
		weight: `${w} kg`,
		energy: `${(4 * w).toFixed(0)} J (4 J/kg)`,
		tube: `${tubeSizeUncuffed} mm uncuffed / ${tubeSizeCuffed} mm cuffed`,
		fluid: `${(10 * w).toFixed(0)}–${(20 * w).toFixed(0)} mL (10–20 mL/kg crystalloid)`,
		lorazepam: `${(0.1 * w).toFixed(2)} mg IV/IO (0.1 mg/kg, max 4 mg)`,
		adrenaline: `${(0.1 * w).toFixed(1)} mL of 1:10,000 (10 mcg/kg = 0.1 mL/kg)`,
		glucose: `${(2 * w).toFixed(0)} mL of 10% dextrose (2 mL/kg)`,
	};
}

function updateFlaccTotal() {
	const ids = [
		"flaccFace",
		"flaccLegs",
		"flaccActivity",
		"flaccCry",
		"flaccConsolability",
	];
	const total = ids.reduce((sum, id) => sum + (parseInt(val(id)) || 0), 0);
	const el = $("#flaccTotal");
	if (!el) return;
	let label = "No pain / relaxed";
	let cls = "pain-low";
	if (total >= 1 && total <= 3) {
		label = "Mild pain";
		cls = "pain-low";
	}
	if (total >= 4 && total <= 6) {
		label = "Moderate pain";
		cls = "pain-mod";
	}
	if (total >= 7) {
		label = "Severe pain";
		cls = "pain-high";
	}
	el.className = `flacc-total ${cls}`;
	el.textContent = `FLACC total: ${total} / 10 — ${label}`;
}

function setRadioChip(fieldId, value) {
	const group = $(`[data-radio-group="${fieldId}"]`);
	const inp = $(`#${fieldId}`);
	if (!group || !inp) return;
	group.querySelectorAll("[data-value]").forEach((chip) => {
		chip.classList.toggle("selected", chip.dataset.value === value);
	});
	inp.value = value;
}

function bindRadioChipGroups() {
	$$("[data-radio-group]").forEach((group) => {
		group.addEventListener("click", (e) => {
			const chip = e.target.closest("[data-value]");
			if (!chip || !group.contains(chip)) return;
			const fieldId = group.dataset.radioGroup;
			const wasSelected = chip.classList.contains("selected");
			group
				.querySelectorAll("[data-value]")
				.forEach((c) => c.classList.remove("selected"));
			if (!wasSelected) chip.classList.add("selected");
			const inp = $(`#${fieldId}`);
			if (inp) {
				inp.value = wasSelected ? "" : chip.dataset.value;
				inp.dispatchEvent(new Event("change"));
			}
		});
	});
}

// Output

function buildTmtText() {
	const lines = ["3 Minute Toolkit (Spotting the Sick Child)"];

	const patImpression = val("patImpression");
	lines.push(`\nLOOK (PAT across the room)`);
	if (patImpression) lines.push(`Initial impression: ${patImpression}`);
	else lines.push(`Initial impression: Not recorded`);

	lines.push(`\nLISTEN & FEEL (hands-on primary survey)`);
	lines.push(`See primary survey (ABCDE + ENT + T + DEFG) below`);

	const all3 = $$(`#tmtPhase3Grid .tmt-chip`);
	const done3 = all3
		.filter((c) => c.classList.contains("selected"))
		.map((c) => c.dataset.tmtLabel);
	const skip3 = all3
		.filter((c) => !c.classList.contains("selected"))
		.map((c) => c.dataset.tmtLabel);
	const decision = val("tmtDecision");
	const notes = val("tmtNotes");
	lines.push(`\nDECIDE`);
	if (done3.length) lines.push(`Completed: ${done3.join(", ")}`);
	if (skip3.length) lines.push(`Not completed: ${skip3.join(", ")}`);
	if (decision) lines.push(`Management decision: ${decision}`);
	if (notes) lines.push(`Clinical reasoning: ${notes}`);

	return lines.join("\n");
}

// Paeds conveyance
function handlePConveyanceDisplay() {
	const decision = val("pConveyDecision");
	const conveyed = decision === "Conveyed";
	const notConveyed = decision !== "" && !conveyed;
	$("#pConveyedFields")?.classList.toggle("hidden", !conveyed);
	$("#pNonConveyedFields")?.classList.toggle("hidden", !notConveyed);
	const pWorseningMode = $("#pWorseningMode");
	if (pWorseningMode) pWorseningMode.value = conveyed ? "na" : "standard";
	window.CrewMatePaeds?.updatePaedsWorseningScript();
	if (!conveyed) return;
	$("#pHospitalOtherWrap")?.classList.toggle(
		"hidden",
		val("pConveyHospital") !== "Other hospital",
	);
	const dept = val("pConveyDepartment");
	$("#pWardDetailsWrap")?.classList.toggle("hidden", dept !== "Ward");
	$("#pDepartmentOtherWrap")?.classList.toggle(
		"hidden",
		dept !== "Other department",
	);
}

async function copyText(text) {
	try {
		await navigator.clipboard.writeText(text);
	} catch {
		const textArea = document.createElement("textarea");
		textArea.value = text;
		document.body.append(textArea);
		textArea.select();
		document.execCommand("copy");
		textArea.remove();
	}
	$("#toast").classList.add("show");
	setTimeout(() => $("#toast").classList.remove("show"), 1800);
}

async function copyOutput() {
	await copyText(generateOutput());
}

async function copySectionById(sectionId) {
	generateOutput();
	const text = outputSectionTexts.get(sectionId);
	if (text) await copyText(text);
}

function enhanceSectionCards() {
	const descriptions = {
		"Presenting Complaint": [
			"pc",
			"Record the patient’s main reason for assessment.",
		],
		"History of Presenting Complaint": [
			"hpc",
			"Events, symptoms and relevant history.",
		],
		"Pain Assessment": [
			"pain",
			"SOCRATES assessment and pain characteristics.",
		],
		Background: ["hx", "Allergies, medications, PMH and relevant background."],
		"On Arrival": ["default", "First contact, location, consent and mobility."],
		"Review of Systems": ["default", "System-by-system clinical review."],
		"Secondary Survey / On Examination": [
			"default",
			"Generate or document examination findings.",
		],
		"Mental Capacity and Consent": [
			"default",
			"Capacity, consent and best interests notes.",
		],
		"Worsening Advice": ["default", "Safety-netting and advice given."],
		Conveyance: ["default", "Destination, transfer and handover details."],
		"Generated PRF": ["default", "Copy sections into your ePCR."],
	};

	document.querySelectorAll(".section-card > summary").forEach((summary) => {
		if (summary.dataset.enhanced === "true") return;

		const title = summary.querySelector("span")?.textContent?.trim();
		const [icon, desc] = descriptions[title] || [
			"default",
			"Complete this section as required.",
		];

		summary.parentElement.dataset.sectionIcon = icon;

		const titleSpan = summary.querySelector("span");
		if (titleSpan && !titleSpan.querySelector(".section-desc")) {
			titleSpan.innerHTML = `${title}<small class="section-desc">${desc}</small>`;
		}

		summary.dataset.enhanced = "true";
	});
}

// ─── Auto-save / restore ─────────────────────────────────────────────────────

const SAVE_KEY = "crewmate-eprf";
let _saveTimer = null;

function scheduleSave() {
	clearTimeout(_saveTimer);
	_saveTimer = setTimeout(saveFormState, 2000);
}

function serializeState() {
	const s = (set) => [...(set instanceof Set ? set : new Set())];
	return {
		ros: state.ros,
		drugEntries: state.drugEntries,
		ivEntries: state.ivEntries,
		manualHandling: state.manualHandling,
		clinicalChanges: state.clinicalChanges,
		injuryEntries: state.injuryEntries,
		mhActs: state.mhActs,
		auscFindings: state.auscFindings,
		auscActive: state.auscActive,
		abdoFindings: state.abdoFindings,
		worseningAuto: state.worseningAuto,
		siteParts: s(state.siteParts),
		radiationParts: s(state.radiationParts),
		character: s(state.character),
		associated: s(state.associated),
		exacerbating: s(state.exacerbating),
		relieving: s(state.relieving),
		referrals: s(state.referrals),
		pReferrals: s(state.pReferrals),
		fallsSymptoms: s(state.fallsSymptoms),
		fallsActivity: s(state.fallsActivity),
		fallsInjuries: s(state.fallsInjuries),
		fallsLocation: s(state.fallsLocation),
		headMechanism: s(state.headMechanism),
		headSymptoms: s(state.headSymptoms),
		headSigns: s(state.headSigns),
		seizureType: s(state.seizureType),
		seizureFeatures: s(state.seizureFeatures),
		seizureFindings: s(state.seizureFindings),
		seizurePrecipitants: s(state.seizurePrecipitants),
		seizurePostictalFeatures: s(state.seizurePostictalFeatures),
		urinaryVolumeFeatures: s(state.urinaryVolumeFeatures),
		urinaryColourFeatures: s(state.urinaryColourFeatures),
		aedCompliance: s(state.aedCompliance),
		mhIntent: s(state.mhIntent),
		mhPlanning: s(state.mhPlanning),
		odPrescribed: s(state.odPrescribed),
		odAssessSource: s(state.odAssessSource),
		shMethod: s(state.shMethod),
		shDepth: s(state.shDepth),
		mseAppearance: s(state.mseAppearance),
		mseBehaviour: s(state.mseBehaviour),
		mseSpeech: s(state.mseSpeech),
		mseThoughtContent: s(state.mseThoughtContent),
		mseAffect: s(state.mseAffect),
		mseThoughtForm: s(state.mseThoughtForm),
		msePerception: s(state.msePerception),
		mseInsight: s(state.mseInsight),
		safeguardingConcerns: s(state.safeguardingConcerns),
		mcaAbilities: s(state.mcaAbilities),
		lacksCapAbilities: s(state.lacksCapAbilities),
		airwayInterventions: s(state.airwayInterventions),
		woundInterventions: s(state.woundInterventions),
		ecgFindings: s(state.ecgFindings),
		ecgLeads: s(state.ecgLeads),
	};
}

function saveFormState() {
	try {
		// All field values keyed by id
		const fields = {};
		document
			.querySelectorAll("input[id], select[id], textarea[id]")
			.forEach((el) => {
				if (
					el.type === "hidden" ||
					el.type === "button" ||
					el.type === "submit"
				)
					return;
				fields[el.id] = el.type === "checkbox" ? el.checked : el.value;
			});

		// Radio chip group selections
		const chipGroups = {};
		document.querySelectorAll("[data-radio-group]").forEach((group) => {
			const sel = group.querySelector("[data-value].selected");
			if (sel) chipGroups[group.dataset.radioGroup] = sel.dataset.value;
		});

		// ABC chip states (data-abc + data-normal uniquely identifies each chip)
		const abcChips = {};
		document.querySelectorAll("[data-abc][data-normal]").forEach((btn) => {
			abcChips[`${btn.dataset.abc}__${btn.dataset.normal}`] =
				btn.dataset.abcState || "normal";
		});

		localStorage.setItem(
			SAVE_KEY,
			JSON.stringify({
				v: 1,
				ts: Date.now(),
				fields,
				chipGroups,
				abcChips,
				state: serializeState(),
			}),
		);
	} catch (e) {
		console.warn("[CrewMate] Auto-save failed:", e.message);
	}
}

function restoreFormState() {
	let data;
	try {
		const raw = localStorage.getItem(SAVE_KEY);
		if (!raw) return;
		data = JSON.parse(raw);
		if (data.v !== 1) {
			localStorage.removeItem(SAVE_KEY);
			return;
		}
	} catch {
		localStorage.removeItem(SAVE_KEY);
		return;
	}

	// 1. Restore state object (Sets from arrays)
	const d = data.state || {};
	const toSet = (arr) => new Set(Array.isArray(arr) ? arr : []);
	state.ros = d.ros || {};
	state.drugEntries = d.drugEntries || [];
	state.ivEntries = d.ivEntries || [];
	state.manualHandling = d.manualHandling || [];
	state.clinicalChanges = d.clinicalChanges || [];
	state.injuryEntries = d.injuryEntries || [];
	state.mhActs = d.mhActs || [];
	state.auscFindings = d.auscFindings || {};
	state.auscActive = d.auscActive || null;
	state.abdoFindings = d.abdoFindings || {};
	state.worseningAuto = d.worseningAuto !== undefined ? d.worseningAuto : true;
	state.siteParts = toSet(d.siteParts);
	state.radiationParts = toSet(d.radiationParts);
	state.character = toSet(d.character);
	state.associated = toSet(d.associated);
	state.exacerbating = toSet(d.exacerbating);
	state.relieving = toSet(d.relieving);
	state.referrals = toSet(d.referrals);
	state.pReferrals = toSet(d.pReferrals);
	state.fallsSymptoms = toSet(d.fallsSymptoms);
	state.fallsActivity = toSet(d.fallsActivity);
	state.fallsInjuries = toSet(d.fallsInjuries);
	state.fallsLocation = toSet(d.fallsLocation);
	state.headMechanism = toSet(d.headMechanism);
	state.headSymptoms = toSet(d.headSymptoms);
	state.headSigns = toSet(d.headSigns);
	state.seizureType = toSet(d.seizureType);
	state.seizureFeatures = toSet(d.seizureFeatures);
	state.seizureFindings = toSet(d.seizureFindings);
	state.seizurePrecipitants = toSet(d.seizurePrecipitants);
	state.seizurePostictalFeatures = toSet(d.seizurePostictalFeatures);
	state.urinaryVolumeFeatures = toSet(d.urinaryVolumeFeatures);
	state.urinaryColourFeatures = toSet(d.urinaryColourFeatures);
	state.aedCompliance = toSet(d.aedCompliance);
	state.mhIntent = toSet(d.mhIntent);
	state.mhPlanning = toSet(d.mhPlanning);
	state.odPrescribed = toSet(d.odPrescribed);
	state.odAssessSource = toSet(d.odAssessSource);
	state.shMethod = toSet(d.shMethod);
	state.shDepth = toSet(d.shDepth);
	state.mseAppearance = toSet(d.mseAppearance);
	state.mseBehaviour = toSet(d.mseBehaviour);
	state.mseSpeech = toSet(d.mseSpeech);
	state.mseThoughtContent = toSet(d.mseThoughtContent);
	state.mseAffect = toSet(d.mseAffect);
	state.mseThoughtForm = toSet(d.mseThoughtForm);
	state.msePerception = toSet(d.msePerception);
	state.mseInsight = toSet(d.mseInsight);
	state.safeguardingConcerns = toSet(d.safeguardingConcerns);
	state.mcaAbilities = toSet(d.mcaAbilities);
	state.lacksCapAbilities = toSet(d.lacksCapAbilities);
	state.airwayInterventions = toSet(d.airwayInterventions);
	state.woundInterventions = toSet(d.woundInterventions);
	state.ecgFindings = toSet(d.ecgFindings);
	state.ecgLeads = toSet(d.ecgLeads);

	// 2. Re-render dynamic entry lists
	renderDrugEntries();
	renderIvEntries();
	renderManualEntries();
	renderMhActEntries();
	renderInjuryEntries();

	// 3. Restore field values (inputs, selects, textareas)
	Object.entries(data.fields || {}).forEach(([id, value]) => {
		const el = document.getElementById(id);
		if (!el) return;
		if (el.type === "checkbox") el.checked = Boolean(value);
		else el.value = value;
	});

	// 4. Restore radio chip group visual selections
	Object.entries(data.chipGroups || {}).forEach(([groupId, value]) => {
		const group = document.querySelector(`[data-radio-group="${groupId}"]`);
		if (!group) return;
		group.querySelectorAll("[data-value]").forEach((btn) => {
			btn.classList.toggle("selected", btn.dataset.value === value);
		});
		const hidden = document.getElementById(groupId);
		if (hidden) hidden.value = value;
	});

	// 5. Restore ABC chip visual states
	Object.entries(data.abcChips || {}).forEach(([key, abcState]) => {
		const [abc, normal] = key.split("__");
		const btn = document.querySelector(
			`[data-abc="${abc}"][data-normal="${normal}"]`,
		);
		if (!btn) return;
		btn.dataset.abcState = abcState;
		btn.textContent = abcState === "abnormal" ? btn.dataset.abnormal : normal;
		btn.classList.toggle("abnormal", abcState === "abnormal");
		btn.classList.toggle("selected", abcState === "normal");
	});

	// 6. Restore ROS chip visual states from state.ros
	document.querySelectorAll("[data-state-id]").forEach((btn) => {
		const stateId = btn.dataset.stateId;
		if (!(stateId in state.ros)) return;
		const isAbnormal = state.ros[stateId] === "abnormal";
		btn.classList.toggle("abnormal", isAbnormal);
		btn.classList.toggle("selected", !isAbnormal);
		btn.textContent = isAbnormal ? btn.dataset.abnormal : btn.dataset.normal;
	});

	// 7. Restore multi-select square-btn grids from state Sets
	document.querySelectorAll("[data-state]").forEach((grid) => {
		const set = state[grid.dataset.state];
		if (!(set instanceof Set)) return;
		grid.querySelectorAll(".square-btn").forEach((btn) => {
			const v = btn.dataset.value || btn.textContent.trim();
			btn.classList.toggle("selected", set.has(v));
		});
	});

	// 8. Update ROS section badges
	const sections = [
		...new Set(Object.keys(state.ros).map((k) => k.split("_")[0])),
	];
	sections.forEach(updateRosBadge);

	// 9. Run key visibility updates
	updateMapTags();
	syncAuscultationOutput();
	handleConveyanceDisplay();
	updateDemographicVisibility();
	const pcSelect = document.getElementById("pcSelect");
	if (pcSelect?.value) pcSelect.dispatchEvent(new Event("change"));
	if (state.worseningAuto) applyWorseningDefault();
	else updateWorseningScript();

	// 10. Show restored banner
	const t = new Date(data.ts);
	const timeStr = `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
	const banner = document.createElement("div");
	banner.style.cssText =
		"position:fixed;bottom:16px;right:16px;" +
		"background:#f0faf0;color:#2e7d32;padding:8px 14px;border-radius:8px;" +
		"font-size:12px;z-index:9999;display:flex;align-items:center;gap:10px;" +
		"border:1px solid #a5d6a7;opacity:0.9;white-space:nowrap";
	banner.innerHTML =
		`<span>✓ Restored from ${timeStr}</span>` +
		`<button type="button" style="background:none;border:none;color:#2e7d32;` +
		`padding:0 2px;cursor:pointer;font-size:14px;line-height:1;opacity:0.7">✕</button>`;
	banner
		.querySelector("button")
		.addEventListener("click", () => banner.remove());
	document.body.appendChild(banner);
	setTimeout(() => banner.remove(), 4000);
}

function clearSavedState() {
	localStorage.removeItem(SAVE_KEY);
}
