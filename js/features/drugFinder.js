import { $ } from "../utils/dom.js";

export function initDrugFinder() {
	$("#bnfSearchForm")?.addEventListener("submit", (e) => {
		e.preventDefault();

		const query = ($("#bnfSearchInput")?.value || "").trim();
		if (!query) return;

		const url = `https://bnf.nice.org.uk/search/?q=${encodeURIComponent(query)}`;
		window.open(url, "_blank", "noopener,noreferrer");
	});
}
