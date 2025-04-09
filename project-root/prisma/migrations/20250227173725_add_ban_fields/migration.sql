-- AlterTable
ALTER TABLE `user` ADD COLUMN `banReason` VARCHAR(191) NULL,
    ADD COLUMN `bannedUntil` DATETIME(3) NULL,
    ADD COLUMN `isBanned` BOOLEAN NOT NULL DEFAULT false;
