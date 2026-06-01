import { initTheme } from "./features/theme.js";
import { initRespCounter } from "./features/respCounter.js";
import { initNewsScore } from "./features/news2.js";
import { initDrugFinder } from "./features/drugFinder.js";
import { initDashboard } from "./features/dashboard.js";

document.addEventListener("DOMContentLoaded", () => {
	initTheme();
	initDashboard();
	initRespCounter();
	initNewsScore();
	initDrugFinder();
});
