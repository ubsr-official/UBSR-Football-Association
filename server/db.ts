import { and, desc, eq, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  auctionRecords,
  auditEvents,
  fixtures,
  leagueActivity,
  leagueMembers,
  managerBalanceAdjustments,
  managers,
  marketSettings,
  privateTeamMessages,
  publicTradeMessages,
  publicTradeOffers,
  publicTradeThreads,
  rosterEntries,
  type InsertUser,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    _db = drizzle(process.env.DATABASE_URL);
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  values.role = user.openId === ENV.ownerOpenId ? "admin" : user.role ?? "user";
  updateSet.role = values.role;
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getLeagueSummary() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [market] = await db.select().from(marketSettings).where(eq(marketSettings.id, 1)).limit(1);
  const [memberRows, managerRows, auctionRows, recentActivity] = await Promise.all([
    db.select().from(leagueMembers),
    db.select().from(managers),
    db.select().from(auctionRecords),
    db.select().from(leagueActivity).orderBy(desc(leagueActivity.createdAt)).limit(8),
  ]);
  return {
    counts: {
      members: memberRows.length,
      managers: managerRows.length,
      sold: auctionRows.filter(row => row.status === "sold").length,
      unsold: auctionRows.filter(row => row.status === "unsold").length,
      notCalled: auctionRows.filter(row => row.status === "not_called").length,
    },
    market: market ?? { ownerEnabled: false, arishEnabled: false, isOpen: false },
    recentActivity,
  };
}

export async function getDirectory(search?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const where = search?.trim()
    ? or(like(leagueMembers.fullName, `%${search.trim()}%`), like(leagueMembers.memberCode, `%${search.trim()}%`), like(leagueMembers.positions, `%${search.trim()}%`))
    : undefined;
  return db
    .select({
      memberId: leagueMembers.id,
      memberCode: leagueMembers.memberCode,
      fullName: leagueMembers.fullName,
      section: leagueMembers.section,
      leagueRole: leagueMembers.leagueRole,
      positions: leagueMembers.positions,
      rating: leagueMembers.rating,
      basePrice: leagueMembers.basePrice,
      auctionStatus: auctionRecords.status,
      finalBoughtPrice: auctionRecords.finalBoughtPrice,
      ownerManagerId: managers.id,
      ownerTeamName: managers.teamName,
    })
    .from(leagueMembers)
    .leftJoin(auctionRecords, eq(auctionRecords.playerMemberId, leagueMembers.id))
    .leftJoin(managers, eq(managers.id, auctionRecords.buyerManagerId))
    .where(where)
    .orderBy(leagueMembers.fullName);
}

export async function getManagerRosters() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const managerRows = await db.select().from(managers);
  const rosters = await Promise.all(
    managerRows.map(async manager => ({
      manager,
      players: await db
        .select({
          rosterId: rosterEntries.id,
          memberId: leagueMembers.id,
          memberCode: leagueMembers.memberCode,
          fullName: leagueMembers.fullName,
          positions: leagueMembers.positions,
          acquiredPrice: rosterEntries.acquiredPrice,
        })
        .from(rosterEntries)
        .innerJoin(leagueMembers, eq(rosterEntries.playerMemberId, leagueMembers.id))
        .where(eq(rosterEntries.managerId, manager.id)),
    }))
  );
  return rosters;
}

export async function getFixtures() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const fixtureRows = await db.select().from(fixtures).orderBy(desc(fixtures.scheduledFor));
  const managerRows = await db.select().from(managers);
  const names = new Map(managerRows.map(manager => [manager.id, manager.teamName]));
  return fixtureRows.map(fixture => ({ ...fixture, homeTeamName: names.get(fixture.homeManagerId) ?? "Unknown team", awayTeamName: names.get(fixture.awayManagerId) ?? "Unknown team" }));
}

export async function getDashboardForMember(memberId: number | null, managerId: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [market, recentActivity] = await Promise.all([
    db.select().from(marketSettings).where(eq(marketSettings.id, 1)).limit(1),
    db.select().from(leagueActivity).orderBy(desc(leagueActivity.createdAt)).limit(6),
  ]);
  const manager = managerId ? (await db.select().from(managers).where(eq(managers.id, managerId)).limit(1))[0] : null;
  const myTeamEntry = memberId
    ? (await db.select().from(rosterEntries).where(eq(rosterEntries.playerMemberId, memberId)).limit(1))[0]
    : null;
  const teamId = managerId ?? myTeamEntry?.managerId ?? null;
  const roster = teamId
    ? await db
        .select({ memberId: leagueMembers.id, memberCode: leagueMembers.memberCode, fullName: leagueMembers.fullName, positions: leagueMembers.positions, acquiredPrice: rosterEntries.acquiredPrice })
        .from(rosterEntries)
        .innerJoin(leagueMembers, eq(rosterEntries.playerMemberId, leagueMembers.id))
        .where(eq(rosterEntries.managerId, teamId))
    : [];
  const team = teamId ? (await db.select().from(managers).where(eq(managers.id, teamId)).limit(1))[0] : null;
  return { manager, team, roster, market: market[0] ?? { ownerEnabled: false, arishEnabled: false, isOpen: false }, recentActivity };
}

export async function getPrivateTeamMessages(managerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db
    .select({ id: privateTeamMessages.id, body: privateTeamMessages.body, createdAt: privateTeamMessages.createdAt, authorName: users.name })
    .from(privateTeamMessages)
    .innerJoin(users, eq(privateTeamMessages.authorUserId, users.id))
    .where(eq(privateTeamMessages.managerId, managerId))
    .orderBy(privateTeamMessages.createdAt)
    .limit(100);
}

export async function getPublicTradeThreads() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const threads = await db
    .select({
      id: publicTradeThreads.id,
      basePrice: publicTradeThreads.basePrice,
      status: publicTradeThreads.status,
      createdAt: publicTradeThreads.createdAt,
      playerName: leagueMembers.fullName,
      playerCode: leagueMembers.memberCode,
      sellerTeamName: managers.teamName,
      sellerManagerId: managers.id,
    })
    .from(publicTradeThreads)
    .innerJoin(leagueMembers, eq(publicTradeThreads.playerMemberId, leagueMembers.id))
    .innerJoin(managers, eq(publicTradeThreads.sellerManagerId, managers.id))
    .orderBy(desc(publicTradeThreads.createdAt));
  return Promise.all(
    threads.map(async thread => {
      const offers = await db
        .select({ id: publicTradeOffers.id, bidPoints: publicTradeOffers.bidPoints, negotiationNote: publicTradeOffers.negotiationNote, status: publicTradeOffers.status, buyerTeamName: managers.teamName, buyerManagerId: managers.id })
        .from(publicTradeOffers)
        .innerJoin(managers, eq(publicTradeOffers.buyerManagerId, managers.id))
        .where(eq(publicTradeOffers.threadId, thread.id))
        .orderBy(desc(publicTradeOffers.createdAt));
      const messages = await db
        .select({ id: publicTradeMessages.id, body: publicTradeMessages.body, createdAt: publicTradeMessages.createdAt, authorName: users.name })
        .from(publicTradeMessages)
        .innerJoin(users, eq(publicTradeMessages.authorUserId, users.id))
        .where(eq(publicTradeMessages.threadId, thread.id))
        .orderBy(publicTradeMessages.createdAt)
        .limit(50);
      const events = await db
        .select({ id: auditEvents.id, action: auditEvents.action, detail: auditEvents.detail, createdAt: auditEvents.createdAt, actorName: users.name })
        .from(auditEvents)
        .leftJoin(users, eq(auditEvents.actorUserId, users.id))
        .where(and(eq(auditEvents.entityType, "trade_thread"), eq(auditEvents.entityId, thread.id)))
        .orderBy(desc(auditEvents.createdAt))
        .limit(30);
      return { ...thread, offers, messages, events };
    })
  );
}
