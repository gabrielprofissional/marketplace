-- CreateTable
CREATE TABLE `Settings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `siteName` VARCHAR(191) NOT NULL DEFAULT 'Marketplace',
    `logoUrl` VARCHAR(191) NULL,
    `faviconUrl` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
