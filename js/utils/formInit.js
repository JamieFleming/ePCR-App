import {
	$,
	populateGroupedSelect,
	populateFlatSelect,
	populateChipGroup,
	populateSiteChips,
	buildButtonGrid,
} from "./dom.js";
import { OPTIONS } from "../data/options.js";

function populateGaugeChips(groupId) {
	const group = $(`[data-radio-group='${groupId}']`);
	if (!group) return;
	OPTIONS.treatments.accessGauges.forEach(({ value, label, cls }) => {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = `radio-chip ${cls}`;
		btn.dataset.value = value;
		btn.textContent = label;
		group.appendChild(btn);
	});
}

function populatePcSelect() {
	populateGroupedSelect("pcSelect", OPTIONS.presentingComplaint);
}

function populateCallerSelect() {
	populateGroupedSelect("hpcCaller", OPTIONS.caller);
}

function populateOaFoundSelect() {
	populateGroupedSelect("oaFound", OPTIONS.onArrival.found);
}

function populateMobilityChips() {
	const group = $("[data-radio-group='oaMobility']");
	if (!group) return;
	OPTIONS.onArrival.mobility.forEach(({ value, label }) => {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "radio-chip";
		btn.dataset.value = value;
		btn.textContent = label;
		group.appendChild(btn);
	});
}

function populateOnsetTimeSelect() {
	populateFlatSelect("onsetTime", OPTIONS.onset.time);
}

function populateOnsetTypeChips() {
	populateChipGroup("onsetType", OPTIONS.onset.type);
}

function populateTimingChips() {
	populateChipGroup("timingSelect", OPTIONS.onset.timing);
}

function populateHeadInjuryChips() {
	populateChipGroup("headLOC", OPTIONS.headInjury.loc);
	populateChipGroup("headLOCDuration", OPTIONS.headInjury.locDuration);
	populateChipGroup("headRetrograde", OPTIONS.headInjury.amnesia);
	populateChipGroup(
		"headRetroDuration",
		OPTIONS.headInjury.retroAmnesiaDuration,
	);
	populateChipGroup("headAnterograde", OPTIONS.headInjury.amnesia);
	populateChipGroup("headVomitingCount", OPTIONS.headInjury.vomiting);
	populateChipGroup("headAnticoag", OPTIONS.headInjury.anticoagulated);
}

function populateDrugSelect() {
	populateGroupedSelect("drugName", OPTIONS.treatments.drugs);
}

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

function buildOptionButtons() {
	// Maps data-state attribute keys to their OPTIONS paths.
	const gridMap = {
		character: OPTIONS.pain.character,
		associated: OPTIONS.pain.associated,
		exacerbating: OPTIONS.pain.exacerbating,
		relieving: OPTIONS.pain.relieving,
		referrals: OPTIONS.referrals.adult,
		pReferrals: OPTIONS.referrals.paediatric,
		fallsSymptoms: OPTIONS.falls.symptoms,
		fallsLocation: OPTIONS.falls.location,
		fallsActivity: OPTIONS.falls.activity,
		fallsInjuries: OPTIONS.falls.injuries,
		headMechanism: OPTIONS.headInjury.mechanism,
		headSymptoms: OPTIONS.headInjury.symptoms,
		headSigns: OPTIONS.headInjury.signs,
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
	buildGrid("urinaryVolumeGrid", OPTIONS.urinary.volumeFeatures);
	buildGrid("urinaryColourGrid", OPTIONS.urinary.colourFeatures);
}

function buildConveyTransferChips(
	containerId = "conveyTransferGrid",
	chipClass = "convey-chip",
) {
	const root = $(`#${containerId}`);
	if (!root) return;
	OPTIONS.conveyance.transferDetails.forEach(([normal, abnormal]) => {
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
	});
}

function initFormInit() {
	populatePcSelect();
	populateCallerSelect();
	populateDrugSelect();
	populateOaFoundSelect();
	populateMobilityChips();
	populateChipGroup("drugRoute", OPTIONS.treatments.drugRoutes);
	populateChipGroup("pDrugRoute", OPTIONS.treatments.drugRoutes);
	populateChipGroup("vaType", OPTIONS.treatments.accessType);
	populateChipGroup("pVaType", OPTIONS.treatments.accessType);
	populateChipGroup("vaOutcome", OPTIONS.treatments.accessOutcome);
	populateChipGroup("pVaOutcome", OPTIONS.treatments.accessOutcome);
	populateGaugeChips("vaGauge");
	populateGaugeChips("pVaGauge");
	populateSiteChips("vaIvSites", OPTIONS.treatments.accessSites.iv);
	populateSiteChips("vaIoSites", OPTIONS.treatments.accessSites.io);
	populateSiteChips("pVaIvSites", OPTIONS.treatments.accessSites.ivPaeds);
	populateSiteChips("pVaIoSites", OPTIONS.treatments.accessSites.ioPaeds);
	populateOnsetTimeSelect();
	populateOnsetTypeChips();
	populateTimingChips();
	populateHeadInjuryChips();
	const headGcsWrap = $("#headGcsCalcWrap");
	if (headGcsWrap)
		headGcsWrap.innerHTML = window.CrewMateGcs.buildGcsCalcHTML("headGcs");
	buildPainScoreGrids();
	buildUrinaryChips();
	buildOptionButtons();
	populateChipGroup(
		"conveyanceDecision",
		OPTIONS.conveyance.conveyanceDecision,
	);
	$(
		"[data-radio-group='conveyanceDecision'] [data-value='Conveyed']",
	)?.classList.add("selected");
	populateChipGroup("pConveyDecision", OPTIONS.conveyance.pConveyDecision);
	$(
		"[data-radio-group='pConveyDecision'] [data-value='Conveyed']",
	)?.classList.add("selected");
	const riskGrid = $("#riskChecksGrid");
	if (riskGrid) {
		OPTIONS.conveyance.riskChecks.forEach(({ id, label }) => {
			const lbl = document.createElement("label");
			lbl.className = "check-row";
			const cb = document.createElement("input");
			cb.type = "checkbox";
			cb.id = id;
			cb.checked = true;
			lbl.appendChild(cb);
			lbl.append(` ${label}`);
			riskGrid.appendChild(lbl);
		});
	}

	const legalGrid = $("#legalConsiderationsChips");
	if (legalGrid) {
		OPTIONS.conveyance.legalChips.forEach(({ key, label }) => {
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "square-btn legal-chip";
			btn.dataset.legal = key;
			btn.textContent = label;
			legalGrid.appendChild(btn);
		});
	}

	populateGroupedSelect("conveyHospital", OPTIONS.conveyance.conveyHospitals);
	(() => {
		const sel = $("#conveyHospital");
		if (!sel) return;
		const opt = document.createElement("option");
		opt.textContent = "Other hospital";
		sel.appendChild(opt);
	})();

	populateChipGroup("conveyDepartment", OPTIONS.conveyance.conveyDepartment);

	buildConveyTransferChips();

	populateChipGroup(
		"mobilisationToVehicle",
		OPTIONS.conveyance.mobilisationToVehicle,
	);
}

window.CrewMateFormInit = { initFormInit, buildConveyTransferChips };
