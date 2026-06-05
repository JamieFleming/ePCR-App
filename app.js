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
	buildRos();
	buildUrinaryChips();
	buildOptionButtons();
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

	bindEvents();
	window.CrewMateBodyMap.updateMapTags();
	window.CrewMateOutput.updateWorseningScript();
	enhanceSectionCards();
	// bindRedFlagToggle();
	// document.addEventListener("click", scheduleRedFlags, { passive: true });
	// document.addEventListener("input", scheduleRedFlags, { passive: true });
	// document.addEventListener("change", scheduleRedFlags, { passive: true });
	bindRadioChipGroups();
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

// ROS Builders

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
	get paedsMode() {
		return paedsMode;
	},
};

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
			window.CrewMateStorage.clearSavedState();
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
		if (state.worseningAuto) window.CrewMateOutput.applyWorseningDefault();
		else window.CrewMateOutput.updateWorseningScript();
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

	$("#capacityStatus").addEventListener(
		"change",
		window.CrewMateCapacity.handleCapacityDisplay,
	);
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
		window.CrewMateOutput.updateWorseningScript();
	});
	$("#conveyanceDecision").addEventListener("change", () => {
		window.CrewMateOutput.handleConveyanceDisplay();
		window.CrewMateOutput.applyWorseningDefault();
		window.CrewMateOutput.renderConveyanceSuggestion();
	});
	$("#conveyHospital")?.addEventListener(
		"change",
		window.CrewMateOutput.handleConveyanceDisplay,
	);
	$("#conveyDepartment")?.addEventListener(
		"change",
		window.CrewMateOutput.handleConveyanceDisplay,
	);
	$("#mobilisationToVehicle")?.addEventListener("change", () => {
		$("#mobilisationOtherWrap")?.classList.toggle(
			"hidden",
			val("mobilisationToVehicle") !== "Other",
		);
	});
	$("#clearPainButton")?.addEventListener(
		"click",
		window.CrewMateBodyMap.clearPainAssessment,
	);
	$("#clearBodyMapButton")?.addEventListener(
		"click",
		window.CrewMateBodyMap.clearBodyMap,
	);
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
	$("#refreshButton").addEventListener(
		"click",
		window.CrewMateOutput.generateOutput,
	);
	$("#copyButton").addEventListener("click", window.CrewMateOutput.copyOutput);

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
			window.CrewMateAbcde.renderAbdoGrid();
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
			window.CrewMateAbcde.renderAbdoGrid();
			return;
		}
		const abdoClearBtn = event.target.closest(".abdo-clear-btn");
		if (abdoClearBtn) {
			delete state.abdoFindings[abdoClearBtn.dataset.region];
			state.abdoActive = null;
			window.CrewMateAbcde.renderAbdoGrid();
			return;
		}

		const auscRegionBtn = event.target.closest(".ausc-region-btn");
		if (auscRegionBtn) {
			const region = auscRegionBtn.dataset.region;
			state.auscActive = state.auscActive === region ? null : region;
			window.CrewMateAbcde.renderAuscGrid();
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
			window.CrewMateAbcde.renderAuscGrid();
			return;
		}
		const auscClearBtn = event.target.closest(".ausc-clear-btn");
		if (auscClearBtn) {
			delete state.auscFindings[auscClearBtn.dataset.region];
			state.auscActive = null;
			window.CrewMateAbcde.renderAuscGrid();
			return;
		}

		const abc = event.target.closest(".abc-chip");
		if (abc) return toggleAbc(abc);
		const convey = event.target.closest(".convey-chip");
		if (convey) return toggleConveyChip(convey);
		const ros = event.target.closest(".ros-chip");
		if (ros) return toggleRos(ros);
		const mapTab = event.target.closest("[data-map-mode]");
		if (mapTab)
			return window.CrewMateBodyMap.setMapMode(mapTab.dataset.mapMode);
		const part = event.target.closest(".body-part");
		if (part) return window.CrewMateBodyMap.toggleBodyPart(part);
		const remove = event.target.closest("[data-remove-part]");
		if (remove)
			return window.CrewMateBodyMap.removeBodyPart(
				remove.dataset.removePart,
				remove.dataset.partType,
			);
		const injuryTypeBtn = event.target.closest("[data-injury-type]");
		if (injuryTypeBtn) {
			const v = injuryTypeBtn.dataset.injuryType;
			window.CrewMateInjury.pendingInjuryTypes.has(v)
				? window.CrewMateInjury.pendingInjuryTypes.delete(v)
				: window.CrewMateInjury.pendingInjuryTypes.add(v);
			injuryTypeBtn.classList.toggle(
				"selected",
				window.CrewMateInjury.pendingInjuryTypes.has(v),
			);
			if (v === "Other")
				$("#injuryTypeOtherWrap")?.classList.toggle(
					"hidden",
					!window.CrewMateInjury.pendingInjuryTypes.has("Other"),
				);
			return;
		}
		const injuryIntBtn = event.target.closest("[data-injury-intervention]");
		if (injuryIntBtn) {
			const v = injuryIntBtn.dataset.injuryIntervention;
			window.CrewMateInjury.pendingInjuryInterventions.has(v)
				? window.CrewMateInjury.pendingInjuryInterventions.delete(v)
				: window.CrewMateInjury.pendingInjuryInterventions.add(v);
			injuryIntBtn.classList.toggle(
				"selected",
				window.CrewMateInjury.pendingInjuryInterventions.has(v),
			);
			if (v === "Other")
				$("#injuryIntOtherWrap")?.classList.toggle(
					"hidden",
					!window.CrewMateInjury.pendingInjuryInterventions.has("Other"),
				);
			return;
		}
		const injuryNvBtn = event.target.closest("[data-injury-nv]");
		if (injuryNvBtn) {
			const key = injuryNvBtn.dataset.injuryNv;
			const isAbnormal =
				window.CrewMateInjury.pendingInjuryNv[key] === "abnormal";
			window.CrewMateInjury.pendingInjuryNv[key] = isAbnormal
				? "normal"
				: "abnormal";
			injuryNvBtn.classList.toggle("selected", isAbnormal);
			injuryNvBtn.classList.toggle("abnormal", !isAbnormal);
			injuryNvBtn.textContent = isAbnormal
				? injuryNvBtn.dataset.normal
				: injuryNvBtn.dataset.abnormal;
			return;
		}
		const removeInjury = event.target.closest("[data-remove-injury]");
		if (removeInjury)
			return window.CrewMateInjury.removeInjuryEntry(
				Number(removeInjury.dataset.removeInjury),
			);
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
			window.CrewMateOutput.renderConveyanceSuggestion();
			return;
		}
		const txChip = event.target.closest("[data-tx-group]");
		if (txChip) {
			const group = txChip.dataset.txGroup;
			const v = txChip.dataset.txValue;
			if (group === "manual") {
				window.CrewMateTreatment.pendingManualItems.has(v)
					? window.CrewMateTreatment.pendingManualItems.delete(v)
					: window.CrewMateTreatment.pendingManualItems.add(v);
				txChip.classList.toggle(
					"selected",
					window.CrewMateTreatment.pendingManualItems.has(v),
				);
				$("#manualOtherWrap")?.classList.toggle(
					"hidden",
					!window.CrewMateTreatment.pendingManualItems.has("Other"),
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
		if (removeVa)
			return window.CrewMateTreatment.removeIvEntry(
				Number(removeVa.dataset.removeVa),
			);
		const removeDrug = event.target.closest("[data-remove-drug]");
		if (removeDrug)
			return window.CrewMateTreatment.removeDrugEntry(
				Number(removeDrug.dataset.removeDrug),
			);
		const repeatDrug = event.target.closest("[data-repeat-drug]");
		if (repeatDrug)
			return window.CrewMateTreatment.repeatDrugEntry(
				Number(repeatDrug.dataset.repeatDrug),
			);
		const removeChange = event.target.closest("[data-remove-change]");
		if (removeChange)
			return window.CrewMateTreatment.removeChangeEntry(
				Number(removeChange.dataset.removeChange),
			);
		const removeManual = event.target.closest("[data-remove-manual]");
		if (removeManual) {
			state.manualHandling.splice(Number(removeManual.dataset.removeManual), 1);
			window.CrewMateTreatment.renderManualEntries();
			return;
		}
		const removeMhAct = event.target.closest("[data-remove-mhact]");
		if (removeMhAct) {
			state.mhActs.splice(Number(removeMhAct.dataset.removeMhact), 1);
			window.CrewMateMh.renderMhActEntries();
			return;
		}
		const ecgFinding = event.target.closest(".ecg-finding");
		if (ecgFinding) return toggleEcgFinding(ecgFinding);
		const ecgLead = event.target.closest(".ecg-lead");
		if (ecgLead) return toggleEcgLead(ecgLead);
		const copySectionBtn = event.target.closest("[data-copy-section]");
		if (copySectionBtn)
			return window.CrewMateOutput.copySectionById(
				copySectionBtn.dataset.copySection,
			);
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
	if (tabName === "output") window.CrewMateOutput.generateOutput();
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

function generateOe() {
	window.CrewMateAbcde.syncAuscultationOutput();
	const L = window.CrewMateOptions.ROS.oe_label;
	const oe = [
		"OE:",
		"",
		window.CrewMateOptions.ABCDE.sections.map(abcLine).join("\n"),
		"",
		`${L.resp}: ${rosLine("resp")} ${val("respAus") ? `Auscultation: ${val("respAus")}.` : ""}`,
		`\n`,
		`${L.cvs}: ${rosLine("cvs")} ${window.CrewMateAbcde.buildEcgText()}`,
		`\n`,
		`${L.neuro}: ${rosLine("neuro")}`,
		`\n`,
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
		`\n`,
		`${L.urine}: ${rosLine("urine")}`,
		`\n`,
		`${L.integ}: ${rosLine("integ")}`,
		`\n`,
		`${L.msk}: ${rosLine("msk")}`,
		`\n`,
		`${L.mh}: ${rosLine("mh")}`,
		`\n`,
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
			`${val("bpStatus")}. ${window.CrewMateAbcde.buildEcgText()} ${val("cvsNotes")}`.trim(),
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

function listSet(set, fallback) {
	return set.size ? [...set].join(", ") : fallback;
}

// Pain assessment

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
