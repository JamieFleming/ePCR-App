import { val, isChecked } from "../utils/dom.js";
import { OPTIONS } from "../data/options.js";

function buildSafeguardingSection() {
	buildButtonGrid(
		"safeguardingGrid",
		OPTIONS.safeguarding.concerns,
		"sgGroup",
		"safeguarding",
		"sgValue",
	);
}

function buildSafeguardingText() {
	const state = window.CrewMateApp.getState();
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

export function initSafeguarding() {
	buildSafeguardingSection();
}

window.CrewMateSafeguarding = { buildSafeguardingText };
