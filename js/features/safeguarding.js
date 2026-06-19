import { val, isChecked, buildButtonGrid } from "../utils/dom.js";
import { OPTIONS } from "../data/options.js";
import { state } from "../app.js";

function buildSafeguardingSection() {
	buildButtonGrid(
		"safeguardingGrid",
		OPTIONS.safeguarding.concerns,
		"sgGroup",
		"safeguarding",
		"sgValue",
	);
}

function bindSafeguardingEvents() {
	document.querySelector("[data-radio-group='safeguardingConsent']")?.addEventListener("click", (e) => {
		const chip = e.target.closest("[data-value]");
		if (!chip) return;
		const v = chip.dataset.value;
		const needsRationale = v === "No" || v === "Unable to consent";
		document.getElementById("consentRationaleWrap")?.classList.toggle("hidden", !needsRationale);
	});

	document.querySelector("[data-radio-group='referralMade']")?.addEventListener("click", (e) => {
		const chip = e.target.closest("[data-value]");
		if (!chip) return;
		document.getElementById("safeguardingReferralFields")?.classList.toggle("hidden", chip.dataset.value !== "Yes");
	});
}

function buildSafeguardingText() {
	const concerns = [...state.safeguardingConcerns].map((c) =>
		c === "Other" ? val("safeguardingOtherText") || "Other" : c,
	);
	const realConcerns = concerns.filter((c) => c !== "None identified on scene");
	if (!realConcerns.length) return "";

	const lines = ["SAFEGUARDING"];
	if (val("whyAmbulanceContact")) lines.push(`Why ambulance made contact: ${val("whyAmbulanceContact")}`);
	lines.push(`Concerns identified: ${realConcerns.join(", ")}`);
	if (val("whoRaisedConcern")) lines.push(`Who raised concern: ${val("whoRaisedConcern")}`);
	if (val("whyConcernRaised")) lines.push(`Why concern raised: ${val("whyConcernRaised")}`);
	if (val("safeguardingConsent")) {
		lines.push(`Consent: ${val("safeguardingConsent")}`);
		const needsRationale = val("safeguardingConsent") === "No" || val("safeguardingConsent") === "Unable to consent";
		if (needsRationale && val("consentRationale"))
			lines.push(`Rationale for referral without consent: ${val("consentRationale")}`);
	}
	if (val("concernsDescription")) lines.push(`Concerns: ${val("concernsDescription")}`);
	if (val("patientWants")) lines.push(`Patient wishes: ${val("patientWants")}`);
	if (val("othersPresentWant")) lines.push(`Others present wishes: ${val("othersPresentWant")}`);
	if (val("crewWants")) lines.push(`Crew recommendation: ${val("crewWants")}`);
	if (val("safeguardingNotes")) lines.push(`Additional information: ${val("safeguardingNotes")}`);
	if (val("clericJobId")) lines.push(`Cleric Job ID: ${val("clericJobId")}`);
	if (val("jobInformation")) lines.push(`Job information: ${val("jobInformation")}`);
	const referral = val("referralMade");
	if (referral === "Yes") {
		const uly = val("ulyssesNumber");
		lines.push(`Safeguarding referral made: ${uly ? `ULY-${uly}` : "reference pending"}`);
	} else if (referral === "No") {
		lines.push("Safeguarding referral made: No");
	}
	return lines.join("\n");
}

export function initSafeguarding() {
	buildSafeguardingSection();
	bindSafeguardingEvents();
}

window.CrewMateSafeguarding = { buildSafeguardingText };
