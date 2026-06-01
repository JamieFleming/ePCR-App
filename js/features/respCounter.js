import { $ } from "../utils/dom.js";

const respCounter = {
	duration: 30,
	running: false,
	startTime: null,
	endTime: null,
	count: 0,
	timerId: null,
};

export function initRespCounter() {
	const durationSelect = $("#respDuration");
	const startButton = $("#respStartButton");
	const resetButton = $("#respResetButton");
	const tapButton = $("#respTapButton");

	durationSelect?.addEventListener("change", () => {
		if (!respCounter.running) {
			respCounter.duration = Number(durationSelect.value || 30);
			resetRespCounter(false);
		}
	});

	startButton?.addEventListener("click", startRespCounter);
	resetButton?.addEventListener("click", () => resetRespCounter());
	tapButton?.addEventListener("click", () => {
		recordRespTap();
	});

	document.addEventListener("crewmate:show-resp-counter", () => {
		resetRespCounter();
	});
}

function startRespCounter() {
	const durationSelect = $("#respDuration");
	respCounter.duration = Number(durationSelect?.value || 30);
	respCounter.running = true;
	respCounter.count = 0;
	respCounter.startTime = Date.now();
	respCounter.endTime = respCounter.startTime + respCounter.duration * 1000;

	$("#respResultCard")?.classList.add("hidden");
	$("#respDuration")?.setAttribute("disabled", "true");
	if ($("#respStartButton")) $("#respStartButton").textContent = "Counting...";
	if ($("#respTapLabel")) $("#respTapLabel").textContent = "Tap breath";

	clearInterval(respCounter.timerId);
	respCounter.timerId = setInterval(updateRespCounterDisplay, 500);
	updateRespCounterDisplay();
}

function recordRespTap() {
	if (!respCounter.running) return;
	respCounter.count += 1;
	updateRespCounterDisplay();

	const btn = $("#respTapButton");
	btn?.classList.remove("pulse");
	void btn?.offsetWidth;
	btn?.classList.add("pulse");
}

function updateRespCounterDisplay() {
	const now = Date.now();
	const elapsedSeconds = respCounter.startTime
		? Math.max((now - respCounter.startTime) / 1000, 0.1)
		: 0.1;
	const remaining = respCounter.endTime
		? Math.max(Math.ceil((respCounter.endTime - now) / 1000), 0)
		: respCounter.duration;

	const liveRate = Math.round((respCounter.count / elapsedSeconds) * 60);

	if ($("#respLiveRate"))
		$("#respLiveRate").textContent = String(liveRate || 0);
	if ($("#respTimeLeft")) $("#respTimeLeft").textContent = String(remaining);
	if ($("#respTapCount"))
		$("#respTapCount").textContent = String(respCounter.count);

	if (respCounter.running && now >= respCounter.endTime) finishRespCounter();
}

function finishRespCounter() {
	respCounter.running = false;
	clearInterval(respCounter.timerId);

	const rate = Math.round((respCounter.count / respCounter.duration) * 60);

	if ($("#respLiveRate")) $("#respLiveRate").textContent = String(rate);
	if ($("#respTimeLeft")) $("#respTimeLeft").textContent = "0";
	if ($("#respResultTotal"))
		$("#respResultTotal").textContent = String(respCounter.count);
	if ($("#respResultDuration"))
		$("#respResultDuration").textContent = String(respCounter.duration);
	if ($("#respResultRate"))
		$("#respResultRate").textContent = `${rate} breaths/min`;

	const isAbnormal = rate < 12 || rate > 20;
	const resultCard = $("#respResultCard");
	resultCard?.classList.remove("hidden");
	resultCard?.classList.toggle("resp-result-card-abnormal", isAbnormal);
	$("#respDuration")?.removeAttribute("disabled");
	if ($("#respStartButton")) $("#respStartButton").textContent = "Start again";
	if ($("#respTapLabel")) $("#respTapLabel").textContent = "Count complete";
}

function resetRespCounter(clearResult = true) {
	clearInterval(respCounter.timerId);
	respCounter.duration = Number($("#respDuration")?.value || 30);
	respCounter.running = false;
	respCounter.startTime = null;
	respCounter.endTime = null;
	respCounter.count = 0;
	respCounter.timerId = null;

	if ($("#respLiveRate")) $("#respLiveRate").textContent = "0";
	if ($("#respTimeLeft"))
		$("#respTimeLeft").textContent = String(respCounter.duration);
	if ($("#respTapCount")) $("#respTapCount").textContent = "0";
	if ($("#respStartButton")) $("#respStartButton").textContent = "Start count";
	if ($("#respTapLabel"))
		$("#respTapLabel").textContent = "Start & tap breaths";

	$("#respDuration")?.removeAttribute("disabled");
	if (clearResult) {
		const rc = $("#respResultCard");
		rc?.classList.add("hidden");
		rc?.classList.remove("resp-result-card--abnormal");
	}
}
