import "./utils/gcs.js";
import "./data/options.js";
import "./data/worseningAdvice.js";
import "./features/paeds.js";
import { initTheme } from "./features/theme.js";
import { initDashboard } from "./features/dashboard.js";
import { initRespCounter } from "./features/respCounter.js";
import { initNewsScore } from "./features/newsScore.js";
import { initDrugFinder } from "./features/drugFinder.js";
import { initObsRecorder } from "./features/obsRecorder.js";
import { initStrokeCard } from "./features/strokeCard.js";
import { initFalls } from "./features/falls.js";
import { initSeizure } from "./features/seizure.js";

document.addEventListener("DOMContentLoaded", () => {
	initTheme();
	initDashboard();
	initRespCounter();
	initNewsScore();
	initDrugFinder();
	initObsRecorder();
	initStrokeCard();
	initFalls();
	initSeizure();
});
