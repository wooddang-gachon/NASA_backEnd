-- ==============================================================================
-- TAMMY v3 DDL SQL Schema Definition
-- dbdiagram.dbml 및 Data Model & DB Schema.md 명세와 100% 동기화된 완성형 SQL
-- ==============================================================================

-- 1. ENUM 타입 정의
CREATE TYPE AuthProvider AS ENUM ('LOCAL', 'KAKAO', 'GOOGLE', 'APPLE');
CREATE TYPE UserStatus AS ENUM ('ACTIVE', 'INACTIVE', 'WITHDRAWN');
CREATE TYPE Gender AS ENUM ('MALE', 'FEMALE', 'OTHER');
CREATE TYPE LogCategory AS ENUM ('WATER', 'EMOTION', 'JOURNAL', 'EXERCISE');
CREATE TYPE PlanetType AS ENUM ('MEAL', 'WATER', 'EMOTION', 'LIFESTYLE', 'RETROSPECT');
CREATE TYPE TravelStatus AS ENUM ('IN_PROGRESS', 'COMPLETED', 'FAILED');
CREATE TYPE Sender AS ENUM ('USER', 'TAMMY', 'TAMMY_AI');
CREATE TYPE MealType AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK');
CREATE TYPE EmotionState AS ENUM ('HAPPY', 'SAD', 'ANGRY', 'STRESSED', 'CALM');
CREATE TYPE ActivityType AS ENUM ('BODY_SPEC', 'EXERCISE', 'MEAL', 'WATER', 'EMOTION');
CREATE TYPE TriggerType AS ENUM ('NEG_EMOTION', 'NO_WATER', 'NO_EXERCISE', 'SYSTEM');
CREATE TYPE ProactiveStatus AS ENUM ('PENDING', 'SENT', 'RESPONDED', 'EXPIRED');
CREATE TYPE ActionType AS ENUM ('CLICK', 'SCREEN_VIEW', 'SCROLL', 'TEXT_INPUT', 'BUTTON_TAP');
CREATE TYPE ChangeReason AS ENUM ('MEAL_LOG', 'WORKOUT_CHECK', 'WATER_LOG', 'MOOD_LOG', 'CHAT_EMPATHY', 'LEVEL_UP', 'WARP');

-- ==============================================================================
-- 2. 사용자 & 캐릭터 도메인
-- ==============================================================================

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NULL,
    auth_provider AuthProvider NOT NULL DEFAULT 'LOCAL',
    nickname VARCHAR(50) NOT NULL,
    gender Gender NULL,
    age INT NULL,
    target_weight_kg DECIMAL(5,2) NULL,
    preferred_exercise VARCHAR(100) NULL,
    exercise_location VARCHAR(50) NULL,
    preferred_exercise_time VARCHAR(50) NULL,
    water_goal_ml INT DEFAULT 2000,
    calorie_goal_kcal INT DEFAULT 2000,
    current_fuel INT DEFAULT 0,
    refresh_token TEXT NULL,
    status UserStatus NOT NULL DEFAULT 'ACTIVE',
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email (email)
);

CREATE TABLE tammy_statuses (
    user_id INT PRIMARY KEY,
    level INT DEFAULT 1,
    current_exp INT DEFAULT 0,
    empathy_index INT DEFAULT 0,
    health_index INT DEFAULT 0,
    activity_index INT DEFAULT 0,
    happiness_index INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE user_body_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    height_cm DECIMAL(5,2) NOT NULL,
    weight_kg DECIMAL(5,2) NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_body_recorded (user_id, recorded_at)
);

-- ==============================================================================
-- 3. 1-Tap 퀵버튼 & 데일리 케어 도메인
-- ==============================================================================

CREATE TABLE quick_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category LogCategory NOT NULL,
    amount INT NULL,
    emotion_type VARCHAR(50) NULL,
    journal_content TEXT NULL,
    duration_minutes INT NULL,
    earned_fuel INT DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_quick_log_user_created (user_id, created_at)
);

CREATE TABLE exercise_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    duration_minutes INT DEFAULT 0,
    burned_calories_kcal INT DEFAULT 0,
    is_completed BOOLEAN DEFAULT TRUE,
    memo VARCHAR(255) NULL,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_exercise_performed (user_id, performed_at)
);

CREATE TABLE water_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    intake_ml INT NOT NULL DEFAULT 250,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_water_recorded (user_id, recorded_at)
);

CREATE TABLE emotion_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    emotion_state EmotionState NOT NULL,
    cause_summary VARCHAR(255) NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_emotion_recorded (user_id, recorded_at)
);

-- ==============================================================================
-- 4. 행성 마스터 & 5대 행성 1:1 특화 도메인
-- ==============================================================================

CREATE TABLE planets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    planet_type PlanetType NOT NULL,
    required_fuel INT DEFAULT 100,
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE meal_planets (
    planet_id INT PRIMARY KEY,
    target_calories_kcal INT DEFAULT 0,
    target_carbohydrate_g DECIMAL(5,2) DEFAULT 0.00,
    target_protein_g DECIMAL(5,2) DEFAULT 0.00,
    target_fat_g DECIMAL(5,2) DEFAULT 0.00,
    FOREIGN KEY (planet_id) REFERENCES planets(id) ON DELETE CASCADE
);

CREATE TABLE water_planets (
    planet_id INT PRIMARY KEY,
    target_water_ml INT DEFAULT 2000,
    min_intake_count INT DEFAULT 4,
    FOREIGN KEY (planet_id) REFERENCES planets(id) ON DELETE CASCADE
);

CREATE TABLE emotion_planets (
    planet_id INT PRIMARY KEY,
    min_empathy_score INT DEFAULT 0,
    min_happiness_score INT DEFAULT 0,
    FOREIGN KEY (planet_id) REFERENCES planets(id) ON DELETE CASCADE
);

CREATE TABLE lifestyle_planets (
    planet_id INT PRIMARY KEY,
    target_workout_duration INT DEFAULT 30,
    daily_routine_target INT DEFAULT 1,
    FOREIGN KEY (planet_id) REFERENCES planets(id) ON DELETE CASCADE
);

CREATE TABLE retrospect_planets (
    planet_id INT PRIMARY KEY,
    period_days INT DEFAULT 7,
    auto_trigger_cron VARCHAR(50) DEFAULT '0 0 * * 0',
    FOREIGN KEY (planet_id) REFERENCES planets(id) ON DELETE CASCADE
);

CREATE TABLE planet_travels (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    planet_id INT NULL,
    planet_type PlanetType NOT NULL,
    fuel_spent INT NOT NULL,
    status TravelStatus DEFAULT 'IN_PROGRESS',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (planet_id) REFERENCES planets(id) ON DELETE SET NULL,
    INDEX idx_travel_user_started (user_id, started_at)
);

-- ==============================================================================
-- 5. 식단 & 영양 마스터 도메인
-- ==============================================================================

CREATE TABLE `foods` (
    `id`                  INT AUTO_INCREMENT PRIMARY KEY,
    `name`                VARCHAR(100) NOT NULL UNIQUE COMMENT '표준 음식 명칭',
    `representative_name` VARCHAR(100) NULL COMMENT '식약처 대표식품명',
    `standard_serving_g`  DECIMAL(6, 2) NOT NULL DEFAULT 100.00 COMMENT '영양성분 함량 기준 중량(g)',
    `total_weight_g`      DECIMAL(6, 2) NULL COMMENT '식품 총 중량(g)',
    `calories_kcal`      INT NOT NULL DEFAULT 0 COMMENT '열량(kcal)',
    `carbohydrate_g`     DECIMAL(5, 2) NOT NULL DEFAULT 0.00 COMMENT '탄수화물(g)',
    `protein_g`          DECIMAL(5, 2) NOT NULL DEFAULT 0.00 COMMENT '단백질(g)',
    `fat_g`              DECIMAL(5, 2) NOT NULL DEFAULT 0.00 COMMENT '지방(g)',
    `vitamin_percent`    INT NOT NULL DEFAULT 0 COMMENT '일일 권장 비타민 비율(%)',
    `mineral_percent`    INT NOT NULL DEFAULT 0 COMMENT '일일 권장 미네랄 비율(%)',
    `category`           VARCHAR(50) NULL COMMENT '음식 카테고리 (식품대분류명)',
    `created_at`         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE meals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    meal_type MealType NOT NULL,
    comment VARCHAR(255) NULL,
    total_calories_kcal INT DEFAULT 0,
    total_carbohydrate_g DECIMAL(5,2) DEFAULT 0.00,
    total_protein_g DECIMAL(5,2) DEFAULT 0.00,
    total_fat_g DECIMAL(5,2) DEFAULT 0.00,
    vitamin_percent INT DEFAULT 0,
    mineral_percent INT DEFAULT 0,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_meal_registered (user_id, registered_at)
);

CREATE TABLE meal_images (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    meal_id BIGINT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    is_cover BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE,
    INDEX idx_meal_image_meal (meal_id)
);

CREATE TABLE meal_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    meal_id BIGINT NOT NULL,
    food_id INT NULL,
    custom_food_name VARCHAR(100) NOT NULL,
    intake_gram DECIMAL(6,2) DEFAULT 100.00,
    calories_kcal INT DEFAULT 0,
    carbohydrate_g DECIMAL(5,2) DEFAULT 0.00,
    protein_g DECIMAL(5,2) DEFAULT 0.00,
    fat_g DECIMAL(5,2) DEFAULT 0.00,
    FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE,
    FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE SET NULL
);

-- ==============================================================================
-- 6. 대화 & 장기 기억 & 리포트 도메인
-- ==============================================================================

CREATE TABLE chat_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    sender Sender NOT NULL,
    message_text TEXT NOT NULL,
    motion_tag VARCHAR(50) NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_msg_created (user_id, created_at)
);

CREATE TABLE chat_message_edits (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    chat_message_id BIGINT NOT NULL,
    previous_text TEXT NOT NULL,
    edited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_message_id) REFERENCES chat_messages(id) ON DELETE CASCADE
);

CREATE TABLE chat_message_archives (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    chat_message_id BIGINT NULL,
    sender Sender NOT NULL,
    message_text TEXT NOT NULL,
    raw_payload JSON NULL,
    created_at TIMESTAMP NOT NULL,
    archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_archive_user_created (user_id, created_at)
);

CREATE TABLE long_term_memories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    chat_message_archive_id BIGINT NULL,
    category VARCHAR(50) NOT NULL,
    memory_content TEXT NOT NULL,
    importance_score INT DEFAULT 1,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (chat_message_archive_id) REFERENCES chat_message_archives(id) ON DELETE SET NULL,
    UNIQUE KEY uq_user_category (user_id, category)
);

CREATE TABLE reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    planet_travel_id BIGINT UNIQUE NULL,
    planet_type PlanetType NOT NULL,
    title VARCHAR(255) NOT NULL,
    summary_content TEXT NOT NULL,
    recommendations TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (planet_travel_id) REFERENCES planet_travels(id) ON DELETE SET NULL
);

CREATE TABLE monthly_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    report_year_month CHAR(7) NOT NULL,
    health_score INT DEFAULT 0,
    summary_content TEXT NULL,
    aggregated_data JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_user_report_month (user_id, report_year_month)
);

-- ==============================================================================
-- 7. 이벤트 & 수집 로그 도메인
-- ==============================================================================

CREATE TABLE activity_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    activity_type ActivityType NOT NULL,
    activity_details JSON NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_activity_recorded (user_id, recorded_at)
);

CREATE TABLE proactive_triggers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    trigger_type TriggerType NOT NULL,
    reference_id BIGINT NULL,
    message_text TEXT NOT NULL,
    status ProactiveStatus DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_trigger_created (user_id, created_at)
);

CREATE TABLE user_action_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    screen_name VARCHAR(100) NOT NULL,
    action_type ActionType NOT NULL,
    target_element_id VARCHAR(100) NULL,
    metadata JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_action_user_created (user_id, created_at)
);

CREATE TABLE tammy_status_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    change_reason ChangeReason NOT NULL,
    delta_exp INT DEFAULT 0,
    delta_empathy INT DEFAULT 0,
    delta_health INT DEFAULT 0,
    delta_activity INT DEFAULT 0,
    delta_happiness INT DEFAULT 0,
    snapshot_level INT NOT NULL,
    snapshot_total_exp INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_tammy_log_user_created (user_id, created_at)
);
