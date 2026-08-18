-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NULL,
    `auth_provider` ENUM('LOCAL', 'KAKAO', 'GOOGLE', 'APPLE') NOT NULL DEFAULT 'LOCAL',
    `nickname` VARCHAR(50) NOT NULL,
    `gender` ENUM('MALE', 'FEMALE', 'OTHER') NULL,
    `age` INTEGER NULL,
    `current_fuel` INTEGER NULL DEFAULT 0,
    `refresh_token` TEXT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'WITHDRAWN') NOT NULL DEFAULT 'ACTIVE',
    `last_login_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `idx_user_email`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tammy_statuses` (
    `user_id` INTEGER NOT NULL,
    `level` INTEGER NOT NULL DEFAULT 1,
    `current_exp` INTEGER NOT NULL DEFAULT 0,
    `empathy_index` INTEGER NOT NULL DEFAULT 0,
    `health_index` INTEGER NOT NULL DEFAULT 0,
    `activity_index` INTEGER NOT NULL DEFAULT 0,
    `happiness_index` INTEGER NOT NULL DEFAULT 0,
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quick_logs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `category` ENUM('WATER', 'EMOTION', 'JOURNAL', 'EXERCISE') NOT NULL,
    `amount` INTEGER NULL,
    `emotion_type` VARCHAR(50) NULL,
    `journal_content` TEXT NULL,
    `duration_minutes` INTEGER NULL,
    `burned_calories_kcal` INTEGER NULL DEFAULT 0,
    `earned_fuel` INTEGER NOT NULL DEFAULT 10,
    `client_request_id` VARCHAR(64) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `uk_quick_log_client_request_id`(`client_request_id`),
    INDEX `idx_quick_log_user_created`(`user_id`, `created_at` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

-- CreateTable
CREATE TABLE `planets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `planet_type` ENUM('MEAL', 'WATER', 'EMOTION', 'LIFESTYLE', 'RETROSPECT') NOT NULL,
    `required_fuel` INTEGER NOT NULL DEFAULT 100,
    `description` TEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `meal_planets` (
    `planet_id` INTEGER NOT NULL,
    `target_calories_kcal` INTEGER NOT NULL DEFAULT 0,
    `target_carbohydrate_g` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `target_protein_g` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `target_fat_g` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,

    PRIMARY KEY (`planet_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `water_planets` (
    `planet_id` INTEGER NOT NULL,
    `target_water_ml` INTEGER NOT NULL DEFAULT 2000,
    `min_intake_count` INTEGER NOT NULL DEFAULT 4,

    PRIMARY KEY (`planet_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `emotion_planets` (
    `planet_id` INTEGER NOT NULL,
    `min_empathy_score` INTEGER NOT NULL DEFAULT 0,
    `min_happiness_score` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`planet_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lifestyle_planets` (
    `planet_id` INTEGER NOT NULL,
    `target_workout_duration` INTEGER NOT NULL DEFAULT 30,
    `daily_routine_target` INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY (`planet_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `retrospect_planets` (
    `planet_id` INTEGER NOT NULL,
    `period_days` INTEGER NOT NULL DEFAULT 7,
    `auto_trigger_cron` VARCHAR(50) NOT NULL DEFAULT '0 0 * * 0',

    PRIMARY KEY (`planet_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `planet_travels` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `planet_id` INTEGER NULL,
    `planet_type` ENUM('MEAL', 'WATER', 'EMOTION', 'LIFESTYLE', 'RETROSPECT') NOT NULL,
    `fuel_spent` INTEGER NOT NULL,
    `status` ENUM('IN_PROGRESS', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'IN_PROGRESS',
    `title` VARCHAR(255) NULL,
    `summary_content` TEXT NULL,
    `recommendations` TEXT NULL,
    `started_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `completed_at` TIMESTAMP(0) NULL,
    `deleted_at` TIMESTAMP(0) NULL,

    INDEX `idx_travel_user_started`(`user_id`, `started_at` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `foods` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `representative_name` VARCHAR(100) NULL,
    `standard_serving_g` DECIMAL(6, 2) NOT NULL DEFAULT 100.00,
    `total_weight_g` DECIMAL(6, 2) NULL,
    `calories_kcal` INTEGER NOT NULL DEFAULT 0,
    `carbohydrate_g` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `protein_g` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `fat_g` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `vitamin_percent` INTEGER NOT NULL DEFAULT 0,
    `mineral_percent` INTEGER NOT NULL DEFAULT 0,
    `category` VARCHAR(50) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `foods_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `food_mappings` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `raw_name` VARCHAR(100) NOT NULL,
    `food_id` INTEGER NOT NULL,
    `match_type` ENUM('EXACT', 'ALIAS', 'USER_CONFIRMED') NOT NULL DEFAULT 'EXACT',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `food_mappings_raw_name_key`(`raw_name`),
    INDEX `idx_food_mapping_raw`(`raw_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `meals` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `meal_type` ENUM('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK') NOT NULL,
    `comment` VARCHAR(255) NULL,
    `total_calories_kcal` INTEGER NOT NULL DEFAULT 0,
    `total_carbohydrate_g` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `total_protein_g` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `total_fat_g` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `vitamin_percent` INTEGER NOT NULL DEFAULT 0,
    `mineral_percent` INTEGER NOT NULL DEFAULT 0,
    `registered_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` TIMESTAMP(0) NULL,

    INDEX `idx_user_meal_registered`(`user_id`, `registered_at` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `meal_images` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `meal_id` BIGINT NULL,
    `image_url` VARCHAR(255) NOT NULL,
    `is_cover` BOOLEAN NOT NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_meal_image_meal`(`meal_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `meal_items` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `meal_id` BIGINT NOT NULL,
    `meal_image_id` BIGINT NULL,
    `food_id` INTEGER NULL,
    `custom_food_name` VARCHAR(100) NOT NULL,
    `intake_gram` DECIMAL(6, 2) NOT NULL DEFAULT 100.00,
    `bounding_box` JSON NULL,
    `confidence` DECIMAL(5, 4) NULL,

    INDEX `idx_meal_item_image`(`meal_image_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chat_messages` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `sender` ENUM('USER', 'TAMMY', 'TAMMY_AI') NOT NULL,
    `message_text` TEXT NOT NULL,
    `motion_tag` VARCHAR(50) NULL,
    `intent_label` VARCHAR(50) NULL,
    `labels` JSON NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `is_edited` BOOLEAN NOT NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_user_msg_created`(`user_id`, `created_at` DESC),
    INDEX `idx_msg_intent_label`(`intent_label`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `proactive_triggers` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `trigger_type` ENUM('NEG_EMOTION', 'NO_WATER', 'NO_EXERCISE', 'SYSTEM') NOT NULL,
    `reference_id` BIGINT NULL,
    `message_text` TEXT NOT NULL,
    `status` ENUM('PENDING', 'SENT', 'RESPONDED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_user_trigger_created`(`user_id`, `created_at` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_action_logs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `screen_name` VARCHAR(100) NOT NULL,
    `action_type` ENUM('CLICK', 'SCREEN_VIEW', 'SCROLL', 'TEXT_INPUT', 'BUTTON_TAP') NOT NULL,
    `target_element_id` VARCHAR(100) NULL,
    `metadata` JSON NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_action_user_created`(`user_id`, `created_at` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tammy_status_logs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `change_reason` ENUM('MEAL_LOG', 'WORKOUT_CHECK', 'WATER_LOG', 'MOOD_LOG', 'CHAT_EMPATHY', 'LEVEL_UP', 'WARP') NOT NULL,
    `delta_exp` INTEGER NOT NULL DEFAULT 0,
    `delta_empathy` INTEGER NOT NULL DEFAULT 0,
    `delta_health` INTEGER NOT NULL DEFAULT 0,
    `delta_activity` INTEGER NOT NULL DEFAULT 0,
    `delta_happiness` INTEGER NOT NULL DEFAULT 0,
    `snapshot_level` INTEGER NOT NULL,
    `snapshot_total_exp` INTEGER NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_tammy_log_user_created`(`user_id`, `created_at` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_push_tokens` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `device_token` VARCHAR(255) NOT NULL,
    `device_type` ENUM('IOS', 'ANDROID', 'WEB') NOT NULL DEFAULT 'IOS',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_push_token_user`(`user_id`),
    UNIQUE INDEX `uq_user_device_token`(`user_id`, `device_token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tammy_statuses` ADD CONSTRAINT `tammy_statuses_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quick_logs` ADD CONSTRAINT `quick_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_planet_progress` ADD CONSTRAINT `user_planet_progress_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fuel_logs` ADD CONSTRAINT `fuel_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `monthly_retro_reports` ADD CONSTRAINT `monthly_retro_reports_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `planet_reports` ADD CONSTRAINT `planet_reports_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `meal_planets` ADD CONSTRAINT `meal_planets_planet_id_fkey` FOREIGN KEY (`planet_id`) REFERENCES `planets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `water_planets` ADD CONSTRAINT `water_planets_planet_id_fkey` FOREIGN KEY (`planet_id`) REFERENCES `planets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `emotion_planets` ADD CONSTRAINT `emotion_planets_planet_id_fkey` FOREIGN KEY (`planet_id`) REFERENCES `planets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lifestyle_planets` ADD CONSTRAINT `lifestyle_planets_planet_id_fkey` FOREIGN KEY (`planet_id`) REFERENCES `planets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `retrospect_planets` ADD CONSTRAINT `retrospect_planets_planet_id_fkey` FOREIGN KEY (`planet_id`) REFERENCES `planets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `planet_travels` ADD CONSTRAINT `planet_travels_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `planet_travels` ADD CONSTRAINT `planet_travels_planet_id_fkey` FOREIGN KEY (`planet_id`) REFERENCES `planets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `food_mappings` ADD CONSTRAINT `food_mappings_food_id_fkey` FOREIGN KEY (`food_id`) REFERENCES `foods`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `meals` ADD CONSTRAINT `meals_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `meal_images` ADD CONSTRAINT `meal_images_meal_id_fkey` FOREIGN KEY (`meal_id`) REFERENCES `meals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `meal_items` ADD CONSTRAINT `meal_items_meal_id_fkey` FOREIGN KEY (`meal_id`) REFERENCES `meals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `meal_items` ADD CONSTRAINT `meal_items_food_id_fkey` FOREIGN KEY (`food_id`) REFERENCES `foods`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `meal_items` ADD CONSTRAINT `meal_items_meal_image_id_fkey` FOREIGN KEY (`meal_image_id`) REFERENCES `meal_images`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_messages` ADD CONSTRAINT `chat_messages_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `proactive_triggers` ADD CONSTRAINT `proactive_triggers_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_action_logs` ADD CONSTRAINT `user_action_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tammy_status_logs` ADD CONSTRAINT `tammy_status_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_push_tokens` ADD CONSTRAINT `user_push_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

