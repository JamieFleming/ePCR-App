import { $, $$ } from "../utils/dom.js";

let _paedsInited = false;
let renderPaedsIvEntries, removePaedsIvEntry;

const paedsOutputSectionTexts = new Map();

const paedsState = {
	sgConcerns: new Set(),
	pIvEntries: [],
	pDrugEntries: [],
	pAirwayInterventions: new Set(),
	pWoundInterventions: new Set(),
	pPositioningInterventions: new Set(),
};

function buildPaedsAbcdent() {
	const root = $("#paedsAbcdentContainer");
	if (!root) return;
	window.CrewMateOptions.PAEDS.abcdent.forEach((section) => {
		const details = document.createElement("details");
		details.className = "section-card";
		if (section.icon) details.dataset.sectionIcon = section.icon;
		details.innerHTML = `
			<summary><span>${section.key} — ${section.title}</span><small>${section.key}</small></summary>
			<div class="section-body">
				<div class="square-grid pabc-grid"></div>
				<div class="vital-grid"></div>
				<label class="field-label" for="${section.notes}">Notes</label>
				<input id="${section.notes}" type="text" />
			</div>`;
		const chipRoot = $(".pabc-grid", details);
		section.chips.forEach(([normal, abnormal]) => {
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "square-btn p-abc-chip selected";
			btn.textContent = normal;
			btn.dataset.pAbc = section.key;
			btn.dataset.normal = normal;
			btn.dataset.abnormal = abnormal;
			btn.dataset.abcState = "normal";
			btn.dataset.value = normal;
			chipRoot.append(btn);
		});
		const vitalRoot = $(".vital-grid", details);
		section.vitals.forEach(([id, label, placeholder]) => {
			const box = document.createElement("div");
			box.className = "vital";
			box.innerHTML = `<label for="${id}">${label}</label><input id="${id}" type="text" placeholder="${placeholder}">`;
			vitalRoot.append(box);
		});
		if (!section.vitals.length) vitalRoot.remove();
		root.append(details);
	});
}

function buildPaedsSafeguardingGrid() {
	const grid = $("#pSgGrid");
	if (!grid) return;
	window.CrewMateOptions.PAEDS.safeguarding.forEach((item) => {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "square-btn";
		btn.textContent = item;
		btn.dataset.pSgGroup = "pSafeguarding";
		btn.dataset.pSgValue = item;
		grid.append(btn);
	});
}

function buildPaedsTreatmentSection() {
	const { treatments } = window.CrewMateOptions.PAEDS;
	const { wound } = window.CrewMateOptions.OPTIONS.treatments;

	const buildPaedsTxGrid = (gridId, items, stateKey) => {
		const grid = $(`#${gridId}`);
		if (!grid) return;
		items.forEach((item) => {
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "square-btn";
			btn.textContent = item;
			btn.dataset.ptxGroup = stateKey;
			btn.dataset.ptxValue = item;
			grid.append(btn);
		});
		grid.addEventListener("click", (e) => {
			const btn = e.target.closest("[data-ptx-group]");
			if (!btn) return;
			const key = btn.dataset.ptxGroup;
			const v = btn.dataset.ptxValue;
			const set = paedsState[key];
			if (!set) return;
			if (set.has(v)) {
				set.delete(v);
				btn.classList.remove("selected");
			} else {
				set.add(v);
				btn.classList.add("selected");
			}
		});
	};

	buildPaedsTxGrid("pAirwayGrid", treatments.airway, "pAirwayInterventions");
	buildPaedsTxGrid("pWoundGrid", wound, "pWoundInterventions");
	buildPaedsTxGrid(
		"pPositioningGrid",
		treatments.positioning,
		"pPositioningInterventions",
	);

	$("#pVaType")?.addEventListener("change", () => {
		const type = val("pVaType");
		const isIv = type === "IV Cannula";
		const isIo = type === "IO Access";
		$("#pVaGaugeWrap")?.classList.toggle("hidden", !isIv);
		$("#pVaIvSites")?.classList.toggle("hidden", !isIv);
		$("#pVaIoSites")?.classList.toggle("hidden", !isIo);
		[
			...$$("[data-radio-group='pVaSite'] [data-value]"),
			...$$("[data-radio-group='pVaGauge'] [data-value]"),
		].forEach((c) => c.classList.remove("selected"));
		const siteInp = $("#pVaSite");
		if (siteInp) siteInp.value = "";
		const gaugeInp = $("#pVaGauge");
		if (gaugeInp) gaugeInp.value = "";
	});

	$("#pVaOutcome")?.addEventListener("change", () => {
		const successful = val("pVaOutcome") === "Successful";
		$("#pVaFlushWrap")?.classList.toggle("hidden", !successful);
		if (successful) {
			setRadioChip("pVaFlushed", "Flushed — 5ml NaCl 0.9%");
		} else {
			$$("[data-radio-group='pVaFlushed'] [data-value]").forEach((c) =>
				c.classList.remove("selected"),
			);
			const fi = $("#pVaFlushed");
			if (fi) fi.value = "";
		}
	});

	$("#pAddVaButton")?.addEventListener("click", () => addIvEntry(true));
	$("#pAddDrugButton")?.addEventListener("click", () => addDrugEntry(true));

	$("#pDrugName")?.addEventListener("change", () => {
		const isOther = val("pDrugName") === "Other";
		$("#pDrugNameOther")?.classList.toggle("hidden", !isOther);
		if (!isOther) {
			const o = $("#pDrugNameOther");
			if (o) o.value = "";
		}
	});

	$("#pVaEntries")?.addEventListener("click", (e) => {
		const idx = e.target.dataset.removePva;
		if (idx !== undefined) removePaedsIvEntry(parseInt(idx));
	});
	$("#pDrugEntries")?.addEventListener("click", (e) => {
		const ri = e.target.dataset.removePdrug;
		if (ri !== undefined) removeDrugEntry(parseInt(ri), true);
		const rp = e.target.dataset.repeatPdrug;
		if (rp !== undefined) repeatPaedsDrugEntry(parseInt(rp));
	});
}

function updatePaedsAgeRef() {
	// Read from pAgeYears (the visible field) first, fall back to synced ptAge
	const years = parseInt(val("pAgeYears") || val("ptAge")) || 0;
	const months = parseInt(val("pAgeMonths")) || 0;
	const manualGroup = val("pAgeGroup");
	const { vitalsRef } = window.CrewMateOptions.PAEDS;

	const wt = aplsWeight(years, months);

	// Update the weight field placeholder to show the APLS estimate
	const weightEl = $("#pWeight");
	if (weightEl && !weightEl.value) {
		weightEl.placeholder =
			wt !== null ? `APLS estimate: ≈ ${wt} kg` : "Enter measured weight";
	}

	const aplsStr =
		years === 0 && months === 0
			? "Enter age above to see reference ranges and weight estimate"
			: wt !== null
				? `APLS estimated weight: ≈ ${wt} kg`
				: "Child ≥ 13 yrs — use actual weight";

	const group =
		manualGroup ||
		(years === 0 && months === 0 ? "" : detectAgeGroup(years, months));
	const ref = vitalsRef[group];
	const panel = $("#paedsAgeRefPanel");
	if (!panel) return;

	if (!ref) {
		panel.innerHTML = `<p class="field-hint" style="margin:0">${aplsStr}</p>`;
		return;
	}

	const estimateWarning =
		wt !== null
			? `<div style="margin-top:5px;padding:4px 6px;background:#fff3e0;border:1px solid #ffb74d;border-radius:4px;color:#e65100;font-size:11px">
				⚠ Estimated weight (APLS formula) — use measured weight where possible. Always apply clinical judgement before drug administration.
			</div>`
			: "";

	panel.innerHTML = `
		<div class="pvr-ref-card" style="background:#f0faf0;border:1px solid #a7d7a7;border-radius:6px;padding:8px 10px;font-size:12px">
			<strong style="color:#1b5e20">${ref.label} — Normal Ranges</strong>
			<div class="pvr-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:3px 12px;margin-top:4px">
				<div><span style="color:#555">HR: </span>${ref.hr} bpm</div>
				<div><span style="color:#555">RR: </span>${ref.rr} /min</div>
				<div><span style="color:#555">SBP: </span>${ref.sbp} mmHg</div>
				<div><span style="color:#555">SpO₂: </span>${ref.spo2}%</div>
			</div>
			<div style="margin-top:5px;color:#2e7d32;font-weight:500">${aplsStr}</div>
			${estimateWarning}
			<div style="margin-top:4px;font-style:italic;color:#666">Reference only — assess in clinical context</div>
		</div>`;

	if (!manualGroup && group) setRadioChip("pAgeGroup", group);
}

function updatePaedsWorseningScript() {
	const mode = val("pWorseningMode");
	const scriptWrap = $("#pWorseningScriptWrap");
	const naWrap = $("#pWorseningNaWrap");
	const display = $("#pWorseningScriptDisplay");
	if (!scriptWrap || !naWrap || !display) return;
	const isNa = mode === "na";
	scriptWrap.classList.toggle("hidden", isNa);
	naWrap.classList.toggle("hidden", !isNa);
	if (!isNa) display.textContent = buildPaedsWorseningScript();
}

function bindPaedsEvents() {
	bindRadioChipGroups();

	$("#paedsAbcdentContainer")?.addEventListener("click", (e) => {
		const chip = e.target.closest("[data-p-abc]");
		if (!chip) return;
		const isNormal = chip.dataset.abcState === "normal";
		chip.dataset.abcState = isNormal ? "abnormal" : "normal";
		chip.textContent = isNormal ? chip.dataset.abnormal : chip.dataset.normal;
		chip.classList.toggle("selected", !isNormal);
		chip.classList.toggle("abnormal", isNormal);
	});

	["patAppearanceGrid", "patWobGrid", "patCircGrid"].forEach((gridId) => {
		$(`#${gridId}`)?.addEventListener("click", (e) => {
			const chip = e.target.closest("[data-pat]");
			if (!chip) return;
			const isNormal = chip.dataset.patState === "normal";
			chip.dataset.patState = isNormal ? "abnormal" : "normal";
			chip.textContent = isNormal
				? chip.dataset.patAbnormal
				: chip.dataset.patNormal;
			chip.classList.toggle("selected", !isNormal);
			chip.classList.toggle("abnormal", isNormal);
		});
	});

	// Sync pAgeYears → ptAge so all adult output functions that read ptAge keep working
	$("#pAgeYears")?.addEventListener("input", () => {
		const ptAgeEl = $("#ptAge");
		if (ptAgeEl) ptAgeEl.value = val("pAgeYears");
	});

	// Sex chip handler — updates ptSex so adult output functions keep working
	$("#pSexChips")?.addEventListener("click", (e) => {
		const chip = e.target.closest("[data-psex]");
		if (!chip) return;
		const sex = chip.dataset.psex;
		$$("[data-psex]").forEach((c) => c.classList.remove("selected"));
		chip.classList.add("selected");
		const ptSexEl = $("#ptSex");
		if (ptSexEl) ptSexEl.value = sex;
	});

	["pAgeYears", "pAgeMonths", "pAgeGroup"].forEach((id) => {
		$(`#${id}`)?.addEventListener("change", updatePaedsAgeRef);
		$(`#${id}`)?.addEventListener("input", updatePaedsAgeRef);
	});

	$$("[data-flacc-field]").forEach((row) => {
		row.addEventListener("click", (e) => {
			const chip = e.target.closest(".flacc-chip");
			if (!chip) return;
			const field = row.dataset.flaccField;
			$$(`[data-flacc-field="${field}"] .flacc-chip`).forEach((c) =>
				c.classList.remove("selected"),
			);
			chip.classList.add("selected");
			const inp = $(`#${field}`);
			if (inp) {
				inp.value = chip.dataset.value;
				inp.dispatchEvent(new Event("change"));
			}
		});
	});

	[
		"flaccFace",
		"flaccLegs",
		"flaccActivity",
		"flaccCry",
		"flaccConsolability",
	].forEach((id) => $(`#${id}`)?.addEventListener("change", updateFlaccTotal));

	$("#pPainTool")?.addEventListener("change", () => {
		const tool = val("pPainTool");
		$("#flaccWrap")?.classList.toggle("hidden", tool !== "flacc");
		$("#pNrsWrap")?.classList.toggle("hidden", tool !== "nrs");
		$("#pFacesWrap")?.classList.toggle("hidden", tool !== "faces");
	});

	[
		{ gridId: "pPainScoreGrid", inputId: "pSeverity" },
		{ gridId: "pPainScoreWorstGrid", inputId: "pSeverityWorst" },
	].forEach(({ gridId, inputId }) => {
		$(`#${gridId}`)?.addEventListener("click", (e) => {
			const btn = e.target.closest(".pain-score-btn");
			if (!btn) return;
			const score = btn.dataset.score;
			const already = btn.classList.contains("selected");
			$$(`#${gridId} .pain-score-btn`).forEach((b) =>
				b.classList.remove("selected"),
			);
			if (!already) {
				btn.classList.add("selected");
				const inp = $(`#${inputId}`);
				if (inp) inp.value = `${score}/10`;
			} else {
				const inp = $(`#${inputId}`);
				if (inp) inp.value = "";
			}
		});
	});

	$("#pSgGrid")?.addEventListener("click", (e) => {
		const chip = e.target.closest("[data-p-sg-group]");
		if (!chip) return;
		const v = chip.dataset.pSgValue;
		if (v === "None identified on scene") {
			paedsState.sgConcerns.clear();
			paedsState.sgConcerns.add(v);
		} else {
			paedsState.sgConcerns.delete("None identified on scene");
			paedsState.sgConcerns.has(v)
				? paedsState.sgConcerns.delete(v)
				: paedsState.sgConcerns.add(v);
		}
		$$("#pSgGrid [data-p-sg-group]").forEach((b) => {
			b.classList.toggle(
				"selected",
				paedsState.sgConcerns.has(b.dataset.pSgValue),
			);
		});
		const hasConcerns =
			paedsState.sgConcerns.size > 0 &&
			!paedsState.sgConcerns.has("None identified on scene");
		$("#pSgDetailWrap")?.classList.toggle("hidden", !hasConcerns);
	});

	$("#pConveyDecision")?.addEventListener(
		"change",
		window.CrewMateOutput.handlePConveyanceDisplay,
	);
	$("#pConveyHospital")?.addEventListener(
		"change",
		window.CrewMateOutput.handlePConveyanceDisplay,
	);
	$("#pConveyDepartment")?.addEventListener(
		"change",
		window.CrewMateOutput.handlePConveyanceDisplay,
	);
	window.CrewMateOutput.handlePConveyanceDisplay();

	$("#pConveyTransferGrid")?.addEventListener("click", (e) => {
		const chip = e.target.closest(".p-convey-chip");
		if (chip) toggleConveyChip(chip);
	});

	$("#pPc")?.addEventListener("change", () => {
		const isOther = val("pPc") === "Other";
		$("#pPcOtherWrap")?.classList.toggle("hidden", !isOther);
		updatePaedsWorseningScript();
	});

	$("#pWorseningCustom")?.addEventListener("input", updatePaedsWorseningScript);
	updatePaedsWorseningScript();

	$("#tmtPhase3Grid")?.addEventListener("click", (e) => {
		const chip = e.target.closest(".tmt-chip");
		if (!chip) return;
		chip.classList.toggle("selected");
	});

	$("#pCopyButton")?.addEventListener("click", async () => {
		buildPaedsOutputSections();
		const all = [...paedsOutputSectionTexts.values()]
			.filter(Boolean)
			.join("\n\n");
		if (all) await copyText(all);
	});

	$("#pRefreshButton")?.addEventListener("click", () =>
		buildPaedsOutputSections(),
	);
}

function initPaeds() {
	if (_paedsInited) return;
	_paedsInited = true;

	const em = window.CrewMateApp.makeEntryManager(
		"pIvEntries",
		"pVaEntries",
		(e) => {
			const parts = [e.type];
			if (e.gauge) parts.push(e.gauge);
			if (e.site) parts.push(`— ${e.site}`);
			if (e.outcome) parts.push(`(${e.outcome})`);
			if (e.flushed) parts.push(`• ${e.flushed}`);
			if (e.fluids) parts.push(`+ ${e.fluids}`);
			const desc = parts.join(" ");
			return e.time ? `[${e.time}] ${desc}` : desc;
		},
		"remove-pva",
		paedsState,
	);
	renderPaedsIvEntries = em.render;
	removePaedsIvEntry = em.remove;

	// Hide adult patient card — age and sex are captured in the paeds card
	$("#patientCard")?.classList.add("hidden");

	// Pre-populate from any values already entered in the adult form
	const existingAge = val("ptAge");
	const ageEl = $("#pAgeYears");
	if (existingAge && ageEl) ageEl.value = existingAge;

	const existingSex = val("ptSex");
	if (existingSex) {
		$$("[data-psex]").forEach((c) =>
			c.classList.toggle("selected", c.dataset.psex === existingSex),
		);
	}

	$("#paedsBanner")?.classList.remove("hidden");
	$("#paedsInfoCard")?.removeAttribute("hidden");
	$("#paedsInfoCard")?.classList.remove("hidden");
	$("#paedsAssessmentCard")?.classList.remove("hidden");
	$("#abcdeContainer")?.classList.add("hidden");

	buildPaedsAbcdent();
	buildPaedsSafeguardingGrid();
	buildConveyTransferChips("pConveyTransferGrid", "p-convey-chip");
	buildPaedsTreatmentSection();
	bindPaedsEvents();
	updatePaedsAgeRef();
	updateFlaccTotal();
}

function resetPaeds() {
	_paedsInited = false;
	$("#patientCard")?.classList.remove("hidden");
}

function repeatPaedsDrugEntry(index) {
	const e = paedsState.pDrugEntries[index];
	if (!e) return;
	const now = new Date();
	const hh = String(now.getHours()).padStart(2, "0");
	const mm = String(now.getMinutes()).padStart(2, "0");
	const nameEl = $("#pDrugName");
	if (nameEl) {
		nameEl.value = e.drug;
		nameEl.dispatchEvent(new Event("input"));
	}
	const doseEl = $("#pDrugDose");
	if (doseEl) doseEl.value = e.dose || "";
	const timeEl = $("#pDrugTime");
	if (timeEl) timeEl.value = `${hh}:${mm}`;
	if (e.route) setRadioChip("pDrugRoute", e.route);
	nameEl?.scrollIntoView({ behavior: "smooth", block: "center" });
	nameEl?.focus();
}

// Output text builders

function buildPaedsPatientText() {
	const yrs = val("ptAge");
	const mo = val("pAgeMonths");
	const ageStr =
		[yrs ? `${yrs} years` : null, mo ? `${mo} months` : null]
			.filter(Boolean)
			.join(", ") || "Age not recorded";
	const sex = val("ptSex") || "Sex not recorded";
	const wt =
		val("pWeight") ||
		(aplsWeight(parseInt(yrs) || 0, parseInt(mo) || 0)
			? `≈${aplsWeight(parseInt(yrs) || 0, parseInt(mo) || 0)} kg (APLS estimate)`
			: "Not recorded");
	const group =
		val("pAgeGroup") ||
		detectAgeGroup(parseInt(yrs) || 0, parseInt(mo) || 0) ||
		"";
	const groupLabel =
		window.CrewMateOptions.PAEDS.vitalsRef[group]?.label || group;
	return [
		`Patient: ${ageStr}, ${sex}`,
		`Weight: ${wt}`,
		groupLabel ? `Age group: ${groupLabel}` : null,
	]
		.filter(Boolean)
		.join("\n");
}

function buildPaedsPcText() {
	const lines = [];
	const pcRaw = val("pPc");
	const pc = pcRaw === "Other" ? val("pPcOther") || "Other" : pcRaw;
	const hpc = val("pHpc");
	const onset = val("pOnsetType");
	const duration = val("pOnsetDuration");
	if (pc) lines.push(`Presenting complaint: ${pc}`);
	if (onset || duration)
		lines.push(`Onset: ${[onset, duration].filter(Boolean).join(", ")}`);
	if (hpc) lines.push(`\nHistory:\n${hpc}`);
	return lines.join("\n");
}

function buildPaedsBackgroundText() {
	const lines = [];
	if (isChecked("pNkda")) lines.push("Allergies: NKDA");
	else if (val("pAllergies")) lines.push(`Allergies: ${val("pAllergies")}`);
	if (isChecked("pNoMeds")) lines.push("Medications: None");
	else if (val("pMeds")) lines.push(`Medications: ${val("pMeds")}`);
	if (isChecked("pNoPmh")) lines.push("PMH: None significant");
	else if (val("pPmh")) lines.push(`PMH: ${val("pPmh")}`);
	if (val("pGestation")) lines.push(`Gestation: ${val("pGestation")}`);
	if (val("pBirthHistory"))
		lines.push(`Birth history: ${val("pBirthHistory")}`);
	const imms = val("pImms");
	if (imms && imms !== "Unknown / not checked")
		lines.push(`Immunisations: ${imms}`);
	if (val("pSocial")) lines.push(`Social: ${val("pSocial")}`);
	return lines.join("\n");
}

function buildPaedsPATText() {
	const lines = [];
	["appearance", "wob", "circ"].forEach((component) => {
		const chips = $$(`[data-pat="${component}"]`);
		const abnormal = chips
			.filter((c) => c.dataset.patState === "abnormal")
			.map((c) => c.textContent);
		const label = {
			appearance: "Appearance (TICLS)",
			wob: "Work of Breathing",
			circ: "Circulation to skin",
		}[component];
		lines.push(
			abnormal.length
				? `${label}: ABNORMAL — ${abnormal.join(", ")}`
				: `${label}: Normal`,
		);
	});
	const impression = val("patImpression");
	if (impression) lines.push(`\nOverall PAT impression: ${impression}`);
	return lines.join("\n");
}

function buildPaedsAbcdentText() {
	const lines = [];
	window.CrewMateOptions.PAEDS.abcdent.forEach((section) => {
		const chips = $$(`[data-p-abc="${section.key}"]`);
		if (!chips.length) return;
		const abnormal = chips
			.filter((c) => c.dataset.abcState === "abnormal")
			.map((c) => c.textContent);
		const vitalsText = section.vitals
			.map(([id, label]) => {
				const v = val(id);
				return v ? `${label}: ${v}` : null;
			})
			.filter(Boolean)
			.join(", ");
		const notes = val(section.notes);
		const status = abnormal.length
			? `ABNORMAL — ${abnormal.join(", ")}`
			: "Within normal limits";
		const parts = [`${section.key} — ${section.title}: ${status}`];
		if (vitalsText) parts.push(`  Obs: ${vitalsText}`);
		if (notes) parts.push(`  Notes: ${notes}`);
		lines.push(parts.join("\n"));
	});
	return lines.join("\n");
}

function buildPaedsPainText() {
	const tool = val("pPainTool");
	const lines = [];
	if (tool === "flacc") {
		const total = [
			"flaccFace",
			"flaccLegs",
			"flaccActivity",
			"flaccCry",
			"flaccConsolability",
		].reduce((sum, id) => sum + (parseInt(val(id)) || 0), 0);
		const label =
			total <= 0
				? "No pain"
				: total <= 3
					? "Mild pain"
					: total <= 6
						? "Moderate pain"
						: "Severe pain";
		lines.push(`Pain assessment tool: FLACC`);
		lines.push(`FLACC score: ${total}/10 — ${label}`);
	} else if (tool === "nrs") {
		lines.push(`Pain assessment tool: NRS (self-report)`);
		const now = val("pSeverity");
		const worst = val("pSeverityWorst");
		if (now) lines.push(`Severity now: ${now}`);
		if (worst) lines.push(`Severity at worst: ${worst}`);
	} else if (tool === "faces") {
		const faces = val("pFacesScore");
		lines.push(`Pain assessment tool: Wong-Baker Faces scale`);
		if (faces !== "") lines.push(`Faces score: ${faces}/10`);
	}
	const notes = val("pPainNotes");
	if (notes) lines.push(`Pain notes: ${notes}`);
	return lines.join("\n");
}

function buildPaedsSgText() {
	const concerns = [...paedsState.sgConcerns];
	const lines = [];
	if (concerns.length) lines.push(`Safeguarding: ${concerns.join(", ")}`);
	if (val("pSgDetail")) lines.push(`Detail: ${val("pSgDetail")}`);
	if (isChecked("pSgReferral")) {
		const ref = val("pSgReferralDetail");
		lines.push(`Safeguarding referral made.${ref ? ` ${ref}` : ""}`);
	}
	return lines.join("\n") || "Safeguarding: None identified on scene";
}

function buildPaedsTxText() {
	const lines = [];
	if (paedsState.pAirwayInterventions.size)
		lines.push(
			`Airway / breathing: ${[...paedsState.pAirwayInterventions].join(", ")}`,
		);
	if (paedsState.pIvEntries.length) {
		lines.push("Vascular access:");
		paedsState.pIvEntries.forEach((e) => {
			const parts = [e.type];
			if (e.gauge) parts.push(e.gauge);
			if (e.site) parts.push(`— ${e.site}`);
			if (e.outcome) parts.push(`(${e.outcome})`);
			if (e.flushed) parts.push(`• ${e.flushed}`);
			if (e.fluids) parts.push(`+ ${e.fluids}`);
			lines.push(`  ${parts.join(" ")}`);
		});
	}
	if (paedsState.pDrugEntries.length) {
		lines.push("Medications given:");
		paedsState.pDrugEntries.forEach((e) => {
			const parts = [e.drug];
			if (e.dose) parts.push(e.dose);
			if (e.route) parts.push(`via ${e.route}`);
			if (e.time) parts.push(`at ${e.time}`);
			if (e.response) parts.push(`— ${e.response}`);
			lines.push(`  ${parts.join(" ")}`);
		});
	}
	if (paedsState.pWoundInterventions.size)
		lines.push(
			`Wound management: ${[...paedsState.pWoundInterventions].join(", ")}`,
		);
	if (paedsState.pPositioningInterventions.size)
		lines.push(
			`Positioning: ${[...paedsState.pPositioningInterventions].join(", ")}`,
		);
	if (val("pOtherTx")) lines.push(`Other: ${val("pOtherTx")}`);
	if (val("pTxResponse"))
		lines.push(`Treatment response: ${val("pTxResponse")}`);
	return lines.join("\n");
}

function buildPaedsClinChangesText() {
	const changes = val("pClinChanges");
	return changes ? `Clinical changes during assessment:\n${changes}` : "";
}

function buildPaedsConsentText() {
	const consent = val("pConsentType");
	const notes = val("pConsentNotes");
	const lines = [];
	if (consent) lines.push(`Consent / authority: ${consent}`);
	if (notes) lines.push(`Notes: ${notes}`);
	return lines.join("\n");
}

function buildPaedsConveyText() {
	const decision = val("pConveyDecision");
	const notes = val("pConveyNotes");
	if (decision === "Conveyed") {
		const destination = buildConveyDestination("pConvey");
		const transferText = getConveyTransferText(true);
		const changeDetail = val("pConveyChangeDetail");
		const escalatedDetail = val("pConveyEscalatedDetail");
		const extraDetail = [
			changeDetail ? `Clinical change detail: ${changeDetail}` : null,
			escalatedDetail ? `Escalation of care detail: ${escalatedDetail}` : null,
		]
			.filter(Boolean)
			.join(" ");
		return [
			"Conveyance decision: Patient conveyed to hospital for further assessment and/or treatment.",
			destination
				? `Destination: ${destination}.`
				: "Destination: Not specified.",
			transferText
				? `Transfer and handover: ${transferText}.${extraDetail ? ` ${extraDetail}` : ""}`
				: null,
			val("pConveyTransferNotes")
				? `Transfer / handover notes: ${val("pConveyTransferNotes")}`
				: null,
			notes ? `Additional notes: ${notes}` : null,
		]
			.filter(Boolean)
			.join("\n");
	}
	const checks = [
		isChecked("pRiskExplained") && "risks explained",
		isChecked("pAlternativesDiscussed") && "alternatives discussed",
		isChecked("pUnderstandsRisk") && "parent / carer understands risks",
		isChecked("pCanRecontact") && "advised they can recontact 999/111",
	]
		.filter(Boolean)
		.join("; ");
	const pReferrals = window.CrewMateApp.getPReferrals();
	return `${decision || "Not documented"}. Referred/signposted to: ${listSet(pReferrals, "not documented")}. ${val("pFollowUp") ? val("pFollowUp") + ". " : ""}${checks ? `Safety netting: ${checks}.` : ""}${notes ? " " + notes : ""}`.trim();
}

function buildPaedsWetflagText() {
	const w = val("pWetflagWeight") || val("pWeight");
	const data = calcWetflag(w);
	if (!data) return "";
	return [
		`WETFLAG Reference — ${data.weight}`,
		`W (Weight):    ${data.weight}`,
		`E (Energy):    ${data.energy}`,
		`T (Tube):      ${data.tube}`,
		`F (Fluid):     ${data.fluid}`,
		`L (Lorazepam): ${data.lorazepam}`,
		`A (Adrenaline):${data.adrenaline}`,
		`G (Glucose):   ${data.glucose}`,
		``,
		`Verify with JRCALC Plus before administration.`,
	].join("\n");
}

function buildPaedsWorseningScript() {
	const pc = val("pPc");
	const pcData = window.CrewMateWorsening.PAEDS_WORSENING_PC[pc];
	const conveyed = val("pConveyDecision") === "Conveyed";
	const custom = val("pWorseningCustom");
	const genericLines = window.CrewMateWorsening.PAEDS_WORSENING_GENERIC.map(
		(i) => `• ${i}`,
	).join("\n");

	let script = `"Call 999 immediately if:\n`;
	if (pcData?.call999?.length) {
		script += pcData.call999.map((i) => `• ${i}`).join("\n");
		script += `\n\nAlso call 999 for any of these general warning signs:\n${genericLines}`;
	} else {
		script += genericLines;
	}
	if (pcData?.call111?.length) {
		script += `\n\nCall 111 or see your GP urgently if:\n`;
		script += pcData.call111.map((i) => `• ${i}`).join("\n");
	}
	if (pcData?.guidance)
		script += `\n\nAdditional guidance:\n${pcData.guidance}`;
	if (custom) script += `\n\n${custom}`;
	if (conveyed) {
		script += `\n\nYour child has been taken to hospital today for further assessment and treatment.`;
	} else {
		script += `\n\nIf you are ever unsure whether something is an emergency, always call 999 — it is better to call and check. You can also call 111 for non-emergency advice at any time."`;
	}
	return script;
}

function buildPaedsWorseningText() {
	const mode = val("pWorseningMode");
	if (mode === "na")
		return "Patient conveyed — worsening advice not applicable for this episode.";
	const script = buildPaedsWorseningScript();
	const lines = [script];
	const checks = [
		[
			isChecked("pAdviceUnderstood"),
			"Advice given and confirmed understood by parent / carer",
		],
		[
			isChecked("pFeverAdviceGiven"),
			"Fever / temperature management advice given",
		],
		[isChecked("pFluidAdviceGiven"), "Hydration / feeding advice given"],
		[
			isChecked("pRecontactAdvice"),
			"Parent / carer advised to call 999 / 111 if concerned",
		],
	];
	const confirmed = checks.filter(([c]) => c).map(([, l]) => l);
	if (confirmed.length) lines.push(`\nConfirmed: ${confirmed.join("; ")}`);
	return lines.join("\n");
}

function buildPaedsOutputFromAdultForm() {
	const adultSections = buildOutputSections();
	const withoutPrimary = adultSections.filter((s) => s.id !== "primary");
	const paedsSections = [
		{
			id: "p-patient-info",
			title: "PAEDIATRIC — AGE & WEIGHT",
			body: buildPaedsPatientText(),
		},
		{ id: "p-tmt", title: "3 MINUTE TOOLKIT", body: buildTmtText() },
		{
			id: "p-pat",
			title: "PAT — ACROSS-THE-ROOM ASSESSMENT",
			body: buildPaedsPATText(),
		},
		{
			id: "p-primary",
			title: "PRIMARY SURVEY (ABCDE + ENT + T + DEFG)",
			body: buildPaedsAbcdentText(),
		},
	];
	const bgIdx = withoutPrimary.findIndex((s) => s.id === "background");
	const insertAt = bgIdx >= 0 ? bgIdx + 1 : 0;
	const paedsPainBody = buildPaedsPainText();
	const paedsPainSection = paedsPainBody
		? [{ id: "p-pain", title: "PAIN ASSESSMENT", body: paedsPainBody }]
		: [];
	const withoutPain = withoutPrimary.filter(
		(s) => s.id !== "pain" && !s.id.startsWith("ros-"),
	);
	const result = [
		...withoutPain.slice(0, insertAt),
		...paedsSections,
		...paedsPainSection,
		...withoutPain.slice(insertAt),
	];
	const wf = buildPaedsWetflagText();
	if (wf)
		result.push({ id: "p-wetflag", title: "WETFLAG REFERENCE", body: wf });
	return result;
}

function buildPaedsOutputSections() {
	const container = $("#pOutputSections");
	if (!container) return;
	container.innerHTML = "";
	const sections = [
		{ id: "p-patient", title: "PATIENT", body: buildPaedsPatientText() },
		{ id: "p-pc", title: "PRESENTING COMPLAINT", body: buildPaedsPcText() },
		{
			id: "p-background",
			title: "BACKGROUND",
			body: buildPaedsBackgroundText(),
		},
		{ id: "p-tmt", title: "3 MINUTE TOOLKIT", body: buildTmtText() },
		{ id: "p-pat", title: "PAT — ACROSS-THE-ROOM", body: buildPaedsPATText() },
		{
			id: "p-primary",
			title: "PRIMARY SURVEY (ABCDE + ENT + T + DEFG)",
			body: buildPaedsAbcdentText(),
		},
		{ id: "p-pain", title: "PAIN ASSESSMENT", body: buildPaedsPainText() },
		{ id: "p-sg", title: "SAFEGUARDING", body: buildPaedsSgText() },
		{
			id: "p-tx",
			title: "TREATMENTS & INTERVENTIONS",
			body: buildPaedsTxText(),
		},
		{
			id: "p-changes",
			title: "CLINICAL CHANGES",
			body: buildPaedsClinChangesText(),
		},
		{
			id: "p-consent",
			title: "CONSENT & CAPACITY",
			body: buildPaedsConsentText(),
		},
		{ id: "p-convey", title: "CONVEYANCE", body: buildPaedsConveyText() },
		...(val("pConveyDecision") !== "Conveyed"
			? [
					{
						id: "p-worsening",
						title: "WORSENING ADVICE",
						body: buildPaedsWorseningText(),
					},
				]
			: []),
		...(() => {
			const wf = buildPaedsWetflagText();
			return wf
				? [{ id: "p-wetflag", title: "WETFLAG REFERENCE", body: wf }]
				: [];
		})(),
	];
	paedsOutputSectionTexts.clear();
	sections.forEach(({ id, title, body }) => {
		if (!body || !body.trim()) return;
		paedsOutputSectionTexts.set(id, body);
		const card = document.createElement("article");
		card.className = "output-card";
		card.innerHTML = `<div class="output-card-head"><h3>${title}</h3><button type="button" class="secondary-action" data-p-copy-section="${id}">Copy</button></div>`;
		const pre = document.createElement("pre");
		pre.className = "output-snippet";
		pre.textContent = body;
		card.append(pre);
		card
			.querySelector("[data-p-copy-section]")
			?.addEventListener("click", async () => await copyText(body));
		container.append(card);
	});
}

window.CrewMatePaeds = {
	initPaeds,
	resetPaeds,
	paedsState,
	buildPaedsOutputFromAdultForm,
	buildPaedsOutputSections,
	updatePaedsWorseningScript,
	get removePaedsIvEntry() {
		return removePaedsIvEntry;
	},
	get renderPaedsIvEntries() {
		return renderPaedsIvEntries;
	},
};
