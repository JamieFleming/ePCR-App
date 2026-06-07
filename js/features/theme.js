const STORAGE_KEY = "crewmate-theme";

function applyTheme(theme, toggle, themeMeta) {
	const root = document.documentElement;
	const isDark = theme === "dark";

	root.setAttribute("data-theme", theme);

	if (toggle) {
		toggle.setAttribute(
			"aria-label",
			isDark ? "Switch to light mode" : "Switch to dark mode",
		);

		toggle.setAttribute("aria-pressed", String(isDark));
	}

	if (themeMeta) {
		themeMeta.setAttribute("content", isDark ? "#0f1720" : "#075985");
	}
}

export function initTheme() {
	const toggle = document.getElementById("themeToggle");
	const themeMeta = document.querySelector('meta[name="theme-color"]');

	const savedTheme = localStorage.getItem(STORAGE_KEY);
	const initialTheme = savedTheme || "light";

	applyTheme(initialTheme, toggle, themeMeta);

	if (toggle) {
		toggle.addEventListener("click", () => {
			const currentTheme =
					document.documentElement.getAttribute("data-theme") || "light";

			const nextTheme = currentTheme === "dark" ? "light" : "dark";

			localStorage.setItem(STORAGE_KEY, nextTheme);

			applyTheme(nextTheme, toggle, themeMeta);
		});
	}
}
