import { $, $$, val, isChecked } from "../utils/dom.js";
import { OPTIONS, ABCDE, ROS } from "../data/options.js";
import { WORSENING_GENERIC, WORSENING_PC } from "../data/worseningAdvice.js";
import {
	formatSet,
	listFactors,
	getPc,
	onsetTime,
	onsetClockSuffix,
	rfSystolic,
	getConveyTransferText,
	setRadioChip,
} from "../utils/helpers.js";
import { evaluateRedFlags } from "../clinical/redFlags.js";
import { state, paedsMode } from "../app.js";

const outputSectionTexts = new Map();

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

function applyWorseningDefault() {

	if (!state.worseningAuto) return;
	const decision = val("conveyanceDecision");
	const newMode = decision === "Conveyed" ? "Not applicable" : "Standard";
	setRadioChip("worseningMode", newMode);
	updateWorseningScript();
}

function buildPatientScript(declined) {
	const pc = getPc();
	const pcData = WORSENING_PC[pc];
	const genericLines = WORSENING_GENERIC.map(
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
	const pcData = WORSENING_PC[pc];
	const custom = val("customWorsening");

	if (mode === "Not applicable" || decision === "Conveyed")
		return "Patient conveyed to hospital; community worsening advice not applicable.";

	const declined = decision === "Declined conveyance";
	const allItems = [
		...WORSENING_GENERIC,
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

function handleConveyanceDisplay() {
	const decision = val("conveyanceDecision");
	const conveyed = decision === "Conveyed";
	$("#conveyedFields")?.classList.toggle("hidden", !conveyed);
	$("#nonConveyedFields")?.classList.toggle("hidden", conveyed);
	$("#declineReasonWrap")?.classList.toggle("hidden", !decision.toLowerCase().includes("declin"));
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
		`${decision}.`,
		val("declineReason") ? `Reason for declining: ${val("declineReason")}.` : null,
		`Referred/signposted to: ${formatSet(state.referrals, "not documented")}.`,
		val("followUp") ? val("followUp") + "." : null,
		checks ? `Safety netting: ${checks}.` : null,
		legalLine,
		notes || null,
	]
		.filter(Boolean)
		.join(" ");
}

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

	window.CrewMateAbcde.syncAuscultationOutput();
	const abcSummary = window.CrewMateRos.abcHandoverSummary();
	if (abcSummary && abcSummary !== "No ABCDE concerns identified.") {
		assessParts.push(`ABCDE: ${abcSummary.split("\n").join("; ")}`);
	} else {
		assessParts.push("ABCDE: No concerns");
	}

	const ecgText = window.CrewMateAbcde.buildEcgText();
	if (ecgText && !ecgText.includes("Not performed"))
		assessParts.push(`ECG: ${ecgText.split("\n").join("; ")}`);

	const aus = val("respAus");
	if (aus && aus !== "Not auscultated") assessParts.push(`Ausc: ${aus}`);

	if (!isChecked("noPain")) {
		const site = window.CrewMateBodyMap.getSelectedParts(state.siteParts);
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
		const ht = window.CrewMateInjury.buildHeadInjuryText();
		if (ht) assessParts.push(`Head injury: ${ht.split("\n")[0]}`);
	} else if (pcSel === "Seizure") {
		const st = window.CrewMateSeizure.buildSeizureText();
		if (st) assessParts.push(`Seizure: ${st.split("\n")[0]}`);
	} else if (OPTIONS.mentalHealth.presentingComplaint.includes(pcSel)) {
		const mht = window.CrewMateMh.buildMhAssessmentText();
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
		const block = window.CrewMateRos.rosSectionText(s);
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
		assessParts.push(
			`Tx: ${window.CrewMateTreatment.buildTreatmentText().split("\n").join("; ")}`,
		);

	const capacityStatus = val("capacityStatus");
	if (capacityStatus && capacityStatus !== "Not applicable") {
		assessParts.push(`Capacity: ${capacityStatus}`);
	}

	const referrals = formatSet(state.referrals, "none");
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
	const sg = window.CrewMateSafeguarding.buildSafeguardingText();
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

	const treatmentParts = ABCDE.sections.flatMap((s) => {
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
			`A — Assessment:\n${window.CrewMateRos.abcHandoverSummary()}`,
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

function buildOutputSections() {

	const pc = getPc();
	const site =
		window.CrewMateBodyMap.getSelectedParts(state.siteParts) || "Not localised";
	const radiation =
		window.CrewMateBodyMap.getSelectedParts(state.radiationParts) ||
		"No radiation selected";
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
			const body = window.CrewMateGynae.buildGynaeOutput();
			return body ? [{ id: "gynae", title: "OBSTETRIC / GYNAECOLOGICAL", body }] : [];
		})(),
		{
			id: "primary",
			title: "PRIMARY SURVEY",
			body:
				`OA: ${val("oaFound")}${val("oaLocation") ? ` at ${val("oaLocation")}` : ""}; ${val("oaMobility").toLowerCase()}. ${val("oaFound") !== "Greeted by patient" && val("oaPatientFoundHow") ? `On reaching patient: ${val("oaPatientFoundHow")}. ` : ""}${isChecked("oaConsent") ? "Consented to assessment. " : ""}${isChecked("oaNoABC") ? "No immediate ABC concerns. " : ""}${isChecked("oaNormalPresentation") ? "Normal presentation on arrival. " : ""}${val("oaNotes")}`.trimEnd() +
				`\n${ABCDE.sections.map(window.CrewMateRos.abcLine).join("\n")}`,
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
		...(state.fallsSymptoms.size > 0 || state.fallsLocation.size > 0 ||
			state.fallsActivity.size > 0 || state.fallsInjuries.size > 0 ||
			val("fallsTime") || val("fallsLieTime")
			? [{ id: "falls", title: "FALLS ASSESSMENT — SPLATT", body: window.CrewMateFalls.buildFallsText() }]
			: []),
		...(state.headSymptoms.size > 0 || state.headSigns.size > 0 ||
			state.headMechanism.size > 0 || val("headLOC")
			? [{ id: "headinjury", title: "HEAD INJURY ASSESSMENT — NICE CG176", body: window.CrewMateInjury.buildHeadInjuryText() }]
			: []),
		...(state.seizureType.size > 0 || val("seizureCount") || val("seizureDuration")
			? [{ id: "seizure", title: "SEIZURE ASSESSMENT", body: window.CrewMateSeizure.buildSeizureText() }]
			: []),
		...(() => {
			const t = window.CrewMateOd.buildOdAssessmentText();
			return t ? [{ id: "odassessment", title: "OVERDOSE / POISONING ASSESSMENT", body: t }] : [];
		})(),
		...(() => {
			const t = window.CrewMateMh.buildMhAssessmentText();
			return t ? [{ id: "mhassessment", title: "MENTAL HEALTH ASSESSMENT", body: t }] : [];
		})(),
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
						body: window.CrewMateInjury.buildInjuryText(),
					},
				]
			: []),
		...(() => {
			const spinal = window.CrewMateInjury.buildSpinalText();
			return spinal
				? [{ id: "spinal", title: "SPINAL ASSESSMENT", body: spinal }]
				: [];
		})(),
		...Object.entries(ROS.output_title).map(([section, title]) => ({
			id: `ros-${section}`,
			title,
			body: window.CrewMateRos.rosSectionText(section),
		})),
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
							body: window.CrewMateTreatment.buildTreatmentText(),
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
							body: window.CrewMateTreatment.buildChangesText(),
						},
					]
				: [];
		})(),
		{
			id: "capacity",
			title: "ASSESSMENT — MENTAL CAPACITY / CONSENT",
			body: window.CrewMateCapacity.buildCapacityText(),
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
			const sg = window.CrewMateSafeguarding.buildSafeguardingText();
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
	ABCDE.sections.forEach(({ key, notes: notesId }) => {
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
	const site = window.CrewMateBodyMap.getSelectedParts(state.siteParts);
	const radiation = window.CrewMateBodyMap.getSelectedParts(
		state.radiationParts,
	);
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
	const ecgLine = window.CrewMateAbcde.buildEcgText();
	const sgText = window.CrewMateSafeguarding.buildSafeguardingText();
	const clinChanges = state.clinicalChanges.map(
		(e) => `${e.time ? `[${e.time}] ` : ""}${e.text}`,
	);

	//  Assessment — ROS
	const assessmentLines = [];
	Object.entries(ROS.labels).forEach(([section, label]) => {
		const hasAbnormal =
			ROS[section]?.items?.some(
				([id]) => state.ros[`${section}_${id}`] === "abnormal",
			) || false;
		const hasNotes = (ROS.notes_field[section] || []).some((f) => val(f));
		if (hasAbnormal || hasNotes) {
			assessmentLines.push(
				`${label}: ${window.CrewMateRos.rosSectionText(section, true)}`,
			);
		}
	});
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

function generateOutput() {
	window.CrewMateAbcde.syncAuscultationOutput();
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

export function initOutput() {
	applyWorseningDefault();
	handleConveyanceDisplay();
	renderConveyanceSuggestion();
}

window.CrewMateOutput = {
	generateOutput,
	updateWorseningScript,
	applyWorseningDefault,
	handleConveyanceDisplay,
	handlePConveyanceDisplay,
	renderConveyanceSuggestion,
	copyOutput,
	copySectionById,
	buildConveyanceText,
	buildWorseningText,
	buildOutputSections,
	buildConveyDestination,
};
