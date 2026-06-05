import { $, $$, val, isChecked } from "../utils/dom.js";
import { OPTIONS, ABCDE, ROS } from "../data/options.js";
import { buildGcsCalcHTML } from "../utils/gcs.js";
import { state } from "../app.js";

function buildRos() {
	const root = $("#rosContainer");
	Object.entries(ROS).forEach(([key, section], index) => {
		if (!section?.items) return;
		const details = document.createElement("details");
		details.className = "section-card";

		details.innerHTML = `<summary><span>${section.title}</span><small id="badge-${key}" class="status-pill">All normal</small></summary><div class="section-body"><div class="square-grid ros-grid"></div>${section.extras || ""}</div>`;
		if (key === "mh") {
			details.id = "ros-mh-section";
			details.classList.add("hidden");
		}
		const grid = $(".ros-grid", details);
		section.items.forEach(([id, normal, abnormal]) => {
			const stateId = `${key}_${id}`;
			state.ros[stateId] = "normal";
			const button = document.createElement("button");
			button.type = "button";
			button.className = "square-btn ros-chip selected";
			button.textContent = normal;
			button.dataset.section = key;
			button.dataset.stateId = stateId;
			button.dataset.normal = normal;
			button.dataset.abnormal = abnormal;
			grid.append(button);
		});
		if (key === "neuro") {
			const wrap = $(".ros-gcs-wrap", details);
			if (wrap) wrap.innerHTML = buildGcsCalcHTML("rosGcs");
		}
		root.append(details);
	});
}

function toggleRos(button) {
	const isAbnormal = state.ros[button.dataset.stateId] === "abnormal";
	const next = isAbnormal ? "normal" : "abnormal";
	state.ros[button.dataset.stateId] = next;
	button.classList.toggle("abnormal", !isAbnormal);
	button.classList.toggle("selected", isAbnormal);
	button.textContent = isAbnormal
		? button.dataset.normal
		: button.dataset.abnormal;
	updateRosBadge(button.dataset.section);

	if (button.dataset.stateId === "neuro_fast") {
		const card = $("#strokeAssessmentCard");
		if (card) card.classList.toggle("hidden", next === "normal");
	}

	if (button.dataset.stateId === "resp_breathingRate") {
		const wrap = $("#rrDetailWrap");
		if (wrap) {
			wrap.classList.toggle("hidden", next === "normal");
			if (next === "normal") {
				const hidden = $("#rrDetail");
				if (hidden) hidden.value = "";
				wrap
					.querySelectorAll("[data-value]")
					.forEach((c) => c.classList.remove("selected"));
			}
		}
	}

	if (button.dataset.stateId === "urine_volume") {
		const wrap = $("#urinaryVolumeWrap");
		if (wrap) {
			wrap.classList.toggle("hidden", next === "normal");
			if (next === "normal") {
				state.urinaryVolumeFeatures.clear();
				wrap
					.querySelectorAll(".square-btn")
					.forEach((b) => b.classList.remove("selected"));
			}
		}
	}

	if (button.dataset.stateId === "urine_colour") {
		const wrap = $("#urinaryColourWrap");
		if (wrap) {
			wrap.classList.toggle("hidden", next === "normal");
			if (next === "normal") {
				state.urinaryColourFeatures.clear();
				wrap
					.querySelectorAll(".square-btn")
					.forEach((b) => b.classList.remove("selected"));
			}
		}
	}
}

function rosAbnormalLine(section) {
	const abnormals = ROS[section].items
		.filter(([id]) => state.ros[`${section}_${id}`] === "abnormal")
		.map(([id, , abnormal]) => {
			if (section === "resp" && id === "breathingRate") {
				const detail = val("rrDetail");
				if (detail) return detail;
			}
			return abnormal;
		});
	return abnormals.length ? abnormals.join(". ") + "." : "";
}

function rosSectionText(section, abnormalOnly = false) {
	const extras = {
		resp: () =>
			`${val("coughType")}${val("sputumDesc") ? ` — sputum: ${val("sputumDesc")}` : ""}. ${val("respAus") ? `Auscultation: ${val("respAus")}.` : ""} ${val("respNotes")}`.trim(),
		cvs: () =>
			`${val("bpStatus")}. ${window.CrewMateAbcde.buildEcgText()} ${val("cvsNotes")}`.trim(),
		gi: () => {
			const parts = [];
			const abdoEntries = Object.entries(state.abdoFindings).filter(
				([, f]) => f.size > 0,
			);
			if (abdoEntries.length)
				parts.push(
					`Palpation: ${abdoEntries.map(([r, f]) => `${r} — ${[...f].join(", ")}`).join("; ")}.`,
				);
			if (val("giFluidIntake"))
				parts.push(`Fluid intake: ${val("giFluidIntake")}.`);
			if (val("giAppetite")) parts.push(`Appetite: ${val("giAppetite")}.`);
			if (val("bowelSounds"))
				parts.push(`Bowel sounds: ${val("bowelSounds")}.`);
			if (val("giNotes")) parts.push(val("giNotes"));
			if (isChecked("stomaPresent")) {
				const type = val("stomaType");
				const out = val("stomaOutput");
				const app = val("stomaAppearance");
				parts.push(
					`Stoma present${type ? ` (${type})` : ""}.${out ? ` Output: ${out}.` : ""}${app ? ` Appearance: ${app}.` : ""}`,
				);
			}
			return parts.join(" ");
		},
		urine: () => {
			const parts = [];
			if (state.urinaryVolumeFeatures.size)
				parts.push(
					`Volume change — features: ${[...state.urinaryVolumeFeatures].join(", ")}.`,
				);
			if (state.urinaryColourFeatures.size)
				parts.push(
					`Colour/appearance: ${[...state.urinaryColourFeatures].join(", ")}.`,
				);
			if (isChecked("catheterPresent")) {
				const out = val("catheterOutput");
				const app = val("urineAppearance");
				parts.push(
					`Urinary catheter in situ.${out ? ` Output: ${out}.` : ""}${app ? ` Appearance: ${app}.` : ""}`,
				);
			}
			if (val("urineNotes")) parts.push(val("urineNotes"));
			return parts.join(" ");
		},
		mh: () => {
			const parts = [];
			if (val("psychBehaviour"))
				parts.push(`Appearance/behaviour: ${val("psychBehaviour")}.`);
			if (val("psychSpeech")) parts.push(`Speech: ${val("psychSpeech")}.`);
			if (val("psychRisk")) parts.push(`Risk level: ${val("psychRisk")}.`);
			if (val("psychProtective"))
				parts.push(`Protective factors: ${val("psychProtective")}.`);
			if (val("psychNotes")) parts.push(val("psychNotes"));
			return parts.join(" ");
		},
	};
	const chipLine = abnormalOnly
		? rosAbnormalLine(section)
		: rosChipsText(section);
	return `${chipLine} ${extras[section]?.() || val(`${section}Notes`) || ""}`.trim();
}

function updateRosBadge(section) {
	const hasAbnormal = Object.entries(state.ros).some(
		([key, value]) => key.startsWith(`${section}_`) && value === "abnormal",
	);
	const badge = $(`#badge-${section}`);
	badge.textContent = hasAbnormal ? "Findings" : "All normal";
	badge.classList.toggle("flagged", hasAbnormal);
}

function rosChipsText(section) {
	return (
		ROS[section].items
			.map(([id, normal, abnormal]) => {
				if (state.ros[`${section}_${id}`] !== "abnormal") return normal;
				if (section === "resp" && id === "breathingRate") {
					const detail = val("rrDetail");
					if (detail) return detail;
				}
				return abnormal;
			})
			.join(". ") + "."
	);
}

function abcChipText(button) {
	if (
		button.dataset.normal === "Good colour" &&
		button.dataset.abcState === "abnormal"
	) {
		const detail = val("colourDetail");
		if (detail) return detail;
	}
	if (
		button.dataset.normal === "Normal Rate" &&
		button.dataset.abcState === "abnormal"
	) {
		const detail = val("hrRateDetail");
		if (detail) return detail;
	}
	return button.textContent;
}

function abcLine(section) {
	const values = $$(`[data-abc="${section.key}"]`).map(abcChipText);
	const vitals = (section.vitals || [])
		.map(([id, label]) => (val(id) ? `${label}: ${val(id)}` : null))
		.filter(Boolean);
	const notes = val(section.notes);
	return `${section.key} - ${[...values, ...vitals, notes].filter(Boolean).join(", ") || "assessed"}.`;
}

function abcCompactLine(section) {
	const abnormals = $$(`[data-abc="${section.key}"]`)
		.filter((b) => b.dataset.abcState === "abnormal")
		.map(abcChipText);
	const notes = val(section.notes);
	const all = [...abnormals, notes].filter(Boolean);
	if (!all.length) return null;
	return `${section.key} — ${all.join(", ")}.`;
}

function abcHandoverSummary() {
	const lines = ABCDE.sections.map(abcCompactLine).filter(Boolean);
	return lines.length ? lines.join("\n") : "No ABCDE concerns identified.";
}

function toggleEcgFinding(btn) {
	const finding = btn.dataset.finding;
	if (finding === "Not performed") {
		state.ecgFindings.clear();
		state.ecgFindings.add("Not performed");
		$$(".ecg-finding").forEach((b) =>
			b.classList.toggle("selected", b.dataset.finding === "Not performed"),
		);
	} else {
		if (state.ecgFindings.has("Not performed")) {
			state.ecgFindings.delete("Not performed");
			$(".ecg-finding[data-finding='Not performed']")?.classList.remove(
				"selected",
			);
		}
		if (state.ecgFindings.has(finding)) {
			state.ecgFindings.delete(finding);
			btn.classList.remove("selected");
		} else {
			state.ecgFindings.add(finding);
			btn.classList.add("selected");
		}
	}
	const hasLeadFinding = [...state.ecgFindings].some((f) =>
		OPTIONS.cardiac.ecgLeadFindings.includes(f),
	);
	$("#ecgLeadPanel")?.classList.toggle("hidden", !hasLeadFinding);
	if (!hasLeadFinding) {
		state.ecgLeads.clear();
		$$(".ecg-lead").forEach((b) => b.classList.remove("selected"));
	}
}

function toggleEcgLead(btn) {
	const lead = btn.dataset.lead;
	if (state.ecgLeads.has(lead)) {
		state.ecgLeads.delete(lead);
		btn.classList.remove("selected");
	} else {
		state.ecgLeads.add(lead);
		btn.classList.add("selected");
	}
}

function generateOe() {
	window.CrewMateAbcde.syncAuscultationOutput();
	const L = ROS.oe_label;
	const oe = [
		"OE:",
		"",
		ABCDE.sections.map(abcLine).join("\n"),
		"",
		`${L.resp}: ${rosChipsText("resp")} ${val("respAus") ? `Auscultation: ${val("respAus")}.` : ""}`,
		`\n`,
		`${L.cvs}: ${rosChipsText("cvs")} ${window.CrewMateAbcde.buildEcgText()}`,
		`\n`,
		`${L.neuro}: ${rosChipsText("neuro")}`,
		`\n`,
		`${L.gi}: ${rosChipsText("gi")} ${[
			Object.entries(state.abdoFindings).filter(([, f]) => f.size > 0).length
				? `Palpation: ${Object.entries(state.abdoFindings)
						.filter(([, f]) => f.size > 0)
						.map(([r, f]) => `${r} — ${[...f].join(", ")}`)
						.join("; ")}.`
				: "",
			val("giFluidIntake") ? `Fluid intake: ${val("giFluidIntake")}.` : "",
			val("giAppetite") ? `Appetite: ${val("giAppetite")}.` : "",
			val("bowelSounds") ? `Bowel sounds: ${val("bowelSounds")}.` : "",
		]
			.filter(Boolean)
			.join(" ")}`.trimEnd(),
		`\n`,
		`${L.urine}: ${rosChipsText("urine")}`,
		`\n`,
		`${L.integ}: ${rosChipsText("integ")}`,
		`\n`,
		`${L.msk}: ${rosChipsText("msk")}`,
		`\n`,
		`${L.mh}: ${rosChipsText("mh")}`,
		`\n`,
	].join("\n");
	$("#oeText").value = oe;
}

export function initRos() {
	buildRos();
	$("#coughType").addEventListener("change", () => {
		$("#sputumWrap")?.classList.toggle(
			"hidden",
			val("coughType") !== "Productive cough present",
		);
	});
}

window.CrewMateRos = {
	toggleRos,
	updateRosBadge,
	rosSectionText,
	generateOe,
	abcLine,
	abcHandoverSummary,
	toggleEcgFinding,
	toggleEcgLead,
};
