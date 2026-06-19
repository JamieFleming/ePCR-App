import "./utils/formInit.js";
import "./features/paeds.js";
import "./features/bodyMap.js";
import { initTheme } from "./features/theme.js";
import { initDashboard } from "./features/dashboard.js";
import { initRespCounter } from "./features/respCounter.js";
import { initNewsScore } from "./features/newsScore.js";
import { initDrugFinder } from "./features/drugFinder.js";
import { initObsRecorder } from "./features/obsRecorder.js";
import { initStrokeCard } from "./features/strokeCard.js";
import { initFalls } from "./features/falls.js";
import { initSeizure } from "./features/seizure.js";
import { initOdAssessment } from "./features/odAssessment.js";
import { initMhAssessment } from "./features/mhAssessment.js";
import { initInjuryAssessment } from "./features/injuryAssessment.js";
import { initTreatment } from "./features/treatment.js";
import { initAbcde } from "./features/abcde.js";
import { initRos } from "./features/ros.js";
import { initCapacity } from "./features/capacity.js";
import { initGynae } from "./features/gynae.js";
import { initSafeguarding } from "./features/safeguarding.js";
import { initOutput } from "./features/output.js";
import { initRedFlags } from "./clinical/redFlags.js";
import { initStorage } from "./utils/storage.js";
import { enhanceSectionCards } from "./app.js";

document.addEventListener("DOMContentLoaded", () => {
	// Move primary survey content from its own panel into the details card in Assessment
	const primaryBody = document.getElementById("primarySurveyBody");
	const panelPrimary = document.getElementById("panel-primary");
	if (primaryBody && panelPrimary) {
		while (panelPrimary.firstChild) primaryBody.appendChild(panelPrimary.firstChild);
		panelPrimary.remove();
	}

	// Move treatment card into the Treatment tab
	const treatmentHost = document.getElementById("treatmentCardHost");
	const treatmentCard = document.getElementById("treatmentCard");
	if (treatmentHost && treatmentCard) {
		treatmentHost.appendChild(treatmentCard);
	}

	initTheme();
	initDashboard();
	initRespCounter();
	initNewsScore();
	initDrugFinder();
	initObsRecorder();
	initStrokeCard();
	initFalls();
	initSeizure();
	initOdAssessment();
	initMhAssessment();
	initInjuryAssessment();
	initTreatment();
	initRos();
	initAbcde();
	initCapacity();
	initGynae();
	initSafeguarding();
	initOutput();
	enhanceSectionCards();
	initRedFlags();
	initStorage();
});
