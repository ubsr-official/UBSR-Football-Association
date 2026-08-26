CREATE TABLE `manager_balance_adjustments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`managerId` int NOT NULL,
	`amount` int NOT NULL,
	`reason` varchar(300) NOT NULL,
	`enteredByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `manager_balance_adjustments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `manager_balance_adjustments` ADD CONSTRAINT `manager_balance_adjustments_managerId_managers_id_fk` FOREIGN KEY (`managerId`) REFERENCES `managers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `manager_balance_adjustments` ADD CONSTRAINT `manager_balance_adjustments_enteredByUserId_users_id_fk` FOREIGN KEY (`enteredByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `balance_adjustments_manager_idx` ON `manager_balance_adjustments` (`managerId`);