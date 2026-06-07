import { $, val } from "../utils/dom.js";
import { OPTIONS } from "../data/options.js";

const strokeState = {
	strokeFaceFindings: new Set(),
	strokeArmFindings: new Set(),
	strokeSpeechFindings: new Set(),
	strokeEyeFindings: new Set(),
	strokeAssociated: new Set(),
	strokeRiskFactors: new Set(),
};

function bindChipGroup(groupEl, hiddenInput) {
	groupEl.addEventListener("click", (e) => {
		const chip = e.target.closest(".radio-chip");
		if (!chip) return;
		const wasSelected = chip.classList.contains("selected");
		groupEl
			.querySelectorAll(".radio-chip")
			.forEach((c) => c.classList.remove("selected"));
		if (!wasSelected) {
			chip.classList.add("selected");
			hiddenInput.value = chip.dataset.value;
		} else {
			hiddenInput.value = "";
		}
		hiddenInput.dispatchEvent(new Event("change"));
	});
}

function buildStrokeCard() {
	const card = $("#strokeAssessmentCard");
	if (!card) return;
	const body = card.querySelector(".section-body");
	if (!body) return;

	const { stroke } = OPTIONS;

	function row(label, id, items, stateKey) {
		const wrap = document.createElement("div");
		wrap.style.marginTop = "10px";
		const lbl = document.createElement("label");
		lbl.className = "field-label";
		lbl.textContent = label;
		wrap.appendChild(lbl);

		if (stateKey) {
			const grid = document.createElement("div");
			grid.className = "square-grid";
			grid.id = `${id}Grid`;
			grid.style.marginTop = "4px";
			items.forEach((item) => {
				const btn = document.createElement("button");
				btn.type = "button";
				btn.className = "square-btn";
				btn.textContent = item;
				btn.dataset.value = item;
				grid.appendChild(btn);
			});
			grid.addEventListener("click", (e) => {
				const b = e.target.closest(".square-btn");
				if (!b) return;
				b.classList.toggle("selected");
				if (b.classList.contains("selected"))
					strokeState[stateKey].add(b.dataset.value);
				else strokeState[stateKey].delete(b.dataset.value);
			});
			wrap.appendChild(grid);
		} else {
			const hidden = document.createElement("input");
			hidden.type = "hidden";
			hidden.id = id;
			const group = document.createElement("div");
			group.className = "radio-chip-group";
			group.style.marginTop = "4px";
			items.forEach((item) => {
				const [value, chipLabel] = Array.isArray(item) ? item : [item, item];
				const btn = document.createElement("button");
				btn.type = "button";
				btn.className = "radio-chip";
				btn.dataset.value = value;
				btn.textContent = chipLabel;
				group.appendChild(btn);
			});
			bindChipGroup(group, hidden);
			wrap.appendChild(hidden);
			wrap.appendChild(group);
		}
		return wrap;
	}

	function detailBlock(id) {
		const div = document.createElement("div");
		div.id = id;
		div.className = "hidden";
		div.style.cssText =
			"margin-top:8px;padding-left:12px;border-left:3px solid #dbeeff";
		return div;
	}

	// F — Face
	const faceWrap = document.createElement("div");
	faceWrap.innerHTML = `<label class="field-label" style="font-size:13px;font-weight:700;color:#003087">F — Face</label>`;
	faceWrap.appendChild(
		row("Facial symptoms present?", "strokeFace", stroke.yesNoUnknown),
	);
	const faceDetails = detailBlock("strokeFaceDetailsWrap");
	faceDetails.appendChild(
		row(
			"Findings",
			"strokeFaceFindings",
			stroke.faceFindings,
			"strokeFaceFindings",
		),
	);
	faceDetails.appendChild(row("Side affected", "strokeFaceSide", stroke.side));
	faceWrap.appendChild(faceDetails);
	body.appendChild(faceWrap);

	// A — Arms / Legs
	const armWrap = document.createElement("div");
	armWrap.style.marginTop = "14px";
	armWrap.innerHTML = `<label class="field-label" style="font-size:13px;font-weight:700;color:#003087">A — Arms / Legs</label>`;
	armWrap.appendChild(
		row("Motor deficit present?", "strokeArm", stroke.yesNoUnknown),
	);
	const armDetails = detailBlock("strokeArmDetailsWrap");
	armDetails.appendChild(
		row(
			"Findings",
			"strokeArmFindings",
			stroke.armFindings,
			"strokeArmFindings",
		),
	);
	armDetails.appendChild(row("Side affected", "strokeArmSide", stroke.side));
	armWrap.appendChild(armDetails);
	body.appendChild(armWrap);

	// S — Speech
	const speechWrap = document.createElement("div");
	speechWrap.style.marginTop = "14px";
	speechWrap.innerHTML = `<label class="field-label" style="font-size:13px;font-weight:700;color:#003087">S — Speech</label>`;
	speechWrap.appendChild(
		row("Speech difficulty present?", "strokeSpeech", stroke.yesNoUnknown),
	);
	const speechDetails = detailBlock("strokeSpeechDetailsWrap");
	speechDetails.appendChild(
		row(
			"Type",
			"strokeSpeechFindings",
			stroke.speechFindings,
			"strokeSpeechFindings",
		),
	);
	speechWrap.appendChild(speechDetails);
	body.appendChild(speechWrap);

	// E — Eyes
	const eyeWrap = document.createElement("div");
	eyeWrap.style.marginTop = "14px";
	eyeWrap.innerHTML = `<label class="field-label" style="font-size:13px;font-weight:700;color:#003087">E — Eyes</label>`;
	eyeWrap.appendChild(
		row("Visual symptoms present?", "strokeEyes", stroke.yesNoUnknown),
	);
	const eyeDetails = detailBlock("strokeEyesDetailsWrap");
	eyeDetails.appendChild(
		row(
			"Findings",
			"strokeEyeFindings",
			stroke.eyeFindings,
			"strokeEyeFindings",
		),
	);
	eyeDetails.appendChild(row("Side affected", "strokeEyeSide", stroke.side));
	eyeWrap.appendChild(eyeDetails);
	body.appendChild(eyeWrap);

	// T — Time
	const timeWrap = document.createElement("div");
	timeWrap.style.marginTop = "14px";
	timeWrap.innerHTML = `<label class="field-label" style="font-size:13px;font-weight:700;color:#003087">T — Time</label>
		<label class="field-label" style="margin-top:6px">Onset type</label>`;
	const hiddenOnset = document.createElement("input");
	hiddenOnset.type = "hidden";
	hiddenOnset.id = "strokeOnsetType";
	const onsetGroup = document.createElement("div");
	onsetGroup.className = "radio-chip-group";
	onsetGroup.style.marginTop = "4px";
	stroke.onsetType.forEach((item) => {
		const [value, chipLabel] = Array.isArray(item) ? item : [item, item];
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "radio-chip";
		btn.dataset.value = value;
		btn.textContent = chipLabel;
		onsetGroup.appendChild(btn);
	});
	bindChipGroup(onsetGroup, hiddenOnset);
	timeWrap.appendChild(hiddenOnset);
	timeWrap.appendChild(onsetGroup);

	const lastWellDiv = document.createElement("div");
	lastWellDiv.style.marginTop = "8px";
	lastWellDiv.innerHTML = `<label class="field-label">Last known well (time)</label>
		<div style="display:flex;align-items:center;gap:8px;margin-top:4px">
			<input type="time" id="strokeLastWell" style="flex:1" />
			<button type="button" class="radio-chip" id="strokeLastWellUnknownBtn">Unknown</button>
		</div>`;
	timeWrap.appendChild(lastWellDiv);
	body.appendChild(timeWrap);

	// Risk factors
	const riskWrap = document.createElement("div");
	riskWrap.style.marginTop = "14px";
	riskWrap.innerHTML = `<label class="field-label" style="font-size:13px;font-weight:700;color:#003087">Stroke Risk Factors</label>`;
	riskWrap.appendChild(
		row(
			"Risk factors",
			"strokeRiskFactors",
			stroke.riskFactors,
			"strokeRiskFactors",
		),
	);
	body.appendChild(riskWrap);

	// Associated symptoms
	const assocWrap = document.createElement("div");
	assocWrap.style.marginTop = "14px";
	assocWrap.innerHTML = `<label class="field-label" style="font-size:13px;font-weight:700;color:#003087">Associated Symptoms</label>`;
	assocWrap.appendChild(
		row(
			"Symptoms",
			"strokeAssociated",
			stroke.associatedSymptoms,
			"strokeAssociated",
		),
	);
	body.appendChild(assocWrap);

	// Notes
	const notesWrap = document.createElement("div");
	notesWrap.style.marginTop = "12px";
	notesWrap.innerHTML = `<label class="field-label" for="strokeNotes">Additional notes</label>
		<textarea id="strokeNotes" rows="2" style="margin-top:4px"></textarea>`;
	body.appendChild(notesWrap);

	["strokeFace", "strokeArm", "strokeSpeech", "strokeEyes"].forEach((id) => {
		document.getElementById(id)?.addEventListener("change", function () {
			document
				.getElementById(id + "DetailsWrap")
				?.classList.toggle("hidden", this.value !== "Yes");
		});
	});

	const lastWellUnknownBtn = document.getElementById(
		"strokeLastWellUnknownBtn",
	);
	const lastWellInput = document.getElementById("strokeLastWell");
	lastWellUnknownBtn?.addEventListener("click", () => {
		const isUnknown = lastWellUnknownBtn.classList.toggle("selected");
		if (lastWellInput) {
			lastWellInput.disabled = isUnknown;
			lastWellInput.style.opacity = isUnknown ? "0.4" : "";
			if (isUnknown) lastWellInput.value = "";
		}
	});
}

function buildStrokeText() {
	const lines = ["FAST-PASTA STROKE ASSESSMENT"];

	const face = val("strokeFace");
	if (face) {
		const findings = strokeState.strokeFaceFindings.size
			? ` — ${[...strokeState.strokeFaceFindings].join(", ")}`
			: "";
		const side = val("strokeFaceSide") ? ` (${val("strokeFaceSide")})` : "";
		lines.push(`F — Face: ${face}${face === "Yes" ? findings + side : ""}.`);
	}

	const arm = val("strokeArm");
	if (arm) {
		const findings = strokeState.strokeArmFindings.size
			? ` — ${[...strokeState.strokeArmFindings].join(", ")}`
			: "";
		const side = val("strokeArmSide") ? ` (${val("strokeArmSide")})` : "";
		lines.push(`A — Arms/Legs: ${arm}${arm === "Yes" ? findings + side : ""}.`);
	}

	const speech = val("strokeSpeech");
	if (speech) {
		const findings = strokeState.strokeSpeechFindings.size
			? ` — ${[...strokeState.strokeSpeechFindings].join(", ")}`
			: "";
		lines.push(`S — Speech: ${speech}${speech === "Yes" ? findings : ""}.`);
	}

	const eyes = val("strokeEyes");
	if (eyes) {
		const findings = strokeState.strokeEyeFindings.size
			? ` — ${[...strokeState.strokeEyeFindings].join(", ")}`
			: "";
		const side = val("strokeEyeSide") ? ` (${val("strokeEyeSide")})` : "";
		lines.push(`E — Eyes: ${eyes}${eyes === "Yes" ? findings + side : ""}.`);
	}

	const lastWellUnknown = document
		.getElementById("strokeLastWellUnknownBtn")
		?.classList.contains("selected");
	const lastWell = lastWellUnknown ? "Unknown" : val("strokeLastWell");
	const onsetType = val("strokeOnsetType");
	if (onsetType || lastWell) {
		const parts = [];
		if (onsetType) parts.push(`Onset: ${onsetType}`);
		if (lastWell) parts.push(`Last known well: ${lastWell}`);
		lines.push(`T — Time: ${parts.join(" | ")}.`);
	}

	if (strokeState.strokeAssociated.size)
		lines.push(
			`Associated symptoms: ${[...strokeState.strokeAssociated].join(", ")}.`,
		);

	if (strokeState.strokeRiskFactors.size)
		lines.push(
			`Risk factors: ${[...strokeState.strokeRiskFactors].join(", ")}.`,
		);

	const notes = val("strokeNotes");
	if (notes) lines.push(notes);

	return lines.join("\n");
}

export function initStrokeCard() {
	buildStrokeCard();
}

window.CrewMateStroke = {
	strokeState,
	buildStrokeText,
};
