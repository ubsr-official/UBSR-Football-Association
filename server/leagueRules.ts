export type AuctionStatus = "auction_in_progress" | "sold" | "unsold" | "not_called" | "unassigned";

export function validateAuctionOutcome(input: { status: AuctionStatus; buyerManagerId?: number | null; finalBoughtPrice?: number | null }) {
  if (input.status === "sold" && (!input.buyerManagerId || input.finalBoughtPrice === null || input.finalBoughtPrice === undefined)) {
    return "Sold records require a buyer and final bought price.";
  }
  if (input.status !== "sold" && (input.buyerManagerId || input.finalBoughtPrice)) {
    return "Only sold records may include a buyer or final bought price.";
  }
  return null;
}

export function resolveMarketSettings(current: { ownerEnabled: boolean; arishEnabled: boolean }, seat: "owner" | "arish", enabled: boolean) {
  const ownerEnabled = seat === "owner" ? enabled : current.ownerEnabled;
  const arishEnabled = seat === "arish" ? enabled : current.arishEnabled;
  return { ownerEnabled, arishEnabled, isOpen: ownerEnabled && arishEnabled };
}

export function canAccessPrivateTeam(isTeamManager: boolean, isRosteredPlayer: boolean) {
  return isTeamManager || isRosteredPlayer;
}
