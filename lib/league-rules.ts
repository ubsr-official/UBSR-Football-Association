export type StandingsRow = { teamId: string; points: number; goalDifference: number; goalsFor: number };

export function sharedAvailableDays(homeDays: string[], awayDays: string[]) {
  const away = new Set(awayDays);
  return [...new Set(homeDays.filter(day => away.has(day)))].sort();
}

export function rankStandings(rows: StandingsRow[]) {
  return [...rows].sort((left, right) => right.points - left.points || right.goalDifference - left.goalDifference || right.goalsFor - left.goalsFor || left.teamId.localeCompare(right.teamId));
}

export function isMarketOpen(ownerEnabled: boolean, arishEnabled: boolean) {
  return ownerEnabled && arishEnabled;
}

export function qualifiesForStandings(input: { competitionClass: "competitive" | "friendly"; status: "scheduled" | "postponed" | "completed"; resultConfirmedAt: string | null }) {
  return input.competitionClass === "competitive" && input.status === "completed" && Boolean(input.resultConfirmedAt);
}
