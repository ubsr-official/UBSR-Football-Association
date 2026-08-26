CREATE TABLE `admin_seats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`seat` enum('owner','arish') NOT NULL,
	`displayName` varchar(100) NOT NULL,
	`userId` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `admin_seats_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_seats_seat_unique` UNIQUE(`seat`),
	CONSTRAINT `admin_seats_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `auction_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerMemberId` int NOT NULL,
	`basePrice` int NOT NULL,
	`finalBoughtPrice` int,
	`status` enum('unassigned','auction_in_progress','sold','unsold','not_called') NOT NULL DEFAULT 'unassigned',
	`buyerManagerId` int,
	`enteredByUserId` int,
	`note` text,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `auction_records_id` PRIMARY KEY(`id`),
	CONSTRAINT `auction_records_playerMemberId_unique` UNIQUE(`playerMemberId`)
);
--> statement-breakpoint
CREATE TABLE `audit_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorUserId` int,
	`action` varchar(100) NOT NULL,
	`entityType` varchar(80) NOT NULL,
	`entityId` int,
	`detail` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fixtures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`homeManagerId` int NOT NULL,
	`awayManagerId` int NOT NULL,
	`scheduledFor` timestamp,
	`venue` varchar(160),
	`matchweek` int,
	`status` enum('scheduled','completed','postponed','cancelled') NOT NULL DEFAULT 'scheduled',
	`homeScore` int,
	`awayScore` int,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fixtures_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `league_activity` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` enum('auction','roster','fixture','market','trade') NOT NULL,
	`headline` varchar(200) NOT NULL,
	`detail` text,
	`actorUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `league_activity_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `league_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberCode` varchar(16) NOT NULL,
	`fullName` varchar(160) NOT NULL,
	`section` varchar(80),
	`leagueRole` enum('manager','player') NOT NULL,
	`positions` varchar(255) NOT NULL,
	`rating` varchar(24) NOT NULL,
	`basePrice` int NOT NULL,
	`accountUserId` int,
	`accountStatus` enum('unlinked','active','deactivated') NOT NULL DEFAULT 'unlinked',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `league_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `league_members_memberCode_unique` UNIQUE(`memberCode`),
	CONSTRAINT `league_members_accountUserId_unique` UNIQUE(`accountUserId`)
);
--> statement-breakpoint
CREATE TABLE `managers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`teamName` varchar(100) NOT NULL,
	`openingBalance` int NOT NULL DEFAULT 2000,
	`currentBalance` int NOT NULL DEFAULT 2000,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `managers_id` PRIMARY KEY(`id`),
	CONSTRAINT `managers_memberId_unique` UNIQUE(`memberId`)
);
--> statement-breakpoint
CREATE TABLE `market_settings` (
	`id` int NOT NULL,
	`ownerEnabled` boolean NOT NULL DEFAULT false,
	`arishEnabled` boolean NOT NULL DEFAULT false,
	`isOpen` boolean NOT NULL DEFAULT false,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `market_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `private_team_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`managerId` int NOT NULL,
	`authorUserId` int NOT NULL,
	`body` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `private_team_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `public_trade_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`threadId` int NOT NULL,
	`authorUserId` int NOT NULL,
	`body` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `public_trade_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `public_trade_offers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`threadId` int NOT NULL,
	`buyerManagerId` int NOT NULL,
	`bidPoints` int NOT NULL,
	`negotiationNote` text,
	`status` enum('open','accepted','rejected','withdrawn') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `public_trade_offers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `public_trade_threads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerMemberId` int NOT NULL,
	`sellerManagerId` int NOT NULL,
	`basePrice` int NOT NULL,
	`status` enum('open','accepted','rejected','withdrawn','closed') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `public_trade_threads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `roster_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`managerId` int NOT NULL,
	`playerMemberId` int NOT NULL,
	`acquiredPrice` int NOT NULL,
	`source` enum('auction','admin_assignment','trade') NOT NULL,
	`acquiredAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roster_entries_id` PRIMARY KEY(`id`),
	CONSTRAINT `roster_entries_playerMemberId_unique` UNIQUE(`playerMemberId`)
);
--> statement-breakpoint
ALTER TABLE `admin_seats` ADD CONSTRAINT `admin_seats_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `auction_records` ADD CONSTRAINT `auction_records_playerMemberId_league_members_id_fk` FOREIGN KEY (`playerMemberId`) REFERENCES `league_members`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `auction_records` ADD CONSTRAINT `auction_records_buyerManagerId_managers_id_fk` FOREIGN KEY (`buyerManagerId`) REFERENCES `managers`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `auction_records` ADD CONSTRAINT `auction_records_enteredByUserId_users_id_fk` FOREIGN KEY (`enteredByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_events` ADD CONSTRAINT `audit_events_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fixtures` ADD CONSTRAINT `fixtures_homeManagerId_managers_id_fk` FOREIGN KEY (`homeManagerId`) REFERENCES `managers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fixtures` ADD CONSTRAINT `fixtures_awayManagerId_managers_id_fk` FOREIGN KEY (`awayManagerId`) REFERENCES `managers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `league_activity` ADD CONSTRAINT `league_activity_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `league_members` ADD CONSTRAINT `league_members_accountUserId_users_id_fk` FOREIGN KEY (`accountUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `managers` ADD CONSTRAINT `managers_memberId_league_members_id_fk` FOREIGN KEY (`memberId`) REFERENCES `league_members`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `private_team_messages` ADD CONSTRAINT `private_team_messages_managerId_managers_id_fk` FOREIGN KEY (`managerId`) REFERENCES `managers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `private_team_messages` ADD CONSTRAINT `private_team_messages_authorUserId_users_id_fk` FOREIGN KEY (`authorUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `public_trade_messages` ADD CONSTRAINT `public_trade_messages_threadId_public_trade_threads_id_fk` FOREIGN KEY (`threadId`) REFERENCES `public_trade_threads`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `public_trade_messages` ADD CONSTRAINT `public_trade_messages_authorUserId_users_id_fk` FOREIGN KEY (`authorUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `public_trade_offers` ADD CONSTRAINT `public_trade_offers_threadId_public_trade_threads_id_fk` FOREIGN KEY (`threadId`) REFERENCES `public_trade_threads`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `public_trade_offers` ADD CONSTRAINT `public_trade_offers_buyerManagerId_managers_id_fk` FOREIGN KEY (`buyerManagerId`) REFERENCES `managers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `public_trade_threads` ADD CONSTRAINT `public_trade_threads_playerMemberId_league_members_id_fk` FOREIGN KEY (`playerMemberId`) REFERENCES `league_members`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `public_trade_threads` ADD CONSTRAINT `public_trade_threads_sellerManagerId_managers_id_fk` FOREIGN KEY (`sellerManagerId`) REFERENCES `managers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `roster_entries` ADD CONSTRAINT `roster_entries_managerId_managers_id_fk` FOREIGN KEY (`managerId`) REFERENCES `managers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `roster_entries` ADD CONSTRAINT `roster_entries_playerMemberId_league_members_id_fk` FOREIGN KEY (`playerMemberId`) REFERENCES `league_members`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `auction_records_status_idx` ON `auction_records` (`status`);--> statement-breakpoint
CREATE INDEX `auction_records_buyer_idx` ON `auction_records` (`buyerManagerId`);--> statement-breakpoint
CREATE INDEX `audit_events_entity_idx` ON `audit_events` (`entityType`,`entityId`);--> statement-breakpoint
CREATE INDEX `audit_events_created_idx` ON `audit_events` (`createdAt`);--> statement-breakpoint
CREATE INDEX `fixtures_schedule_idx` ON `fixtures` (`scheduledFor`);--> statement-breakpoint
CREATE INDEX `fixtures_home_idx` ON `fixtures` (`homeManagerId`);--> statement-breakpoint
CREATE INDEX `league_activity_created_idx` ON `league_activity` (`createdAt`);--> statement-breakpoint
CREATE INDEX `league_members_name_idx` ON `league_members` (`fullName`);--> statement-breakpoint
CREATE INDEX `league_members_role_idx` ON `league_members` (`leagueRole`);--> statement-breakpoint
CREATE INDEX `managers_active_idx` ON `managers` (`isActive`);--> statement-breakpoint
CREATE INDEX `team_messages_manager_idx` ON `private_team_messages` (`managerId`);--> statement-breakpoint
CREATE INDEX `trade_messages_thread_idx` ON `public_trade_messages` (`threadId`);--> statement-breakpoint
CREATE INDEX `trade_offers_thread_idx` ON `public_trade_offers` (`threadId`);--> statement-breakpoint
CREATE INDEX `trade_offers_buyer_idx` ON `public_trade_offers` (`buyerManagerId`);--> statement-breakpoint
CREATE INDEX `trade_threads_status_idx` ON `public_trade_threads` (`status`);--> statement-breakpoint
CREATE INDEX `trade_threads_seller_idx` ON `public_trade_threads` (`sellerManagerId`);--> statement-breakpoint
CREATE INDEX `roster_entries_manager_idx` ON `roster_entries` (`managerId`);