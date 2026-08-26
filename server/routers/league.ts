import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDashboardForMember, getDirectory, getFixtures, getLeagueSummary, getManagerRosters } from "../db";
import { getLeagueIdentity } from "../leagueAccess";
import { TRPCError } from "@trpc/server";

function requireLeagueAccess(identity: Awaited<ReturnType<typeof getLeagueIdentity>>) {
  if (!identity.isAdmin && !identity.memberId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "This account is not linked to a UBSR league member record." });
  }
}

export const leagueRouter = router({
  overview: protectedProcedure.query(async ({ ctx }) => {
    const identity = await getLeagueIdentity(ctx.user);
    requireLeagueAccess(identity);
    const [summary, dashboard] = await Promise.all([
      getLeagueSummary(),
      getDashboardForMember(identity.memberId, identity.managerId),
    ]);
    return { identity, summary, dashboard };
  }),
  directory: protectedProcedure.input(z.object({ search: z.string().max(80).optional() })).query(async ({ ctx, input }) => {
    const identity = await getLeagueIdentity(ctx.user);
    requireLeagueAccess(identity);
    return getDirectory(input.search);
  }),
  rosters: protectedProcedure.query(async ({ ctx }) => {
    const identity = await getLeagueIdentity(ctx.user);
    requireLeagueAccess(identity);
    return getManagerRosters();
  }),
  fixtures: protectedProcedure.query(async ({ ctx }) => {
    const identity = await getLeagueIdentity(ctx.user);
    requireLeagueAccess(identity);
    return getFixtures();
  }),
});
