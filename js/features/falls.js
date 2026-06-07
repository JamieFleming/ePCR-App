import { $, val, isChecked, populateChipGroup } from "../utils/dom.js";
import { OPTIONS } from "../data/options.js";
import { formatSet, listFactors } from "../utils/helpers.js";
import { state } from "../app.js";

function populateFallsPrevCountChips() {
	populateChipGroup("fallsPreviousCount", OPTIONS.falls.previousCount);
}

function populateFallsLocChips() {
	populateChipGroup("fallsLOC", OPTIONS.falls.loc);
}

function populateFallsWitnessedChips() {
	populateChipGroup("fallsWitnessed", OPTIONS.falls.witnessed);
}

function populateFallsLieTimeChips() {
	populateChipGroup("fallsLieTime", OPTIONS.falls.lieTime);
}

function populateFallsAnticoagChips() {
	populateChipGroup("fallsAnticoag", OPTIONS.falls.anticoagulated);
}

function buildFallsText() {
	const symptoms = listFactors(
		state.fallsSymptoms,
		"fallsSymptomsOther",
		"Not Documented",
	);
	const loc = listFactors(
		state.fallsLocation,
		"fallsLocationOther",
		"Not documented",
	);
	const surface = val("fallsSurface");
	const activity = listFactors(
		state.fallsActivity,
		"fallsActivityOther",
		"Not documented",
	);
	const timeUnknown = $("#fallsTimeUnknownBtn")?.classList.contains("selected");
	const time = timeUnknown
		? "Unknown time"
		: val("fallsTime") || "Not documented";
	const lieTime = val("fallsLieTime") || "Unknown";
	const injuries = formatSet(state.fallsInjuries, "No injury documented");
	const prevCount = val("fallsPreviousCount") || "Not asked";
	const locLine = [loc, surface ? `(${surface})` : ""]
		.filter(Boolean)
		.join(" ");
	const longLie = ["1–2 hours", "2–4 hours", "4–8 hours", "> 8 hours"].includes(
		lieTime,
	);
	return [
		(() => {
			const locRaw = val("fallsLOC");
			const locText = locRaw === "Unknown" ? "Unknown LOC" : locRaw;
			const witnessed = val("fallsWitnessed");
			return `S — Symptoms: ${symptoms}. ${locText ? `${locText}.` : ""} ${witnessed ? `${witnessed}.` : ""}`.trim();
		})(),
		`P — Previous falls: ${prevCount}.${isChecked("fallsPreviousInjury") ? " Previous fall-related injury." : ""}`,
		`L — Location: ${locLine}.`,
		`A — Activity: ${activity}.`,
		`T — Time: ${time}. On floor: ${lieTime}.${longLie ? " Long lie." : ""}`,
		`T — Trauma: ${injuries}.${val("fallsAnticoag") ? ` ${val("fallsAnticoag")}.` : ""}`,
		...(val("fallsNotes") ? [`Notes: ${val("fallsNotes")}`] : []),
	].join("\n");
}

const CFS_LEVELS = [
	{
		score: 1,
		label: "Very Fit",
		colour: "#1b5e20",
		description:
			"Robust, active, energetic and motivated. Exercise regularly. Among the fittest for their age.",
	},
	{
		score: 2,
		label: "Well",
		colour: "#2e7d32",
		description:
			"No active disease symptoms but less fit than level 1. Exercises or is very active occasionally.",
	},
	{
		score: 3,
		label: "Managing Well",
		colour: "#558b2f",
		description:
			"Medical problems well controlled. Not regularly active beyond routine walking.",
	},
	{
		score: 4,
		label: "Very Mild Frailty",
		colour: "#f57f17",
		description:
			"Not dependent on others. Symptoms often limit activity. Slowed up and may tire more easily.",
	},
	{
		score: 5,
		label: "Mild Frailty",
		colour: "#ef6c00",
		description:
			"More evident slowing. Need help with high-order IADLs — finances, transport, heavy housework, medications.",
	},
	{
		score: 6,
		label: "Moderate Frailty",
		colour: "#e65100",
		description:
			"Need help with all outside activities and keeping house. Trouble with stairs. May need help with bathing/dressing.",
	},
	{
		score: 7,
		label: "Severe Frailty",
		colour: "#c62828",
		description:
			"Completely dependent for personal care. Stable — not at high risk of dying within 6 months.",
	},
	{
		score: 8,
		label: "Very Severe Frailty",
		colour: "#b71c1c",
		description:
			"Completely dependent, approaching end of life. Cannot recover even from a minor illness.",
	},
	{
		score: 9,
		label: "Terminally Ill",
		colour: "#4a148c",
		description:
			"Life expectancy less than 6 months. Not otherwise evidently frail. This category applies even if the person otherwise seems well.",
	},
];

const FALLS_RISK_FACTORS = [
	{
		category: "History",
		items: [
			{ id: "rf_prev_fall", label: "Previous fall in the last 12 months" },
			{ id: "rf_fear", label: "Fear of falling" },
			{ id: "rf_near_miss", label: "Near miss / almost fell" },
		],
	},
	{
		category: "Medications",
		items: [
			{ id: "rf_poly", label: "Polypharmacy (4 or more medications)" },
			{
				id: "rf_psycho",
				label: "Psychotropics — sedatives, antidepressants, antipsychotics",
			},
			{ id: "rf_antihyp", label: "Antihypertensives or diuretics" },
			{
				id: "rf_anticoag",
				label: "Anticoagulants (increased bleed risk if falls)",
			},
		],
	},
	{
		category: "Mobility & Balance",
		items: [
			{ id: "rf_gait", label: "Impaired gait or unsteady balance" },
			{ id: "rf_aid", label: "Requires mobility aid" },
			{ id: "rf_legs", label: "Lower limb weakness or pain" },
			{
				id: "rf_postural",
				label: "Postural hypotension — dizziness on standing",
			},
		],
	},
	{
		category: "Cognitive & Sensory",
		items: [
			{ id: "rf_cognitive", label: "Cognitive impairment or dementia" },
			{ id: "rf_vision", label: "Visual impairment" },
			{ id: "rf_continence", label: "Urinary incontinence or urgency" },
		],
	},
	{
		category: "Environment",
		items: [
			{
				id: "rf_hazards",
				label: "Environmental hazards — loose rugs, poor lighting, clutter",
			},
			{ id: "rf_footwear", label: "Inappropriate or unsafe footwear" },
		],
	},
];

function buildFallsGuide() {
	const container = $("#fallsGuideContainer");
	if (!container || container.children.length > 0) return;

	const cfsSection = document.createElement("section");
	cfsSection.className = "section-card";
	cfsSection.style.margin = "16px";
	cfsSection.innerHTML = `
		<div style="padding:12px 16px;border-bottom:1px solid var(--border)">
			<h3 style="margin:0;font-size:15px">Clinical Frailty Scale (CFS)</h3>
			<p style="margin:4px 0 0;font-size:12px;color:var(--text-secondary)">
				Tap a score to select it. Based on the Rockwood Clinical Frailty Scale.
			</p>
		</div>
		<div id="cfsGrid" style="padding:12px 16px;display:grid;grid-template-columns:repeat(3,1fr);gap:8px"></div>
		<div id="cfsResult" class="hidden" style="margin:0 16px 16px;padding:10px 14px;border-radius:8px;font-size:13px"></div>
		<p style="margin:0 16px 12px;font-size:11px;color:var(--text-secondary);font-style:italic">
			Reference: Rockwood K et al. A global clinical measure of fitness and frailty in elderly people. CMAJ 2005.
			Use the CFS to inform care planning — not as a standalone admission decision.
		</p>`;
	container.appendChild(cfsSection);

	const cfsGrid = cfsSection.querySelector("#cfsGrid");
	const cfsResult = cfsSection.querySelector("#cfsResult");
	let selectedCfs = null;

	CFS_LEVELS.forEach(({ score, label, colour, description }) => {
		const card = document.createElement("button");
		card.type = "button";
		card.style.cssText = `
			border:2px solid ${colour};border-radius:8px;padding:8px;text-align:left;
			background:#fff;cursor:pointer;transition:background 0.15s`;
		card.innerHTML = `
			<span style="display:block;font-size:18px;font-weight:700;color:${colour}">${score}</span>
			<span style="display:block;font-size:11px;font-weight:600;color:${colour};line-height:1.2">${label}</span>`;
		card.addEventListener("click", () => {
			cfsGrid
				.querySelectorAll("button")
				.forEach((b) => (b.style.background = "#fff"));
			if (selectedCfs === score) {
				selectedCfs = null;
				cfsResult.classList.add("hidden");
			} else {
				selectedCfs = score;
				card.style.background = colour + "18";
				cfsResult.classList.remove("hidden");
				cfsResult.style.cssText = `margin:0 16px 16px;padding:10px 14px;border-radius:8px;
					font-size:13px;border-left:4px solid ${colour};background:${colour}10`;
				cfsResult.innerHTML = `
					<strong style="color:${colour}">CFS ${score} — ${label}</strong>
					<p style="margin:4px 0 0">${description}</p>`;
			}
		});
		cfsGrid.appendChild(card);
	});

	const riskSection = document.createElement("section");
	riskSection.className = "section-card";
	riskSection.style.margin = "0 16px 16px";
	riskSection.innerHTML = `
		<div style="padding:12px 16px;border-bottom:1px solid var(--border)">
			<h3 style="margin:0;font-size:15px">Falls Risk Factors</h3>
			<p style="margin:4px 0 0;font-size:12px;color:var(--text-secondary)">
				Tap all that apply. Based on NICE guideline CG161 and iSTUMBLE framework.
			</p>
		</div>
		<div id="riskFactors" style="padding:12px 16px"></div>
		<div id="riskResult" style="margin:0 16px 16px;padding:10px 14px;border-radius:8px;background:#f5f5f5;font-size:13px">
			No risk factors selected.
		</div>`;
	container.appendChild(riskSection);

	const riskFactorsEl = riskSection.querySelector("#riskFactors");
	const riskResult = riskSection.querySelector("#riskResult");
	const checked = new Set();

	FALLS_RISK_FACTORS.forEach(({ category, items }) => {
		const catEl = document.createElement("div");
		catEl.style.marginBottom = "14px";
		catEl.innerHTML = `<p class="field-label" style="margin:0 0 6px">${category}</p>`;
		const grid = document.createElement("div");
		grid.className = "square-grid";
		items.forEach(({ id, label }) => {
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "square-btn";
			btn.textContent = label;
			btn.dataset.rfId = id;
			btn.addEventListener("click", () => {
				btn.classList.toggle("selected");
				btn.classList.contains("selected")
					? checked.add(id)
					: checked.delete(id);
				updateRiskResult();
			});
			grid.appendChild(btn);
		});
		catEl.appendChild(grid);
		riskFactorsEl.appendChild(catEl);
	});

	function updateRiskResult() {
		const count = checked.size;
		let level, colour, advice;
		if (count === 0) {
			riskResult.style.cssText =
				"margin:0 16px 16px;padding:10px 14px;border-radius:8px;background:#f5f5f5;font-size:13px";
			riskResult.innerHTML = "No risk factors selected.";
			return;
		} else if (count <= 2) {
			level = "Low risk";
			colour = "#2e7d32";
			advice =
				"Provide falls prevention advice. Consider referral to falls prevention service.";
		} else if (count <= 5) {
			level = "Medium risk";
			colour = "#ef6c00";
			advice =
				"Multifactorial falls risk assessment recommended. Review medications. Referral to falls prevention service.";
		} else {
			level = "High risk";
			colour = "#c62828";
			advice =
				"High falls risk. Multifactorial assessment and urgent review of modifiable risk factors. Consider same-day referral.";
		}
		riskResult.style.cssText = `margin:0 16px 16px;padding:10px 14px;border-radius:8px;
			border-left:4px solid ${colour};background:${colour}10;font-size:13px`;
		riskResult.innerHTML = `
			<strong style="color:${colour}">${level} — ${count} factor${count !== 1 ? "s" : ""} identified</strong>
			<p style="margin:4px 0 0">${advice}</p>`;
	}

	const resourceSection = document.createElement("section");
	resourceSection.className = "section-card";
	resourceSection.style.margin = "0 16px 16px";
	resourceSection.innerHTML = `
		<div style="padding:12px 16px;border-bottom:1px solid var(--border)">
			<h3 style="margin:0;font-size:15px">Resources & Guidance</h3>
		</div>
		<div style="padding:12px 16px;display:grid;gap:10px">
			<div style="padding:10px 12px;border-radius:8px;background:#e3f2fd;border-left:4px solid #1565c0">
				<strong style="font-size:13px;color:#1565c0">iSTUMBLE App</strong>
				<p style="margin:4px 0 0;font-size:12px">
					Falls risk assessment and management tool for healthcare professionals.
					Developed by NHS Greater Glasgow and Clyde.
					Available on the
					<a href="https://apps.apple.com/gb/app/istumble/id892355933" target="_blank" rel="noopener noreferrer" style="color:#1565c0">App Store</a>
					and
					<a href="https://play.google.com/store/apps/details?id=uk.co.nhsggc.istumble" target="_blank" rel="noopener noreferrer" style="color:#1565c0">Google Play</a>.
				</p>
			</div>
			<div style="padding:10px 12px;border-radius:8px;background:#f3e5f5;border-left:4px solid #6a1b9a">
				<strong style="font-size:13px;color:#6a1b9a">NICE Guideline CG161 — Falls in older people</strong>
				<p style="margin:4px 0 0;font-size:12px">
					Assessing and preventing falls in older people. Covers multifactorial risk assessment,
					interventions and referral pathways.<br>
					<a href="https://www.nice.org.uk/guidance/cg161" target="_blank" rel="noopener noreferrer" style="color:#6a1b9a">nice.org.uk/guidance/cg161</a>
				</p>
			</div>
			<div style="padding:10px 12px;border-radius:8px;background:#f3e5f5;border-left:4px solid #6a1b9a">
				<strong style="font-size:13px;color:#6a1b9a">NICE Quality Standard QS86 — Falls in older people</strong>
				<p style="margin:4px 0 0;font-size:12px">
					Quality statements covering fall risk identification and multifactorial assessment.<br>
					<a href="https://www.nice.org.uk/guidance/qs86" target="_blank" rel="noopener noreferrer" style="color:#6a1b9a">nice.org.uk/guidance/qs86</a>
				</p>
			</div>
			<div style="padding:10px 12px;border-radius:8px;background:#e8f5e9;border-left:4px solid #2e7d32">
				<strong style="font-size:13px;color:#2e7d32">Clinical Frailty Scale — Rockwood et al.</strong>
				<p style="margin:4px 0 0;font-size:12px">
					Rockwood K et al. (2005). A global clinical measure of fitness and frailty in elderly people.
					CMAJ 173(5): 489–495.<br>
					The CFS is validated for adults aged 65 and over. Not validated in younger people,
					those with stable long-term disability, or children.<br>
					<a href="https://www.dal.ca/sites/gmr/our-tools/clinical-frailty-scale.html" target="_blank" rel="noopener noreferrer" style="color:#2e7d32">Official CFS resource — Dalhousie University</a>
				</p>
			</div>
			<div style="padding:10px 12px;border-radius:8px;background:#fff3e0;border-left:4px solid #e65100">
				<strong style="font-size:13px;color:#e65100">Further Resources</strong>
				<p style="margin:4px 0 0;font-size:12px">
					• <a href="https://www.ageuk.org.uk/information-advice/health-wellbeing/falls-prevention/" target="_blank" rel="noopener noreferrer" style="color:#e65100">Age UK — Falls prevention advice</a><br>
					• <a href="https://www.nhs.uk/conditions/falls/" target="_blank" rel="noopener noreferrer" style="color:#e65100">NHS — Falls: causes, prevention and what to do</a><br>
					• <a href="https://www.nhsggc.scot/your-health/healthy-living/falls-prevention/" target="_blank" rel="noopener noreferrer" style="color:#e65100">NHSGGC — Falls and frailty programme</a><br>
					• <a href="https://www.rcplondon.ac.uk/projects/outputs/national-hip-fracture-database-annual-report-2023" target="_blank" rel="noopener noreferrer" style="color:#e65100">RCP — National Hip Fracture Database</a>
				</p>
			</div>
		</div>`;
	container.appendChild(resourceSection);
}

export function initFalls() {
	populateFallsPrevCountChips();
	populateFallsLocChips();
	populateFallsWitnessedChips();
	populateFallsLieTimeChips();
	populateFallsAnticoagChips();
	buildFallsGuide();
}

window.CrewMateFalls = { buildFallsText };
