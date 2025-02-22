/*
  Warnings:

  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `user`;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `cpf` VARCHAR(20) NOT NULL,
    `nome` VARCHAR(255) NULL,
    `data_nascimento` DATE NULL,

    UNIQUE INDEX `unique_email`(`email`),
    UNIQUE INDEX `unique_cpf`(`cpf`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
