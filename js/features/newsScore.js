import { $, $$ } from "../utils/dom.js";
import {
	NEWS_PARAM_LABELS,
	getNewsGuidance,
	getNewsRisk,
} from "../clinical/newsScoring.js";

let _newsScoreInited = false;
let _newsScale = 1;

export function initNewsScore() {
	if (_newsScoreInited) return;
	_newsScoreInited = true;
	_newsScale = 1;

	$$("[data-n2-scale]", $("#news-tool")).forEach((btn) => {
		btn.addEventListener("click", () => {
			_newsScale = parseInt(btn.dataset.n2Scale);
			$$("[data-n2-scale]", $("#news-tool")).forEach((b) =>
				b.classList.toggle("selected", b === btn),
			);
			$("#satsScale1")?.classList.toggle("hidden", _newsScale !== 1);
			$("#satsScale2")?.classList.toggle("hidden", _newsScale !== 2);
			$$("[data-n2-param='spo2']", $("#news-tool")).forEach((c) =>
				c.classList.remove("selected"),
			);
			updateNewsScore();
		});
	});

	$$(".news-chip", $("#news-tool")).forEach((chip) => {
		chip.addEventListener("click", () => {
			const param = chip.dataset.n2Param;
			const wasSelected = chip.classList.contains("selected");
			$$(`[data-n2-param="${param}"]`, $("#news-tool")).forEach((c) =>
				c.classList.remove("selected"),
			);
			if (!wasSelected) chip.classList.add("selected");
			updateNewsScore();
		});
	});

	$("#newsReset")?.addEventListener("click", resetNewsScore);

	updateNewsScore();
}

function resetNewsScore() {
	$$(".news-chip", $("#news-tool")).forEach((c) =>
		c.classList.remove("selected"),
	);
	_newsScale = 1;
	$$("[data-n2-scale]", $("#news-tool")).forEach((b) =>
		b.classList.toggle("selected", b.dataset.n2Scale === "1"),
	);
	$("#satsScale1")?.classList.remove("hidden");
	$("#satsScale2")?.classList.add("hidden");
	updateNewsScore();
}

function updateNewsScore() {
	const tool = $("#news-tool");
	if (!tool) return;

	const getParamScore = (param) => {
		const sel = tool.querySelector(`[data-n2-param="${param}"].selected`);
		return sel ? parseInt(sel.dataset.n2Score) : null;
	};

	const params = ["rr", "spo2", "o2", "sbp", "hr", "cons", "temp"];
	const scores = params.map((p) => ({ param: p, score: getParamScore(p) }));
	const selected = scores.filter((s) => s.score !== null);

	const totalEl = $("#newsTotal");
	const riskBannerEl = $("#newsRiskBanner");
	const resultCircle = $("#newsResultCircle");
	const resultRisk = $("#newsResultRisk");
	const resultGuidance = $("#newsResultGuidance");
	const breakdown = $("#newsBreakdown");
	const breakdownGrid = $("#newsBreakdownGrid");

	if (selected.length === 0) {
		if (totalEl) totalEl.textContent = "–";
		if (riskBannerEl) {
			riskBannerEl.textContent = "Select parameters below";
			riskBannerEl.className = "n2-banner-risk";
		}
		if (resultCircle) {
			resultCircle.textContent = "–";
			resultCircle.className = "n2-result-circle";
		}
		if (resultRisk) resultRisk.textContent = "";
		if (resultGuidance)
			resultGuidance.textContent =
				"Complete the parameters above to calculate your NEWS2 score";
		if (breakdown) breakdown.style.display = "none";
		return;
	}

	const total = selected.reduce((sum, s) => sum + s.score, 0);
	const hasThree = selected.some((s) => s.score === 3);
	const risk = getNewsRisk(total, hasThree);
	const guidance = getNewsGuidance(total, risk, hasThree);

	const riskLower = risk.toLowerCase();

	if (totalEl) totalEl.textContent = total;
	if (riskBannerEl) {
		riskBannerEl.textContent = `${risk} — ${guidance}`;
		riskBannerEl.className = `n2-banner-risk news2-${riskLower}`;
	}
	if (resultCircle) {
		resultCircle.textContent = total;
		resultCircle.className = `n2-result-circle n2-circle--${riskLower}`;
	}
	if (resultRisk) {
		resultRisk.textContent = risk;
		resultRisk.className = `n2-result-risk-label n2-risk--${riskLower}`;
	}
	if (resultGuidance) resultGuidance.textContent = guidance;

	if (breakdown && breakdownGrid) {
		breakdownGrid.innerHTML = selected
			.map(
				(s) =>
					`<div class="n2-bd-item">
						<span class="n2-bd-param">${NEWS_PARAM_LABELS[s.param] || s.param}</span>
						<span class="n2-bd-score n2-pts--${s.score}">+${s.score}</span>
					</div>`,
			)
			.join("");
		if (selected.length > 1) {
			breakdownGrid.innerHTML += `<div class="n2-bd-item n2-bd-total">
				<span class="n2-bd-param">Total</span>
				<span class="n2-bd-score n2-pts--${Math.min(total, 3)}">= ${total}</span>
			</div>`;
		}
		breakdown.style.display = "";
	}
}
