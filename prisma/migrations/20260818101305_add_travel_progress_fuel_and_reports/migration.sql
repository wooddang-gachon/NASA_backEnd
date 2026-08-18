-- AlterTable
ALTER TABLE `quick_logs` ADD COLUMN `client_request_id` VARCHAR(64) NULL;

-- CreateTable
CREATE TABLE `user_planet_progress` (
    `user_id` INTEGER NOT NULL,
    `planet_id` VARCHAR(20) NOT NULL,
    `distance` INTEGER NOT NULL DEFAULT 100,
    `status` ENUM('READY', 'TRAVELING', 'ARRIVED') NOT NULL DEFAULT 'READY',
    `last_arrived_at` TIMESTAMP(0) NULL,
    `trip_count` INTEGER NOT NULL DEFAULT 0,
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`user_id`, `planet_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fuel_logs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `amount` INTEGER NOT NULL,
    `source` VARCHAR(30) NOT NULL,
    `source_ref_id` BIGINT NULL,
    `client_request_id` VARCHAR(64) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uk_fuel_log_client_request_id`(`client_request_id`),
    INDEX `idx_fuel_log_user_created`(`user_id`, `created_at` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `monthly_retro_reports` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `year_month` CHAR(7) NOT NULL,
    `wellness_score` INTEGER NULL,
    `content_json` JSON NOT NULL,
    `generated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uk_monthly_retro_user_month`(`user_id`, `year_month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `planet_reports` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `report_uuid` VARCHAR(64) NOT NULL,
    `user_id` INTEGER NOT NULL,
    `planet_id` VARCHAR(20) NOT NULL,
    `trip_number` INTEGER NOT NULL DEFAULT 1,
    `period_from` TIMESTAMP(0) NOT NULL,
    `period_to` TIMESTAMP(0) NOT NULL,
    `period_days` INTEGER NOT NULL DEFAULT 3,
    `headline` VARCHAR(255) NOT NULL,
    `summary` TEXT NOT NULL,
    `mindfulness_feedback` TEXT NULL,
    `recommendations` JSON NULL,
    `wellness_score` INTEGER NULL,
    `stats` JSON NULL,
    `activity_breakdown` JSON NULL,
    `tammy_motion` VARCHAR(50) NOT NULL DEFAULT 'BOUNCE',
    `data_density` VARCHAR(20) NOT NULL DEFAULT 'normal',
    `is_fallback` BOOLEAN NOT NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uk_planet_report_uuid`(`report_uuid`),
    INDEX `idx_planet_report_user_planet`(`user_id`, `planet_id`, `created_at` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `uk_quick_log_client_request_id` ON `quick_logs`(`client_request_id`);

-- AddForeignKey
ALTER TABLE `user_planet_progress` ADD CONSTRAINT `user_planet_progress_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fuel_logs` ADD CONSTRAINT `fuel_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `monthly_retro_reports` ADD CONSTRAINT `monthly_retro_reports_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `planet_reports` ADD CONSTRAINT `planet_reports_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
