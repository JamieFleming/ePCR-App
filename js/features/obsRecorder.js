import { $, $$ } from "../utils/dom.js";
import { buildGcsCalcHTML } from "../utils/gcs.js";
import { calculateNewsScoreFromValues } from "../clinical/newsScoring.js";

let obsCounter = 0;
let _obsRecInited = false;

function newsScore(rr, spo2, o2On, sbp, hr, temp, avpu) {
	return window.CrewMateNewsScore.calculateNewsScoreFromValues({
		rr,
		spo2,
		o2On,
		sbp,
		hr,
		temp,
		avpu,
	});
}

function updateObsNewsScore(setEl) {
	const n = (field) => {
		const v = parseFloat(
			setEl.querySelector(`[data-obs-field="${field}"]`)?.value,
		);
		return isNaN(v) ? NaN : v;
	};
	const chip = (key) =>
		setEl.querySelector(`[data-obs-key="${key}"].selected`)?.dataset.obsVal;

	const rr = n("rr"),
		spo2 = n("spo2"),
		sbp = n("sbp"),
		hr = n("hr"),
		temp = n("temp");
	const o2On = chip("o2") === "Supplemental";
	const avpu = chip("avpu");

	const anyEntered = [rr, spo2, sbp, hr, temp].some((v) => !isNaN(v)) || avpu;
	const scoreEl = setEl.querySelector(".news2-score");
	const riskEl = setEl.querySelector(".news2-risk");
	const badgeEl = setEl.querySelector(".obs-news2");

	if (!anyEntered) {
		if (scoreEl) scoreEl.textContent = "–";
		if (riskEl) {
			riskEl.textContent = "";
			riskEl.className = "news2-risk";
		}
		if (badgeEl) badgeEl.className = "obs-news2";
		return;
	}

	const { score, risk } = newsScore(rr, spo2, o2On, sbp, hr, temp, avpu);
	if (scoreEl) scoreEl.textContent = score;
	const riskClass =
		risk === "HIGH"
			? "news2-high"
			: risk === "MEDIUM"
				? "news2-medium"
				: "news2-low";
	if (riskEl) {
		riskEl.textContent = risk;
		riskEl.className = `news2-risk ${riskClass}`;
	}
	if (badgeEl) badgeEl.className = `obs-news2 obs-news2--${risk.toLowerCase()}`;
}

function createObsSet() {
	const idx = obsCounter++;
	const gcsPfx = `obsGcs${idx}`;
	const now = new Date();
	const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

	const chips = (key, options) =>
		`<div class="radio-chip-group" style="flex-wrap:wrap;gap:6px;margin-top:4px">` +
		options
			.map(
				([v, l]) =>
					`<button type="button" class="radio-chip" data-obs-key="${key}" data-obs-val="${v}">${l}</button>`,
			)
			.join("") +
		`</div>`;

	const div = document.createElement("div");
	div.className = "obs-set";
	div.dataset.obsIdx = idx;

	div.innerHTML = `
		<div class="obs-set-head">
			<span class="obs-set-label">Obs set</span>
			<input type="time" data-obs-field="time" value="${timeStr}" />
			<button type="button" class="obs-remove">Remove</button>
		</div>

		<div class="obs-vitals-grid">
			<div class="obs-field">
				<label class="obs-label">RR (bpm)</label>
				<input type="number" min="0" max="80" data-obs-field="rr" placeholder="—" />
			</div>
			<div class="obs-field">
				<label class="obs-label">SpO₂ (%)</label>
				<input type="number" min="50" max="100" data-obs-field="spo2" placeholder="—" />
			</div>
			<div class="obs-field">
				<label class="obs-label">Temp (°C)</label>
				<input type="number" min="25" max="45" step="0.1" data-obs-field="temp" placeholder="—" />
			</div>
			<div class="obs-field">
				<label class="obs-label">BM (mmol/L)</label>
				<input type="number" min="0" max="50" step="0.1" data-obs-field="bm" placeholder="—" />
			</div>
			<div class="obs-field">
				<label class="obs-label">Ketones (mmol/L)</label>
				<input type="number" min="0" max="20" step="0.1" data-obs-field="ketones" placeholder="—" />
			</div>
		</div>

		<div class="obs-row-group">
			<label class="obs-label">O₂</label>
			<div class="obs-inline-row">
				${chips("o2", [
					["Air", "Air"],
					["Supplemental", "Supplemental O₂"],
				])}
				<input type="number" min="1" max="15" step="0.5" data-obs-field="o2Flow"
					placeholder="L/min" class="obs-o2-flow hidden" style="width:80px;margin-top:4px" />
			</div>
		</div>

		<div class="obs-row-group">
			<label class="obs-label">HR (bpm)</label>
			<div class="obs-inline-row">
				<input type="number" min="0" max="300" data-obs-field="hr"
					placeholder="—" style="width:90px" />
				${chips("hrRhythm", [
					["Regular", "Regular"],
					["Irregular", "Irregular"],
				])}
			</div>
		</div>

		<div class="obs-row-group">
			<label class="obs-label">BP (mmHg)</label>
			<div class="obs-inline-row" style="flex-wrap:wrap;gap:6px;align-items:center">
				<input type="number" min="0" max="300" data-obs-field="sbp"
					placeholder="Systolic" style="width:100px" />
				<span style="color:var(--text-secondary);font-weight:600">/</span>
				<input type="number" min="0" max="200" data-obs-field="dbp"
					placeholder="Diastolic" style="width:100px" />
				${chips("bpPos", [
					["Lying", "Lying"],
					["Sitting", "Sitting"],
					["Standing", "Standing"],
				])}
				${chips("bpArm", [
					["L", "L arm"],
					["R", "R arm"],
				])}
			</div>
		</div>

		<div class="obs-row-group">
			<label class="obs-label">AVPU</label>
			${chips("avpu", [
				["A", "A — Alert"],
				["C", "C — Confusion"],
				["V", "V — Voice"],
				["P", "P — Pain"],
				["U", "U — Unresponsive"],
			])}
		</div>

		<div class="obs-row-group">
			${window.CrewMateGcs.buildGcsCalcHTML(gcsPfx)}
		</div>

		<div class="obs-news2">
			<span class="news2-label">NEWS2</span>
			<span class="news2-score">–</span>
			<span class="news2-risk"></span>
		</div>`;

	div.querySelector(".obs-remove").addEventListener("click", () => {
		div.remove();
		updateObsSetNumbers();
	});

	div.addEventListener("click", (e) => {
		const chip = e.target.closest("[data-obs-key]");
		if (!chip) return;
		const key = chip.dataset.obsKey;
		const wasSelected = chip.classList.contains("selected");
		div
			.querySelectorAll(`[data-obs-key="${key}"]`)
			.forEach((c) => c.classList.remove("selected"));
		if (!wasSelected) chip.classList.add("selected");
		if (key === "o2") {
			const supplementalActive =
				!wasSelected && chip.dataset.obsVal === "Supplemental";
			div
				.querySelector(".obs-o2-flow")
				?.classList.toggle("hidden", !supplementalActive);
		}
		updateObsNewsScore(div);
	});

	div.querySelectorAll("input").forEach((el) => {
		el.addEventListener("input", () => updateObsNewsScore(div));
	});

	return div;
}

function updateObsSetNumbers() {
	$$(".obs-set").forEach((set, i) => {
		const label = set.querySelector(".obs-set-label");
		if (label) label.textContent = `Obs set ${i + 1}`;
	});
}

function initLegacyObsRecorder() {
	if (_obsRecInited) return;
	_obsRecInited = true;

	const container = $("#obsRecContainer");
	if (container && container.children.length === 0) {
		container.append(createObsSet());
		updateObsSetNumbers();
	}

	$("#addObsRecBtn")?.addEventListener("click", () => {
		$("#obsRecContainer")?.append(createObsSet());
		updateObsSetNumbers();
	});
}

export function initObsRecorder() {
	document.addEventListener("crewmate:show-obs-recorder", () => {
		initLegacyObsRecorder();
	});
}

window.CrewMateObsRecorder = {
	createObsSet,
	updateObsSetNumbers,
	updateObsNewsScore,
};
