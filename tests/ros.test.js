import { describe, it, expect, beforeEach } from "vitest";
import { state } from "../js/app.js";
import { rosChipsText, rosAbnormalLine, rosSectionText } from "../js/features/ros.js";

beforeEach(() => {
	state.ros = {};
	state.abdoFindings = {};
	state.urinaryVolumeFeatures = new Set();
	state.urinaryColourFeatures = new Set();
	window.CrewMateAbcde = { buildEcgText: () => "" };
	document.body.innerHTML = "";
});

// ─── rosChipsText ────────────────────────────────────────────────────────────

describe("rosChipsText", () => {
	it("returns each chip on its own line", () => {
		state.ros["resp_breathingRate"] = "normal";
		state.ros["resp_cyanosis"] = "normal";
		const text = rosChipsText("resp");
		const lines = text.split("\n");
		expect(lines.length).toBeGreaterThan(1);
		expect(text).not.toContain(". "); // old join separator must be gone
	});

	it("shows normal label when chip is not flagged", () => {
		state.ros["resp_breathingRate"] = "normal";
		state.ros["resp_cyanosis"] = "normal";
		expect(rosChipsText("resp")).toContain("Respiratory Rate Normal");
		expect(rosChipsText("resp")).toContain("No cyanosis");
	});

	it("shows abnormal label when a chip is flagged", () => {
		state.ros["resp_cyanosis"] = "abnormal";
		expect(rosChipsText("resp")).toContain("Cyanosis present");
		expect(rosChipsText("resp")).not.toContain("No cyanosis");
	});

	it("shows the selected detail value for pulse rate instead of generic label", () => {
		state.ros["cvs_pulseRate"] = "abnormal";
		document.body.innerHTML = '<input id="hrDetail" value="Tachycardic" />';
		expect(rosChipsText("cvs")).toContain("Tachycardic");
		expect(rosChipsText("cvs")).not.toContain("Tachycardic / Bradycardic");
	});

	it("falls back to generic label when pulse rate is abnormal but no detail selected", () => {
		state.ros["cvs_pulseRate"] = "abnormal";
		document.body.innerHTML = '<input id="hrDetail" value="" />';
		expect(rosChipsText("cvs")).toContain("Tachycardic / Bradycardic");
	});

	it("shows the selected detail value for breathing rate instead of generic label", () => {
		state.ros["resp_breathingRate"] = "abnormal";
		document.body.innerHTML = '<input id="rrDetail" value="Tachypnoea" />';
		expect(rosChipsText("resp")).toContain("Tachypnoea");
		expect(rosChipsText("resp")).not.toContain("Respiratory Rate Abnormal");
	});
});

// ─── rosAbnormalLine ─────────────────────────────────────────────────────────

describe("rosAbnormalLine", () => {
	it("returns an empty string when all chips are normal", () => {
		expect(rosAbnormalLine("resp")).toBe("");
	});

	it("returns only the abnormal item", () => {
		state.ros["resp_cyanosis"] = "abnormal";
		const result = rosAbnormalLine("resp");
		expect(result).toContain("Cyanosis present");
		expect(result).not.toContain("Respiratory Rate Normal");
	});

	it("joins multiple abnormal items with newlines", () => {
		state.ros["resp_cyanosis"] = "abnormal";
		state.ros["resp_wheeze"] = "abnormal";
		const lines = rosAbnormalLine("resp").split("\n");
		expect(lines).toHaveLength(2);
		expect(lines).toContain("Cyanosis present");
		expect(lines).toContain("Wheeze noted");
	});

	it("uses detail value in the abnormal line for pulse rate", () => {
		state.ros["cvs_pulseRate"] = "abnormal";
		document.body.innerHTML = '<input id="hrDetail" value="Bradycardic" />';
		expect(rosAbnormalLine("cvs")).toContain("Bradycardic");
		expect(rosAbnormalLine("cvs")).not.toContain("Tachycardic / Bradycardic");
	});
});

// ─── rosSectionText — extras on a new line ───────────────────────────────────

describe("rosSectionText extras on new line", () => {
	it("puts auscultation on its own line, not the same line as the last chip", () => {
		document.body.innerHTML = '<input id="respAus" value="Clear bilateral" />';
		const lines = rosSectionText("resp").split("\n");
		const auscIdx = lines.findIndex((l) => l.includes("Auscultation"));
		const lastChipIdx = lines.length - (lines.some((l) => l.includes("Auscultation")) ? 2 : 1);
		expect(auscIdx).toBeGreaterThan(0);
		expect(lines[0]).not.toContain("Auscultation");
	});

	it("puts blood pressure on its own line after CVS chips", () => {
		document.body.innerHTML = '<input id="bpStatus" value="Hypertensive" />';
		const lines = rosSectionText("cvs").split("\n");
		const bpIdx = lines.findIndex((l) => l.includes("Hypertensive"));
		expect(bpIdx).toBeGreaterThan(0);
		expect(lines[0]).not.toContain("Hypertensive");
	});

	it("puts ECG text on its own line after CVS chips", () => {
		window.CrewMateAbcde = { buildEcgText: () => "ECG: Sinus rhythm." };
		const lines = rosSectionText("cvs").split("\n");
		const ecgIdx = lines.findIndex((l) => l.includes("ECG:"));
		expect(ecgIdx).toBeGreaterThan(0);
		expect(lines[0]).not.toContain("ECG:");
	});

	it("does not add a trailing newline when there are no extras", () => {
		const text = rosSectionText("msk");
		expect(text.endsWith("\n")).toBe(false);
	});

	it("does not add a trailing newline when extras are all empty", () => {
		// no DOM elements set up, so val() returns "" for everything
		const text = rosSectionText("cvs");
		expect(text.endsWith("\n")).toBe(false);
	});
});
