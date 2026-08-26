import { describe, expect, it } from "vitest";
import { isMarketOpen, rankStandings, sharedAvailableDays } from "../lib/league-rules";

describe("UFA League operating rules", () => {
  it("proposes every unique shared available day without a time parameter", () => {
    expect(sharedAvailableDays(["2026-09-03", "2026-09-05", "2026-09-05"], ["2026-09-01", "2026-09-05", "2026-09-03"])).toEqual(["2026-09-03", "2026-09-05"]);
  });

  it("ranks competitive standings by points, goal difference, then goals scored", () => {
    const ranked = rankStandings([
      { teamId: "a", points: 6, goalDifference: 2, goalsFor: 5 },
      { teamId: "b", points: 6, goalDifference: 2, goalsFor: 7 },
      { teamId: "c", points: 7, goalDifference: -1, goalsFor: 3 },
    ]);
    expect(ranked.map(team => team.teamId)).toEqual(["c", "b", "a"]);
  });

  it("keeps the transfer market closed until both administrators approve it", () => {
    expect(isMarketOpen(true, false)).toBe(false);
    expect(isMarketOpen(false, true)).toBe(false);
    expect(isMarketOpen(true, true)).toBe(true);
  });
});
