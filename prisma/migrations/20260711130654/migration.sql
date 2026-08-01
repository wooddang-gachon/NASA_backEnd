-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nickname` VARCHAR(50) NOT NULL,
    `gender` ENUM('MALE', 'FEMALE', 'OTHER') NULL,
    `age` INTEGER NULL,
    `target_weight_kg` DECIMAL(5, 2) NULL,
    `preferred_exercise` VARCHAR(100) NULL,
    `exercise_location` VARCHAR(50) NULL,
    `preferred_exercise_time` VARCHAR(50) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

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
CREATE TABLE `user_body_logs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `height_cm` DECIMAL(5, 2) NOT NULL,
    `weight_kg` DECIMAL(5, 2) NOT NULL,
    `recorded_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_user_body_recorded`(`user_id`, `recorded_at` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `planets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `planet_type` ENUM('EXERCISE', 'NUTRITION', 'EMOTION', 'CHALLENGE') NOT NULL,
    `required_fuel` INTEGER NOT NULL DEFAULT 100,
    `description` TEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_planet_type`(`id`, `planet_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exercise_planets` (
    `planet_id` INTEGER NOT NULL,
    `target_workout_count` INTEGER NOT NULL DEFAULT 0,
    `target_duration_minutes` INTEGER NOT NULL DEFAULT 0,
    `preferred_category` VARCHAR(50) NULL,
    `planet_type` ENUM('EXERCISE', 'NUTRITION', 'EMOTION', 'CHALLENGE') NOT NULL DEFAULT 'EXERCISE',

    PRIMARY KEY (`planet_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `nutrition_planets` (
    `planet_id` INTEGER NOT NULL,
    `target_calories_kcal` INTEGER NOT NULL DEFAULT 0,
    `target_carbohydrate_g` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `target_protein_g` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `target_fat_g` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `planet_type` ENUM('EXERCISE', 'NUTRITION', 'EMOTION', 'CHALLENGE') NOT NULL DEFAULT 'NUTRITION',

    PRIMARY KEY (`planet_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `emotion_planets` (
    `planet_id` INTEGER NOT NULL,
    `min_empathy_score` INTEGER NOT NULL DEFAULT 0,
    `min_happiness_score` INTEGER NOT NULL DEFAULT 0,
    `planet_type` ENUM('EXERCISE', 'NUTRITION', 'EMOTION', 'CHALLENGE') NOT NULL DEFAULT 'EMOTION',

    PRIMARY KEY (`planet_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `challenge_planets` (
    `planet_id` INTEGER NOT NULL,
    `challenge_description` TEXT NULL,
    `reward_badge_name` VARCHAR(100) NULL,
    `planet_type` ENUM('EXERCISE', 'NUTRITION', 'EMOTION', 'CHALLENGE') NOT NULL DEFAULT 'CHALLENGE',

    PRIMARY KEY (`planet_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chat_messages` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `sender` ENUM('USER', 'TAMMY') NOT NULL,
    `message_text` TEXT NOT NULL,
    `is_edited` BOOLEAN NOT NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_user_msg_created`(`user_id`, `created_at` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chat_message_edits` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `chat_message_id` BIGINT NOT NULL,
    `previous_text` TEXT NOT NULL,
    `edited_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `long_term_memories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `category` VARCHAR(50) NOT NULL,
    `memory_content` TEXT NOT NULL,
    `importance_score` INTEGER NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_user_category`(`user_id`, `category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exercises` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `met_value` DECIMAL(4, 2) NOT NULL DEFAULT 1.00,
    `category` VARCHAR(50) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `name`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exercise_logs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `exercise_id` INTEGER NOT NULL,
    `duration_minutes` INTEGER NOT NULL,
    `burned_calories_kcal` INTEGER NOT NULL DEFAULT 0,
    `is_completed` BOOLEAN NOT NULL DEFAULT true,
    `performed_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_user_exercise_performed`(`user_id`, `performed_at` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `meals` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `meal_type` ENUM('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK') NOT NULL,
    `image_url` VARCHAR(255) NULL,
    `comment` VARCHAR(255) NULL,
    `total_calories_kcal` INTEGER NOT NULL DEFAULT 0,
    `total_carbohydrate_g` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `total_protein_g` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `total_fat_g` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `registered_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_user_meal_registered`(`user_id`, `registered_at` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `meal_items` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `meal_id` BIGINT NOT NULL,
    `food_name` VARCHAR(100) NOT NULL,
    `calories_kcal` INTEGER NOT NULL DEFAULT 0,
    `carbohydrate_g` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `protein_g` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `fat_g` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `water_logs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `intake_ml` INTEGER NOT NULL,
    `recorded_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_user_water_recorded`(`user_id`, `recorded_at` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `emotion_logs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `emotion_state` ENUM('HAPPY', 'SAD', 'ANGRY', 'STRESSED', 'CALM') NOT NULL,
    `cause_summary` VARCHAR(255) NULL,
    `recorded_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_user_emotion_recorded`(`user_id`, `recorded_at` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activity_logs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `activity_type` ENUM('BODY_SPEC', 'EXERCISE', 'MEAL', 'WATER', 'EMOTION') NOT NULL,
    `activity_details` JSON NOT NULL,
    `recorded_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_user_activity_recorded`(`user_id`, `recorded_at` DESC),
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
    `triggered_at` TIMESTAMP(0) NULL,
    `resolved_at` TIMESTAMP(0) NULL,

    INDEX `idx_user_trigger_created`(`user_id`, `created_at` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `space_travel_states` (
    `user_id` INTEGER NOT NULL,
    `current_fuel` INTEGER NOT NULL DEFAULT 0,
    `ship_coordinate_x` DECIMAL(8, 4) NOT NULL DEFAULT 0.0000,
    `ship_coordinate_y` DECIMAL(8, 4) NOT NULL DEFAULT 0.0000,
    `current_planet_id` INTEGER NOT NULL DEFAULT 1,
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `planet_histories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `planet_id` INTEGER NOT NULL,
    `reached_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `growth_summary` TEXT NULL,

    INDEX `idx_user_planet_reached`(`user_id`, `reached_at` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `monthly_reports` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `report_year_month` CHAR(7) NOT NULL,
    `health_score` INTEGER NOT NULL DEFAULT 0,
    `summary_content` TEXT NULL,
    `aggregated_data` JSON NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_user_month`(`user_id`, `report_year_month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tammy_statuses` ADD CONSTRAINT `tammy_statuses_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_body_logs` ADD CONSTRAINT `user_body_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exercise_planets` ADD CONSTRAINT `exercise_planets_planet_id_fkey` FOREIGN KEY (`planet_id`) REFERENCES `planets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nutrition_planets` ADD CONSTRAINT `nutrition_planets_planet_id_fkey` FOREIGN KEY (`planet_id`) REFERENCES `planets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `emotion_planets` ADD CONSTRAINT `emotion_planets_planet_id_fkey` FOREIGN KEY (`planet_id`) REFERENCES `planets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `challenge_planets` ADD CONSTRAINT `challenge_planets_planet_id_fkey` FOREIGN KEY (`planet_id`) REFERENCES `planets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_messages` ADD CONSTRAINT `chat_messages_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_message_edits` ADD CONSTRAINT `chat_message_edits_chat_message_id_fkey` FOREIGN KEY (`chat_message_id`) REFERENCES `chat_messages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `long_term_memories` ADD CONSTRAINT `long_term_memories_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exercise_logs` ADD CONSTRAINT `exercise_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exercise_logs` ADD CONSTRAINT `exercise_logs_exercise_id_fkey` FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `meals` ADD CONSTRAINT `meals_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `meal_items` ADD CONSTRAINT `meal_items_meal_id_fkey` FOREIGN KEY (`meal_id`) REFERENCES `meals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `water_logs` ADD CONSTRAINT `water_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `emotion_logs` ADD CONSTRAINT `emotion_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `proactive_triggers` ADD CONSTRAINT `proactive_triggers_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `space_travel_states` ADD CONSTRAINT `space_travel_states_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `space_travel_states` ADD CONSTRAINT `space_travel_states_current_planet_id_fkey` FOREIGN KEY (`current_planet_id`) REFERENCES `planets`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `planet_histories` ADD CONSTRAINT `planet_histories_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `planet_histories` ADD CONSTRAINT `planet_histories_planet_id_fkey` FOREIGN KEY (`planet_id`) REFERENCES `planets`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `monthly_reports` ADD CONSTRAINT `monthly_reports_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
