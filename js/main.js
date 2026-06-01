import { $, $$, val, isChecked } from "./utils/dom.js";
import { WORSENING_GENERIC, WORSENING_PC } from "./data/worseningAdvice.js";
import { initTheme } from "./features/theme.js";
import { initRespCounter } from "./features/respCounter.js";
import { initNewsScore } from "./features/news2.js";

document.addEventListener("DOMContentLoaded", () => {
	initTheme();
	initRespCounter();
	initNewsScore();
});
