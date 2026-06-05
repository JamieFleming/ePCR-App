import {
	$,
	val,
	isChecked,
	buildButtonGrid,
	populateChipGroup,
} from "../utils/dom.js";

function buildSeizureSection() {
	buildButtonGrid(
		"seizureTypeGrid",
		window.CrewMateOptions.OPTIONS.seizure.type,
		"szGroup",
		"type",
		"szValue",
	);
	buildButtonGrid(
		"seizureFeaturesGrid",
		window.CrewMateOptions.OPTIONS.seizure.features,
		"szGroup",
		"features",
		"szValue",
	);
	buildButtonGrid(
		"seizureFindingsGrid",
		window.CrewMateOptions.OPTIONS.seizure.findings,
		"szGroup",
		"findings",
		"szValue",
	);
	buildButtonGrid(
		"seizurePrecipitantsGrid",
		window.CrewMateOptions.OPTIONS.seizure.precipitants,
		"szGroup",
		"precipitants",
		"szValue",
	);
	buildButtonGrid(
		"aedComplianceGrid",
		window.CrewMateOptions.OPTIONS.seizure.aedCompliance,
		"szGroup",
		"aed",
		"szValue",
	);
	populateChipGroup(
		"seizureCount",
		window.CrewMateOptions.OPTIONS.seizure.count,
	);
	populateChipGroup(
		"seizureWitnessed",
		window.CrewMateOptions.OPTIONS.seizure.witnessed,
	);
	populateChipGroup(
		"seizurePostictal",
		window.CrewMateOptions.OPTIONS.seizure.postictal,
	);
	populateChipGroup(
		"seizureRecovery",
		window.CrewMateOptions.OPTIONS.seizure.recovery,
	);
	const postictalGrid = $("#seizurePostictalFeaturesGrid");
	if (postictalGrid) {
		window.CrewMateOptions.OPTIONS.seizure.postictalFeatures.forEach(
			(feature) => {
				const btn = document.createElement("button");
				btn.type = "button";
				btn.className = "square-btn";
				btn.textContent = feature;
				btn.dataset.value = feature;
				postictalGrid.append(btn);
			},
		);
	}
}

function buildSeizureText() {
	const state = window.CrewMateApp.getState();
	const lines = [];
	if (state.seizureType.size)
		lines.push(`Seizure type: ${[...state.seizureType].join(", ")}`);
	if (val("seizureCount"))
		lines.push(`Number of seizures: ${val("seizureCount")}`);
	if (val("seizureDuration")) lines.push(`Duration: ${val("seizureDuration")}`);
	const szTimeUnknown = $("#seizureTimeUnknownBtn")?.classList.contains(
		"selected",
	);
	const szTime = szTimeUnknown ? "Unknown" : val("seizureTime");
	if (szTime) lines.push(`Time of onset: ${szTime}`);
	const szWitnessed = val("seizureWitnessed");
	if (szWitnessed) {
		const by = val("seizureWitnessedBy");
		lines.push(
			`Witnessed: ${szWitnessed}${szWitnessed === "Witnessed" && by ? ` — ${by}` : ""}`,
		);
	}
	if (state.seizureFeatures.size)
		lines.push(
			`Features during seizure: ${[...state.seizureFeatures].join(", ")}`,
		);
	if (state.seizureFindings.size)
		lines.push(
			`Post-seizure findings on examination: ${[...state.seizureFindings].join(", ")}`,
		);
	const postictal = val("seizurePostictal");
	if (postictal) {
		const dur = val("seizurePostictalDuration");
		const features = state.seizurePostictalFeatures.size
			? ` Features: ${[...state.seizurePostictalFeatures].join(", ")}`
			: "";
		lines.push(
			postictal === "Yes"
				? `Postictal phase: Yes${dur ? ` — duration ${dur}` : ""}.${features}`
				: `Postictal phase: ${postictal}`,
		);
	}
	if (val("seizureRecovery"))
		lines.push(`Recovery to baseline: ${val("seizureRecovery")}`);
	if (isChecked("seizureKnownEpileptic")) {
		const diag = val("seizureEpilepsyDiagnosis");
		lines.push(`Known epileptic: Yes${diag ? ` (${diag})` : ""}`);
		if (val("seizureLastPrior"))
			lines.push(`Last seizure prior to today: ${val("seizureLastPrior")}`);
		if (val("seizureUsualPattern"))
			lines.push(`Usual pattern: ${val("seizureUsualPattern")}`);
		if (state.aedCompliance.size)
			lines.push(`AED compliance: ${[...state.aedCompliance].join(", ")}`);
	}
	if (state.seizurePrecipitants.size)
		lines.push(
			`Precipitating factors: ${[...state.seizurePrecipitants].join(", ")}`,
		);
	if (val("seizureNotes")) lines.push(val("seizureNotes"));
	return lines.length ? lines.join("\n") : "No seizure assessment documented.";
}

export function initSeizure() {
	buildSeizureSection();
}

window.CrewMateSeizure = { buildSeizureText };
