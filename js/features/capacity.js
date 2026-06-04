import { $, val } from "../utils/dom.js";
import { OPTIONS } from "../data/options.js";

function buildCapacitySection() {
	populateChipGroup("capacityStatus", OPTIONS.mentalCapacity.capacityStatus);
	const defaultChip = $(
		"[data-radio-group='capacityStatus'] [data-value='Has capacity']",
	);
	if (defaultChip) defaultChip.classList.add("selected");

	const checksWrap = $("#capacityChecks");
	if (checksWrap) {
		OPTIONS.mentalCapacity.mcaAbilities.forEach((label) => {
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "square-btn selected";
			btn.textContent = label;
			btn.dataset.mcaAbility = label;
			checksWrap.append(btn);
		});
	}

	const lacksWrap = $("#lacksCapGrid");
	if (lacksWrap) {
		OPTIONS.mentalCapacity.lacksCapReasons.forEach((label) => {
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "square-btn";
			btn.textContent = label;
			btn.dataset.lacksCapReason = label;
			lacksWrap.append(btn);
		});
	}
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

function buildCapacityText() {
	const state = window.CrewMateApp.getState();
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

export function initCapacity() {
	buildCapacitySection();
}

window.CrewMateCapacity = { handleCapacityDisplay, buildCapacityText };
