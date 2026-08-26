import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { adminSeats, leagueMembers, managers, rosterEntries, users } from "../drizzle/schema";
import { getDb } from "./db";
import { ENV } from "./_core/env";
import { canAccessPrivateTeam } from "./leagueRules";

export type LeagueIdentity = {
  userId: number;
  memberId: number | null;
  memberCode: string | null;
  memberName: string | null;
  leagueRole: "manager" | "player" | null;
  managerId: number | null;
  isAdmin: boolean;
  adminSeat: "owner" | "arish" | null;
};

export async function ensureOwnerSeat(userId: number, openId: string) {
  if (openId !== ENV.ownerOpenId) return;
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
  const [ownerSeat] = await db.select().from(adminSeats).where(eq(adminSeats.seat, "owner")).limit(1);
  if (ownerSeat && !ownerSeat.userId) {
    await db.update(adminSeats).set({ userId }).where(eq(adminSeats.id, ownerSeat.id));
  }
}

export async function getLeagueIdentity(user: { id: number; openId: string; role: "user" | "admin" }): Promise<LeagueIdentity> {
  await ensureOwnerSeat(user.id, user.openId);
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });

  const [member] = await db
    .select({ id: leagueMembers.id, memberCode: leagueMembers.memberCode, fullName: leagueMembers.fullName, leagueRole: leagueMembers.leagueRole })
    .from(leagueMembers)
    .where(eq(leagueMembers.accountUserId, user.id))
    .limit(1);
  const [seat] = await db
    .select({ seat: adminSeats.seat })
    .from(adminSeats)
    .where(eq(adminSeats.userId, user.id))
    .limit(1);
  const [manager] = member
    ? await db.select({ id: managers.id }).from(managers).where(eq(managers.memberId, member.id)).limit(1)
    : [];

  return {
    userId: user.id,
    memberId: member?.id ?? null,
    memberCode: member?.memberCode ?? null,
    memberName: member?.fullName ?? null,
    leagueRole: member?.leagueRole ?? null,
    managerId: manager?.id ?? null,
    isAdmin: user.role === "admin",
    adminSeat: seat?.seat ?? null,
  };
}

export function requireAdmin(identity: LeagueIdentity) {
  if (!identity.isAdmin) throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
}

export function requireLinkedMember(identity: LeagueIdentity) {
  if (!identity.memberId) throw new TRPCError({ code: "FORBIDDEN", message: "Your account has not been linked to a UBSR member record yet." });
}

export function requireManager(identity: LeagueIdentity) {
  if (!identity.managerId) throw new TRPCError({ code: "FORBIDDEN", message: "Manager access is required for this action." });
}

export async function requirePrivateTeamAccess(identity: LeagueIdentity, managerId: number) {
  requireLinkedMember(identity);
  if (canAccessPrivateTeam(identity.managerId === managerId, false)) return;
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
  const [rosterMembership] = await db
    .select({ id: rosterEntries.id })
    .from(rosterEntries)
    .where(and(eq(rosterEntries.managerId, managerId), eq(rosterEntries.playerMemberId, identity.memberId!)))
    .limit(1);
  if (!canAccessPrivateTeam(false, Boolean(rosterMembership))) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Private team chat is only available to that team’s manager and rostered players." });
  }
}

export async function getUserForAssignment(userId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "Account not found." });
  return user;
}
