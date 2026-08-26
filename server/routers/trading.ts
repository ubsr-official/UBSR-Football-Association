import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { auditEvents, leagueActivity, managers, marketSettings, publicTradeOffers, publicTradeThreads, rosterEntries } from "../../drizzle/schema";
import { getDb } from "../db";
import { getLeagueIdentity, requireManager } from "../leagueAccess";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { resolveMarketSettings } from "../leagueRules";

async function requireOpenMarket() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
  const [market] = await db.select().from(marketSettings).where(eq(marketSettings.id, 1)).limit(1);
  if (!market?.isOpen || !resolveMarketSettings(market, "owner", Boolean(market.ownerEnabled)).isOpen) throw new TRPCError({ code: "FORBIDDEN", message: "The transfer market is currently closed." });
  return db;
}

export const tradingRouter = router({
  createThread: protectedProcedure.input(z.object({ playerMemberId: z.number().int().positive(), basePrice: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const identity = await getLeagueIdentity(ctx.user);
    requireManager(identity);
    const db = await requireOpenMarket();
    const [owned] = await db.select().from(rosterEntries).where(and(eq(rosterEntries.playerMemberId, input.playerMemberId), eq(rosterEntries.managerId, identity.managerId!))).limit(1);
    if (!owned) throw new TRPCError({ code: "FORBIDDEN", message: "You can only list a player currently on your roster." });
    const [existing] = await db.select().from(publicTradeThreads).where(and(eq(publicTradeThreads.playerMemberId, input.playerMemberId), eq(publicTradeThreads.status, "open"))).limit(1);
    if (existing) throw new TRPCError({ code: "CONFLICT", message: "That player already has an open trade thread." });
    const [created] = await db.insert(publicTradeThreads).values({ playerMemberId: input.playerMemberId, sellerManagerId: identity.managerId!, basePrice: input.basePrice });
    await db.insert(auditEvents).values({ actorUserId: ctx.user.id, action: "thread_created", entityType: "trade_thread", entityId: Number(created.insertId), detail: `Listing created with a base price of ${input.basePrice} pts.` });
    await db.insert(leagueActivity).values({ category: "trade", headline: "Player listed for negotiation", detail: "A manager opened a public trade thread.", actorUserId: ctx.user.id });
    return { success: true };
  }),
  makeOffer: protectedProcedure.input(z.object({ threadId: z.number().int().positive(), bidPoints: z.number().int().positive(), negotiationNote: z.string().trim().max(500).optional() })).mutation(async ({ ctx, input }) => {
    const identity = await getLeagueIdentity(ctx.user);
    requireManager(identity);
    const db = await requireOpenMarket();
    const [thread] = await db.select().from(publicTradeThreads).where(eq(publicTradeThreads.id, input.threadId)).limit(1);
    if (!thread || thread.status !== "open") throw new TRPCError({ code: "NOT_FOUND", message: "This trade thread is no longer open." });
    if (thread.sellerManagerId === identity.managerId) throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot make an offer on your own listing." });
    const [buyer] = await db.select().from(managers).where(eq(managers.id, identity.managerId!)).limit(1);
    if (!buyer || buyer.currentBalance < input.bidPoints) throw new TRPCError({ code: "BAD_REQUEST", message: "Your team balance is too low for this offer." });
    await db.insert(publicTradeOffers).values({ threadId: input.threadId, buyerManagerId: identity.managerId!, bidPoints: input.bidPoints, negotiationNote: input.negotiationNote ?? null });
    await db.insert(auditEvents).values({ actorUserId: ctx.user.id, action: "offer_placed", entityType: "trade_thread", entityId: input.threadId, detail: `A bid of ${input.bidPoints} pts was placed.` });
    return { success: true };
  }),
  resolveOffer: protectedProcedure.input(z.object({ offerId: z.number().int().positive(), accept: z.boolean() })).mutation(async ({ ctx, input }) => {
    const identity = await getLeagueIdentity(ctx.user);
    requireManager(identity);
    const db = await requireOpenMarket();
    await db.transaction(async tx => {
      const [offer] = await tx.select().from(publicTradeOffers).where(eq(publicTradeOffers.id, input.offerId)).limit(1);
      if (!offer || offer.status !== "open") throw new TRPCError({ code: "NOT_FOUND", message: "This offer is no longer available." });
      const [thread] = await tx.select().from(publicTradeThreads).where(eq(publicTradeThreads.id, offer.threadId)).limit(1);
      if (!thread || thread.status !== "open" || thread.sellerManagerId !== identity.managerId) throw new TRPCError({ code: "FORBIDDEN", message: "Only the listing seller may resolve this offer." });
      if (!input.accept) {
        await tx.update(publicTradeOffers).set({ status: "rejected", resolvedAt: new Date() }).where(eq(publicTradeOffers.id, offer.id));
        await tx.insert(auditEvents).values({ actorUserId: ctx.user.id, action: "offer_rejected", entityType: "trade_thread", entityId: offer.threadId, detail: "The seller rejected a manual offer." });
        return;
      }
      const [roster] = await tx.select().from(rosterEntries).where(and(eq(rosterEntries.playerMemberId, thread.playerMemberId), eq(rosterEntries.managerId, identity.managerId!))).limit(1);
      if (!roster) throw new TRPCError({ code: "CONFLICT", message: "The listed player is no longer on your roster." });
      const [buyer] = await tx.select().from(managers).where(eq(managers.id, offer.buyerManagerId)).limit(1);
      const [seller] = await tx.select().from(managers).where(eq(managers.id, identity.managerId!)).limit(1);
      if (!buyer || !seller || buyer.currentBalance < offer.bidPoints) throw new TRPCError({ code: "CONFLICT", message: "The buyer no longer has sufficient balance." });
      await tx.update(rosterEntries).set({ managerId: offer.buyerManagerId, acquiredPrice: offer.bidPoints, source: "trade", acquiredAt: new Date() }).where(eq(rosterEntries.id, roster.id));
      await tx.update(managers).set({ currentBalance: buyer.currentBalance - offer.bidPoints }).where(eq(managers.id, buyer.id));
      await tx.update(managers).set({ currentBalance: seller.currentBalance + offer.bidPoints }).where(eq(managers.id, seller.id));
      await tx.update(publicTradeOffers).set({ status: "accepted", resolvedAt: new Date() }).where(eq(publicTradeOffers.id, offer.id));
      await tx.update(publicTradeOffers).set({ status: "rejected", resolvedAt: new Date() }).where(and(eq(publicTradeOffers.threadId, thread.id), eq(publicTradeOffers.status, "open")));
      await tx.update(publicTradeThreads).set({ status: "accepted", resolvedAt: new Date() }).where(eq(publicTradeThreads.id, thread.id));
      await tx.insert(auditEvents).values({ actorUserId: ctx.user.id, action: "offer_accepted", entityType: "trade_thread", entityId: thread.id, detail: `The seller accepted a ${offer.bidPoints} pts offer. Ownership and balances changed in one transaction.` });
      await tx.insert(leagueActivity).values({ category: "trade", headline: "Trade completed", detail: "A seller accepted a manual offer; roster ownership and balances were updated together.", actorUserId: ctx.user.id });
    });
    return { success: true };
  }),
  withdrawThread: protectedProcedure.input(z.object({ threadId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const identity = await getLeagueIdentity(ctx.user);
    requireManager(identity);
    const db = await requireOpenMarket();
    await db.update(publicTradeThreads).set({ status: "withdrawn", resolvedAt: new Date() }).where(and(eq(publicTradeThreads.id, input.threadId), eq(publicTradeThreads.sellerManagerId, identity.managerId!)));
    await db.insert(auditEvents).values({ actorUserId: ctx.user.id, action: "thread_withdrawn", entityType: "trade_thread", entityId: input.threadId, detail: "The seller withdrew this listing." });
    return { success: true };
  }),
});
