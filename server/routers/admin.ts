import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { adminSeats, auctionRecords, auditEvents, fixtures, leagueActivity, leagueMembers, managerBalanceAdjustments, managers, marketSettings, rosterEntries, users } from "../../drizzle/schema";
import { getDb, getDirectory, getFixtures, getManagerRosters } from "../db";
import { getLeagueIdentity, requireAdmin } from "../leagueAccess";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { resolveMarketSettings, validateAuctionOutcome } from "../leagueRules";

async function recalculateManagerBalance(db: any, managerId: number) {
  const [manager] = await db.select().from(managers).where(eq(managers.id, managerId)).limit(1);
  if (!manager) return;
  const [total] = await db
    .select({ total: sql<number>`coalesce(sum(${rosterEntries.acquiredPrice}), 0)` })
    .from(rosterEntries)
    .where(eq(rosterEntries.managerId, managerId));
  const [adjustments] = await db
    .select({ total: sql<number>`coalesce(sum(${managerBalanceAdjustments.amount}), 0)` })
    .from(managerBalanceAdjustments)
    .where(eq(managerBalanceAdjustments.managerId, managerId));
  await db.update(managers).set({ currentBalance: manager.openingBalance - Number(total?.total ?? 0) + Number(adjustments?.total ?? 0) }).where(eq(managers.id, managerId));
}

export const adminRouter = router({
  controlPanel: protectedProcedure.query(async ({ ctx }) => {
    const identity = await getLeagueIdentity(ctx.user);
    requireAdmin(identity);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
    const [directory, rosters, fixtureRows, seatRows, userRows] = await Promise.all([
      getDirectory(), getManagerRosters(), getFixtures(), db.select().from(adminSeats), db.select({ id: users.id, name: users.name, email: users.email, role: users.role }).from(users).limit(100),
    ]);
    return { directory, rosters, fixtures: fixtureRows, seats: seatRows, accounts: userRows };
  }),
  assignAdminSeat: protectedProcedure.input(z.object({ seat: z.enum(["owner", "arish"]), userId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const identity = await getLeagueIdentity(ctx.user);
    requireAdmin(identity);
    if (identity.adminSeat !== "owner") throw new TRPCError({ code: "FORBIDDEN", message: "Only the league owner can assign administrator seats." });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
    await db.update(users).set({ role: "admin" }).where(eq(users.id, input.userId));
    await db.update(adminSeats).set({ userId: input.userId }).where(eq(adminSeats.seat, input.seat));
    return { success: true };
  }),
  linkAccount: protectedProcedure.input(z.object({ memberId: z.number().int().positive(), userId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const identity = await getLeagueIdentity(ctx.user);
    requireAdmin(identity);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
    await db.update(leagueMembers).set({ accountUserId: input.userId, accountStatus: "active" }).where(eq(leagueMembers.id, input.memberId));
    return { success: true };
  }),
  recordAuction: protectedProcedure.input(z.object({
    playerMemberId: z.number().int().positive(),
    status: z.enum(["auction_in_progress", "sold", "unsold", "not_called", "unassigned"]),
    buyerManagerId: z.number().int().positive().nullable().optional(),
    finalBoughtPrice: z.number().int().nonnegative().nullable().optional(),
    note: z.string().trim().max(500).nullable().optional(),
  })).mutation(async ({ ctx, input }) => {
    const identity = await getLeagueIdentity(ctx.user);
    requireAdmin(identity);
    const auctionError = validateAuctionOutcome(input);
    if (auctionError) throw new TRPCError({ code: "BAD_REQUEST", message: auctionError });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
    await db.transaction(async tx => {
      const [existing] = await tx.select().from(auctionRecords).where(eq(auctionRecords.playerMemberId, input.playerMemberId)).limit(1);
      const previousManagerId = existing?.buyerManagerId ?? null;
      await tx.delete(rosterEntries).where(eq(rosterEntries.playerMemberId, input.playerMemberId));
      await tx.update(auctionRecords).set({
        status: input.status,
        buyerManagerId: input.status === "sold" ? input.buyerManagerId ?? null : null,
        finalBoughtPrice: input.status === "sold" ? input.finalBoughtPrice ?? null : null,
        note: input.note ?? null,
        enteredByUserId: ctx.user.id,
        resolvedAt: input.status === "sold" || input.status === "unsold" ? new Date() : null,
      }).where(eq(auctionRecords.playerMemberId, input.playerMemberId));
      if (input.status === "sold" && input.buyerManagerId && input.finalBoughtPrice !== null && input.finalBoughtPrice !== undefined) {
        await tx.insert(rosterEntries).values({ managerId: input.buyerManagerId, playerMemberId: input.playerMemberId, acquiredPrice: input.finalBoughtPrice, source: "auction" });
      }
      await tx.insert(leagueActivity).values({ category: "auction", headline: "Auction record updated", detail: input.note ?? "A league auction record was updated.", actorUserId: ctx.user.id });
      if (previousManagerId) await recalculateManagerBalance(tx, previousManagerId);
      if (input.buyerManagerId) await recalculateManagerBalance(tx, input.buyerManagerId);
    });
    return { success: true };
  }),
  reassignRosterOwnership: protectedProcedure.input(z.object({ playerMemberId: z.number().int().positive(), toManagerId: z.number().int().positive(), reason: z.string().trim().min(3).max(300) })).mutation(async ({ ctx, input }) => {
    const identity = await getLeagueIdentity(ctx.user);
    requireAdmin(identity);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
    await db.transaction(async tx => {
      const [roster] = await tx.select().from(rosterEntries).where(eq(rosterEntries.playerMemberId, input.playerMemberId)).limit(1);
      if (!roster) throw new TRPCError({ code: "NOT_FOUND", message: "This player is not currently rostered to a manager." });
      if (roster.managerId === input.toManagerId) throw new TRPCError({ code: "BAD_REQUEST", message: "The player already belongs to that manager." });
      const fromManagerId = roster.managerId;
      await tx.update(rosterEntries).set({ managerId: input.toManagerId, source: "admin_assignment", acquiredAt: new Date() }).where(eq(rosterEntries.id, roster.id));
      await tx.update(auctionRecords).set({ buyerManagerId: input.toManagerId }).where(eq(auctionRecords.playerMemberId, input.playerMemberId));
      await tx.insert(auditEvents).values({ actorUserId: ctx.user.id, action: "manual_roster_reassignment", entityType: "roster_entry", entityId: roster.id, detail: input.reason });
      await tx.insert(leagueActivity).values({ category: "roster", headline: "Roster ownership reassigned", detail: input.reason, actorUserId: ctx.user.id });
      await recalculateManagerBalance(tx, fromManagerId);
      await recalculateManagerBalance(tx, input.toManagerId);
    });
    return { success: true };
  }),
  recordBalanceAdjustment: protectedProcedure.input(z.object({ managerId: z.number().int().positive(), amount: z.number().int().min(-2000).max(2000).refine(value => value !== 0, "Adjustment cannot be zero."), reason: z.string().trim().min(3).max(300) })).mutation(async ({ ctx, input }) => {
    const identity = await getLeagueIdentity(ctx.user);
    requireAdmin(identity);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
    await db.transaction(async tx => {
      await tx.insert(managerBalanceAdjustments).values({ managerId: input.managerId, amount: input.amount, reason: input.reason, enteredByUserId: ctx.user.id });
      await tx.insert(auditEvents).values({ actorUserId: ctx.user.id, action: "manager_balance_adjusted", entityType: "manager", entityId: input.managerId, detail: `${input.amount} pts: ${input.reason}` });
      await tx.insert(leagueActivity).values({ category: "roster", headline: "Manager balance adjusted", detail: input.reason, actorUserId: ctx.user.id });
      await recalculateManagerBalance(tx, input.managerId);
    });
    return { success: true };
  }),
  saveFixture: protectedProcedure.input(z.object({
    id: z.number().int().positive().optional(),
    homeManagerId: z.number().int().positive(), awayManagerId: z.number().int().positive(), scheduledFor: z.date().nullable().optional(), venue: z.string().trim().max(160).nullable().optional(), matchweek: z.number().int().positive().nullable().optional(), status: z.enum(["scheduled", "completed", "postponed", "cancelled"]), homeScore: z.number().int().nonnegative().nullable().optional(), awayScore: z.number().int().nonnegative().nullable().optional(), note: z.string().trim().max(500).nullable().optional(),
  })).mutation(async ({ ctx, input }) => {
    const identity = await getLeagueIdentity(ctx.user);
    requireAdmin(identity);
    if (input.homeManagerId === input.awayManagerId) throw new TRPCError({ code: "BAD_REQUEST", message: "A team cannot play itself." });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
    const values = { homeManagerId: input.homeManagerId, awayManagerId: input.awayManagerId, scheduledFor: input.scheduledFor ?? null, venue: input.venue ?? null, matchweek: input.matchweek ?? null, status: input.status, homeScore: input.homeScore ?? null, awayScore: input.awayScore ?? null, note: input.note ?? null };
    if (input.id) await db.update(fixtures).set(values).where(eq(fixtures.id, input.id));
    else await db.insert(fixtures).values(values);
    await db.insert(leagueActivity).values({ category: "fixture", headline: input.id ? "Fixture updated" : "Fixture added", detail: input.venue ?? "A fixture was added to the league calendar.", actorUserId: ctx.user.id });
    return { success: true };
  }),
  setMarketApproval: protectedProcedure.input(z.object({ enabled: z.boolean() })).mutation(async ({ ctx, input }) => {
    const identity = await getLeagueIdentity(ctx.user);
    requireAdmin(identity);
    if (!identity.adminSeat) throw new TRPCError({ code: "FORBIDDEN", message: "Only the owner or Arish may approve the transfer market." });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
    await db.transaction(async tx => {
      const [market] = await tx.select().from(marketSettings).where(eq(marketSettings.id, 1)).limit(1);
      const nextMarket = resolveMarketSettings({ ownerEnabled: Boolean(market?.ownerEnabled), arishEnabled: Boolean(market?.arishEnabled) }, identity.adminSeat!, input.enabled);
      await tx.update(marketSettings).set(nextMarket).where(eq(marketSettings.id, 1));
      const { isOpen } = nextMarket;
      await tx.insert(leagueActivity).values({ category: "market", headline: isOpen ? "Transfer market opened" : "Transfer market approval updated", detail: isOpen ? "Both administrators approved market access." : "One administrator updated their market approval.", actorUserId: ctx.user.id });
    });
    return { success: true };
  }),
});
