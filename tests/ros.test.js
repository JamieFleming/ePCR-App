import { describe, it, expect, beforeEach } from "vitest";
import { state } from "../js/app.js";
import { rosChipsText } from "../js/features/ros.js";

beforeEach(() => {
	// reset all resp chips to normal before each test
	Object.keys(state.ros)
		.filter((k) => k.startsWith("resp_"))
		.forEach((k) => (state.ros[k] = "normal"));
});

it("shows abnormal when cyanosis flagged", () => {
	state.ros["resp_cyanosis"] = "abnormal";
	expect(rosChipsText("resp")).toContain("Cyanosis present");
});
