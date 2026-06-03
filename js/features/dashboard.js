import { $, $$ } from "../utils/dom.js";

function showDashboard() {
	document.dispatchEvent(new CustomEvent("crewmate:leave-paeds"));

	$("#dashboard")?.classList.remove("hidden");
	$("#prf-tool")?.classList.add("hidden");
	$("#resp-tool")?.classList.add("hidden");
	$("#obs-recorder")?.classList.add("hidden");
	$("#drug-finder-tool")?.classList.add("hidden");
	$("#falls-tool")?.classList.add("hidden");
	$("#news-tool")?.classList.add("hidden");
	$("#backButton")?.classList.add("hidden");
	$("#resetButton")?.classList.add("hidden");
}

function showFeature(feature) {
	$("#dashboard")?.classList.add("hidden");
	$("#backButton")?.classList.remove("hidden");

	if (feature === "eprf") {
		$("#prf-tool")?.classList.remove("hidden");
		$("#resetButton")?.classList.remove("hidden");
		document.dispatchEvent(new CustomEvent("crewmate:show-eprf"));
	} else if (feature === "paeds-prf") {
		$("#prf-tool")?.classList.remove("hidden");
		$("#resetButton")?.classList.remove("hidden");
		document.dispatchEvent(new CustomEvent("crewmate:show-paeds"));
	} else if (feature === "resp-timer") {
		$("#resp-tool")?.classList.remove("hidden");
		$("#resetButton")?.classList.add("hidden");
		document.dispatchEvent(new CustomEvent("crewmate:show-resp-counter"));
	} else if (feature === "obs-recorder") {
		$("#obs-recorder")?.classList.remove("hidden");
		$("#resetButton")?.classList.add("hidden");
		document.dispatchEvent(new CustomEvent("crewmate:show-obs-recorder"));
	} else if (feature === "drug-finder") {
		$("#drug-finder-tool")?.classList.remove("hidden");
		$("#resetButton")?.classList.add("hidden");
		setTimeout(() => $("#bnfSearchInput")?.focus(), 50);
	} else if (feature === "newsScore") {
		$("#news-tool")?.classList.remove("hidden");
		$("#resetButton")?.classList.add("hidden");
	} else if (feature === "falls-guide") {
		$("#falls-tool")?.classList.remove("hidden");
		$("#resetButton")?.classList.add("hidden");
	}
}

export function initDashboard() {
	$$(".feature-card:not(.coming-soon)").forEach((card) => {
		card.addEventListener("click", () => showFeature(card.dataset.feature));
		card.addEventListener("keydown", (e) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				showFeature(card.dataset.feature);
			}
		});
	});

	$("#backButton")?.addEventListener("click", showDashboard);
}
