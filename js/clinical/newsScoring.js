export const NEWS_GUIDANCE = {
	LOW: ["Score 0 — Very Low Risk", "Score 1–4 — Low Risk"],
	MEDIUM: ["Score 3 in single parameter", "Score 5–6 — Medium Risk"],
	HIGH: "Score ≥7 — High Risk",
};

export const NEWS_PARAM_LABELS = {
	rr: "Resp Rate",
	spo2: "SpO₂",
	o2: "O₂",
	sbp: "Systolic BP",
	hr: "Pulse",
	cons: "Consciousness",
	temp: "Temp",
};

function getRisk(score, hasThree) {
	return score >= 7 ? "HIGH" : score >= 5 || hasThree ? "MEDIUM" : "LOW";
}

export function getNewsGuidance(score, risk, hasThree) {
	if (risk === "HIGH") return NEWS_GUIDANCE.HIGH;
	if (risk === "MEDIUM") {
		return hasThree && score < 5
			? NEWS_GUIDANCE.MEDIUM[0]
			: NEWS_GUIDANCE.MEDIUM[1];
	}
	return score === 0 ? NEWS_GUIDANCE.LOW[0] : NEWS_GUIDANCE.LOW[1];
}

export function getNewsRisk(score, hasThree) {
	return getRisk(score, hasThree);
}

export function calculateNewsScoreFromValues({
	rr,
	spo2,
	o2On,
	sbp,
	hr,
	temp,
	avpu,
}) {
	let score = 0;
	let hasThree = false;

	const add = (value) => {
		score += value;
		if (value === 3) hasThree = true;
	};

	if (!Number.isNaN(rr)) {
		add(rr <= 8 ? 3 : rr <= 11 ? 1 : rr <= 20 ? 0 : rr <= 24 ? 2 : 3);
	}
	if (!Number.isNaN(spo2)) {
		add(spo2 <= 91 ? 3 : spo2 <= 93 ? 2 : spo2 <= 95 ? 1 : 0);
	}
	if (o2On) add(2);
	if (!Number.isNaN(sbp)) {
		add(sbp <= 90 ? 3 : sbp <= 100 ? 2 : sbp <= 110 ? 1 : sbp <= 219 ? 0 : 3);
	}
	if (!Number.isNaN(hr)) {
		add(
			hr <= 40
				? 3
				: hr <= 50
					? 1
					: hr <= 90
						? 0
						: hr <= 110
							? 1
							: hr <= 130
								? 2
								: 3,
		);
	}
	if (!Number.isNaN(temp)) {
		add(temp <= 35.0 ? 3 : temp <= 36.0 ? 1 : temp <= 38.0 ? 0 : temp <= 39.0 ? 1 : 2);
	}
	if (avpu && avpu !== "A") add(3);

	return {
		score,
		risk: getRisk(score, hasThree),
		hasThree,
	};
}

window.CrewMateNewsScore = {
	calculateNewsScoreFromValues,
	getNewsGuidance,
	getNewsRisk,
};
