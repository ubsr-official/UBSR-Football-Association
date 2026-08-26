import { describe, expect, it } from "vitest";
import { canAccessPrivateTeam, resolveMarketSettings, validateAuctionOutcome } from "./leagueRules";

describe("league rules", () => {
  it("keeps the market closed until the owner and Arish have both approved it", () => {
    const ownerOnly = resolveMarketSettings({ ownerEnabled: false, arishEnabled: false }, "owner", true);
    expect(ownerOnly).toEqual({ ownerEnabled: true, arishEnabled: false, isOpen: false });
    const jointlyOpen = resolveMarketSettings(ownerOnly, "arish", true);
    expect(jointlyOpen).toEqual({ ownerEnabled: true, arishEnabled: true, isOpen: true });
    expect(resolveMarketSettings(jointlyOpen, "owner", false).isOpen).toBe(false);
  });

  it("requires buyer and final bought price for a sold auction record", () => {
    expect(validateAuctionOutcome({ status: "sold", buyerManagerId: null, finalBoughtPrice: null })).toBe("Sold records require a buyer and final bought price.");
    expect(validateAuctionOutcome({ status: "sold", buyerManagerId: 2, finalBoughtPrice: 480 })).toBeNull();
    expect(validateAuctionOutcome({ status: "unsold", buyerManagerId: 2, finalBoughtPrice: 480 })).toBe("Only sold records may include a buyer or final bought price.");
  });

  it("separates private team chat from public trade discussions", () => {
    expect(canAccessPrivateTeam(true, false)).toBe(true);
    expect(canAccessPrivateTeam(false, true)).toBe(true);
    expect(canAccessPrivateTeam(false, false)).toBe(false);
  });
});
