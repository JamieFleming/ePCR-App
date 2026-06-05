import { $, $$, val, isChecked } from "./js/utils/dom.js";

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

// App Init
function init() {
	window.CrewMateFormInit.initFormInit();
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
	enhanceSectionCards,
	setOtherFactorVisible,
	updateDemographicVisibility,
	toggleConveyChip,
	bindRadioChipGroups,
	evaluateRedFlags,
	get paedsMode() {
		return paedsMode;
	},
};

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
	$("#generateOeButton").addEventListener(
		"click",
		window.CrewMateRos.generateOe,
	);
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
		if (abc) return window.CrewMateAbcde.toggleAbc(abc);
		const convey = event.target.closest(".convey-chip");
		if (convey) return toggleConveyChip(convey);
		const ros = event.target.closest(".ros-chip");
		if (ros) return window.CrewMateRos.toggleRos(ros);
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
		if (ecgFinding) return window.CrewMateRos.toggleEcgFinding(ecgFinding);
		const ecgLead = event.target.closest(".ecg-lead");
		if (ecgLead) return window.CrewMateRos.toggleEcgLead(ecgLead);
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
