import { describe, it, expect } from "vitest";
import { aplsWeight, calcWetflag } from "../js/features/paeds.js";

describe("aplsWeight", () => {
	it("returns correct weight for a 4 year old", () => {
		expect(aplsWeight(4)).toBe(16);
	});

	it("returns null for adolescent (age > 12)", () => {
		expect(aplsWeight(14)).toBeNull();
	});
});

describe("calcWetflag", () => {
	it("calculates energy dose for a 10kg child", () => {
		const result = calcWetflag(10);
		expect(result.energy).toBe("40 J (4 J/kg)");
	});
});
