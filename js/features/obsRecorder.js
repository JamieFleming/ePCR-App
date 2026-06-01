export function initObsRecorder() {
	document.addEventListener("crewmate:show-obs-recorder", () => {
		document.dispatchEvent(
			new CustomEvent("crewmate:init-legacy-obs-recorder"),
		);
	});
}
