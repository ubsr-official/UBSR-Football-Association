import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { auditEvents, marketSettings, privateTeamMessages, publicTradeMessages } from "../../drizzle/schema";
import { getDb, getPrivateTeamMessages, getPublicTradeThreads } from "../db";
import { getLeagueIdentity, requireLinkedMember, requirePrivateTeamAccess } from "../leagueAccess";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";

const messageInput = z.object({ body: z.string().trim().min(1).max(800) });

export const chatRouter = router({
  privateMessages: protectedProcedure.input(z.object({ managerId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const identity = await getLeagueIdentity(ctx.user);
    await requirePrivateTeamAccess(identity, input.managerId);
    return getPrivateTeamMessages(input.managerId);
  }),
  postPrivateMessage: protectedProcedure.input(z.object({ managerId: z.number().int().positive() }).merge(messageInput)).mutation(async ({ ctx, input }) => {
    const identity = await getLeagueIdentity(ctx.user);
    await requirePrivateTeamAccess(identity, input.managerId);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
    await db.insert(privateTeamMessages).values({ managerId: input.managerId, authorUserId: ctx.user.id, body: input.body });
    return { success: true };
  }),
  publicTradeThreads: protectedProcedure.query(async ({ ctx }) => {
    const identity = await getLeagueIdentity(ctx.user);
    if (!identity.isAdmin) requireLinkedMember(identity);
    return getPublicTradeThreads();
  }),
  postPublicTradeMessage: protectedProcedure.input(z.object({ threadId: z.number().int().positive() }).merge(messageInput)).mutation(async ({ ctx, input }) => {
    const identity = await getLeagueIdentity(ctx.user);
    if (!identity.isAdmin) requireLinkedMember(identity);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
    const [market] = await db.select().from(marketSettings).where(eq(marketSettings.id, 1)).limit(1);
    if (!market?.isOpen) throw new TRPCError({ code: "FORBIDDEN", message: "Public trade discussions are unavailable while the market is closed." });
    await db.insert(publicTradeMessages).values({ threadId: input.threadId, authorUserId: ctx.user.id, body: input.body });
    await db.insert(auditEvents).values({ actorUserId: ctx.user.id, action: "trade_message_posted", entityType: "trade_thread", entityId: input.threadId, detail: "A public negotiation message was posted." });
    return { success: true };
  }),
});
