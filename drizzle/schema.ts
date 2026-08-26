import {
  boolean,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const leagueMembers = mysqlTable(
  "league_members",
  {
    id: int("id").autoincrement().primaryKey(),
    memberCode: varchar("memberCode", { length: 16 }).notNull().unique(),
    fullName: varchar("fullName", { length: 160 }).notNull(),
    section: varchar("section", { length: 80 }),
    leagueRole: mysqlEnum("leagueRole", ["manager", "player"]).notNull(),
    positions: varchar("positions", { length: 255 }).notNull(),
    rating: varchar("rating", { length: 24 }).notNull(),
    basePrice: int("basePrice").notNull(),
    accountUserId: int("accountUserId").references(() => users.id, { onDelete: "set null" }).unique(),
    accountStatus: mysqlEnum("accountStatus", ["unlinked", "active", "deactivated"])
      .default("unlinked")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("league_members_name_idx").on(table.fullName), index("league_members_role_idx").on(table.leagueRole)]
);

export const managers = mysqlTable(
  "managers",
  {
    id: int("id").autoincrement().primaryKey(),
    memberId: int("memberId").notNull().references(() => leagueMembers.id, { onDelete: "cascade" }).unique(),
    teamName: varchar("teamName", { length: 100 }).notNull(),
    openingBalance: int("openingBalance").default(2000).notNull(),
    currentBalance: int("currentBalance").default(2000).notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("managers_active_idx").on(table.isActive)]
);

export const managerBalanceAdjustments = mysqlTable(
  "manager_balance_adjustments",
  {
    id: int("id").autoincrement().primaryKey(),
    managerId: int("managerId").notNull().references(() => managers.id, { onDelete: "cascade" }),
    amount: int("amount").notNull(),
    reason: varchar("reason", { length: 300 }).notNull(),
    enteredByUserId: int("enteredByUserId").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("balance_adjustments_manager_idx").on(table.managerId)]
);

export const auctionRecords = mysqlTable(
  "auction_records",
  {
    id: int("id").autoincrement().primaryKey(),
    playerMemberId: int("playerMemberId").notNull().references(() => leagueMembers.id, { onDelete: "cascade" }).unique(),
    basePrice: int("basePrice").notNull(),
    finalBoughtPrice: int("finalBoughtPrice"),
    status: mysqlEnum("status", ["unassigned", "auction_in_progress", "sold", "unsold", "not_called"])
      .default("unassigned")
      .notNull(),
    buyerManagerId: int("buyerManagerId").references(() => managers.id, { onDelete: "set null" }),
    enteredByUserId: int("enteredByUserId").references(() => users.id, { onDelete: "set null" }),
    note: text("note"),
    resolvedAt: timestamp("resolvedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("auction_records_status_idx").on(table.status), index("auction_records_buyer_idx").on(table.buyerManagerId)]
);

export const rosterEntries = mysqlTable(
  "roster_entries",
  {
    id: int("id").autoincrement().primaryKey(),
    managerId: int("managerId").notNull().references(() => managers.id, { onDelete: "cascade" }),
    playerMemberId: int("playerMemberId").notNull().references(() => leagueMembers.id, { onDelete: "cascade" }).unique(),
    acquiredPrice: int("acquiredPrice").notNull(),
    source: mysqlEnum("source", ["auction", "admin_assignment", "trade"]).notNull(),
    acquiredAt: timestamp("acquiredAt").defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("roster_entries_manager_idx").on(table.managerId)]
);

export const fixtures = mysqlTable(
  "fixtures",
  {
    id: int("id").autoincrement().primaryKey(),
    homeManagerId: int("homeManagerId").notNull().references(() => managers.id, { onDelete: "cascade" }),
    awayManagerId: int("awayManagerId").notNull().references(() => managers.id, { onDelete: "cascade" }),
    scheduledFor: timestamp("scheduledFor"),
    venue: varchar("venue", { length: 160 }),
    matchweek: int("matchweek"),
    status: mysqlEnum("status", ["scheduled", "completed", "postponed", "cancelled"]).default("scheduled").notNull(),
    homeScore: int("homeScore"),
    awayScore: int("awayScore"),
    note: text("note"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("fixtures_schedule_idx").on(table.scheduledFor), index("fixtures_home_idx").on(table.homeManagerId)]
);

export const adminSeats = mysqlTable("admin_seats", {
  id: int("id").autoincrement().primaryKey(),
  seat: mysqlEnum("seat", ["owner", "arish"]).notNull().unique(),
  displayName: varchar("displayName", { length: 100 }).notNull(),
  userId: int("userId").references(() => users.id, { onDelete: "set null" }).unique(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const marketSettings = mysqlTable("market_settings", {
  id: int("id").primaryKey(),
  ownerEnabled: boolean("ownerEnabled").default(false).notNull(),
  arishEnabled: boolean("arishEnabled").default(false).notNull(),
  isOpen: boolean("isOpen").default(false).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const publicTradeThreads = mysqlTable(
  "public_trade_threads",
  {
    id: int("id").autoincrement().primaryKey(),
    playerMemberId: int("playerMemberId").notNull().references(() => leagueMembers.id, { onDelete: "cascade" }),
    sellerManagerId: int("sellerManagerId").notNull().references(() => managers.id, { onDelete: "cascade" }),
    basePrice: int("basePrice").notNull(),
    status: mysqlEnum("status", ["open", "accepted", "rejected", "withdrawn", "closed"]).default("open").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    resolvedAt: timestamp("resolvedAt"),
  },
  table => [index("trade_threads_status_idx").on(table.status), index("trade_threads_seller_idx").on(table.sellerManagerId)]
);

export const publicTradeOffers = mysqlTable(
  "public_trade_offers",
  {
    id: int("id").autoincrement().primaryKey(),
    threadId: int("threadId").notNull().references(() => publicTradeThreads.id, { onDelete: "cascade" }),
    buyerManagerId: int("buyerManagerId").notNull().references(() => managers.id, { onDelete: "cascade" }),
    bidPoints: int("bidPoints").notNull(),
    negotiationNote: text("negotiationNote"),
    status: mysqlEnum("status", ["open", "accepted", "rejected", "withdrawn"]).default("open").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    resolvedAt: timestamp("resolvedAt"),
  },
  table => [index("trade_offers_thread_idx").on(table.threadId), index("trade_offers_buyer_idx").on(table.buyerManagerId)]
);

export const publicTradeMessages = mysqlTable(
  "public_trade_messages",
  {
    id: int("id").autoincrement().primaryKey(),
    threadId: int("threadId").notNull().references(() => publicTradeThreads.id, { onDelete: "cascade" }),
    authorUserId: int("authorUserId").notNull().references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("trade_messages_thread_idx").on(table.threadId)]
);

export const privateTeamMessages = mysqlTable(
  "private_team_messages",
  {
    id: int("id").autoincrement().primaryKey(),
    managerId: int("managerId").notNull().references(() => managers.id, { onDelete: "cascade" }),
    authorUserId: int("authorUserId").notNull().references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("team_messages_manager_idx").on(table.managerId)]
);

export const leagueActivity = mysqlTable(
  "league_activity",
  {
    id: int("id").autoincrement().primaryKey(),
    category: mysqlEnum("category", ["auction", "roster", "fixture", "market", "trade"]).notNull(),
    headline: varchar("headline", { length: 200 }).notNull(),
    detail: text("detail"),
    actorUserId: int("actorUserId").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("league_activity_created_idx").on(table.createdAt)]
);

export const auditEvents = mysqlTable(
  "audit_events",
  {
    id: int("id").autoincrement().primaryKey(),
    actorUserId: int("actorUserId").references(() => users.id, { onDelete: "set null" }),
    action: varchar("action", { length: 100 }).notNull(),
    entityType: varchar("entityType", { length: 80 }).notNull(),
    entityId: int("entityId"),
    detail: text("detail"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("audit_events_entity_idx").on(table.entityType, table.entityId), index("audit_events_created_idx").on(table.createdAt)]
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type LeagueMember = typeof leagueMembers.$inferSelect;
export type Manager = typeof managers.$inferSelect;
export type AuctionRecord = typeof auctionRecords.$inferSelect;
