import { state, updateDemographicVisibility } from "../app.js";

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
		mhRiskIndicators: s(state.mhRiskIndicators),
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
	state.mhRiskIndicators = toSet(d.mhRiskIndicators);
	state.safeguardingConcerns = toSet(d.safeguardingConcerns);
	state.mcaAbilities = toSet(d.mcaAbilities);
	state.lacksCapAbilities = toSet(d.lacksCapAbilities);
	state.airwayInterventions = toSet(d.airwayInterventions);
	state.woundInterventions = toSet(d.woundInterventions);
	state.ecgFindings = toSet(d.ecgFindings);
	state.ecgLeads = toSet(d.ecgLeads);

	window.CrewMateTreatment.renderDrugEntries();
	window.CrewMateTreatment.renderIvEntries();
	window.CrewMateTreatment.renderManualEntries();
	window.CrewMateMh.renderMhActEntries();
	window.CrewMateInjury.renderInjuryEntries();

	Object.entries(data.fields || {}).forEach(([id, value]) => {
		const el = document.getElementById(id);
		if (!el) return;
		if (el.type === "checkbox") el.checked = Boolean(value);
		else el.value = value;
	});

	Object.entries(data.chipGroups || {}).forEach(([groupId, value]) => {
		const group = document.querySelector(`[data-radio-group="${groupId}"]`);
		if (!group) return;
		group.querySelectorAll("[data-value]").forEach((btn) => {
			btn.classList.toggle("selected", btn.dataset.value === value);
		});
		const hidden = document.getElementById(groupId);
		if (hidden) hidden.value = value;
	});

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

	document.querySelectorAll("[data-state-id]").forEach((btn) => {
		const stateId = btn.dataset.stateId;
		if (!(stateId in state.ros)) return;
		const isAbnormal = state.ros[stateId] === "abnormal";
		btn.classList.toggle("abnormal", isAbnormal);
		btn.classList.toggle("selected", !isAbnormal);
		btn.textContent = isAbnormal ? btn.dataset.abnormal : btn.dataset.normal;
	});

	document.querySelectorAll("[data-state]").forEach((grid) => {
		const set = state[grid.dataset.state];
		if (!(set instanceof Set)) return;
		grid.querySelectorAll(".square-btn").forEach((btn) => {
			const v = btn.dataset.value || btn.textContent.trim();
			btn.classList.toggle("selected", set.has(v));
		});
	});

	const sections = [
		...new Set(Object.keys(state.ros).map((k) => k.split("_")[0])),
	];
	sections.forEach(window.CrewMateRos.updateRosBadge);

	window.CrewMateBodyMap.updateMapTags();
	window.CrewMateAbcde.syncAuscultationOutput();
	window.CrewMateOutput.handleConveyanceDisplay();
	updateDemographicVisibility();
	const pcSelect = document.getElementById("pcSelect");
	if (pcSelect?.value) pcSelect.dispatchEvent(new Event("change"));
	if (state.worseningAuto) window.CrewMateOutput.applyWorseningDefault();
	else window.CrewMateOutput.updateWorseningScript();

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

export function initStorage() {
	document.addEventListener("input", scheduleSave, { passive: true });
	document.addEventListener("change", scheduleSave, { passive: true });
	document.addEventListener("click", scheduleSave, { passive: true });
	restoreFormState();
}

window.CrewMateStorage = {
	scheduleSave,
	saveFormState,
	restoreFormState,
	clearSavedState,
};
