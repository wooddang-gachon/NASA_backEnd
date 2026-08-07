import { getPrisma } from "../src/loaders/prisma";

const prisma = getPrisma();

async function main() {
  console.log("🌱 Starting Prisma database seeding...");

  // 1. 테스트 사용자 생성 (users)
  const user = await prisma.users.upsert({
    where: { email: "user@example.com" },
    update: {
      nickname: "우주탐험가",
      gender: "FEMALE",
      age: 25,
    },
    create: {
      email: "user@example.com",
      password_hash: "$2b$10$wT8KzQ89N8E790Q/vJ3XEOl3h1J.98.vQY0.nZJ7zH7bXG9z/W8.2", // Password123!
      auth_provider: "LOCAL",
      nickname: "우주탐험가",
      gender: "FEMALE",
      age: 25,
      status: "ACTIVE",
    },
  });

  console.log(`👤 User created/updated: ${user.nickname} (${user.email})`);

  // 2. 타미 캐릭터 상태 (tammy_statuses)
  const tammyStatus = await prisma.tammy_statuses.upsert({
    where: { user_id: user.id },
    update: {
      level: 3,
      current_exp: 250,
      empathy_index: 85,
      health_index: 90,
      activity_index: 75,
      happiness_index: 95,
    },
    create: {
      user_id: user.id,
      level: 3,
      current_exp: 250,
      empathy_index: 85,
      health_index: 90,
      activity_index: 75,
      happiness_index: 95,
    },
  });

  console.log(`🐱 Tammy status initialized: Lv.${tammyStatus.level} (EXP: ${tammyStatus.current_exp})`);

  // 3. 탐사 행성 마스터 (planets)
  const planet1 = await prisma.planets.upsert({
    where: { id: 1 },
    update: { name: "아쿠아 웰니스 행성", planet_type: "EXERCISE", required_fuel: 300 },
    create: { id: 1, name: "아쿠아 웰니스 행성", planet_type: "EXERCISE", required_fuel: 300, description: "맑은 물과 생명력이 넘치는 첫 번째 웰니스 행성" },
  });

  const planet2 = await prisma.planets.upsert({
    where: { id: 2 },
    update: { name: "비타민 에너제틱 행성", planet_type: "NUTRITION", required_fuel: 500 },
    create: { id: 2, name: "비타민 에너제틱 행성", planet_type: "NUTRITION", required_fuel: 500, description: "풍부한 영양소와 단백질이 우주 광선으로 빛나는 행성" },
  });

  const planet3 = await prisma.planets.upsert({
    where: { id: 3 },
    update: { name: "마인드 힐링 행성", planet_type: "EMOTION", required_fuel: 800 },
    create: { id: 3, name: "마인드 힐링 행성", planet_type: "EMOTION", required_fuel: 800, description: "따뜻한 공감과 심리적 안식을 선물하는 타미의 고향 행성" },
  });

  console.log(`🪐 Planets created: ${planet1.name}, ${planet2.name}, ${planet3.name}`);

  // 4. 별여행 탐사 상태 (space_travel_states)
  const travelState = await prisma.space_travel_states.upsert({
    where: { user_id: user.id },
    update: {
      current_planet_id: planet1.id,
      current_fuel: 200,
      ship_coordinate_x: 66.5,
      ship_coordinate_y: 32.0,
    },
    create: {
      user_id: user.id,
      current_planet_id: planet1.id,
      current_fuel: 200,
      ship_coordinate_x: 66.5,
      ship_coordinate_y: 32.0,
    },
  });

  console.log(`🚀 Space travel state initialized: Planet #${travelState.current_planet_id} (Fuel: ${travelState.current_fuel})`);

  // 5. 표준 음식 마스터 (foods)
  const food1 = await prisma.foods.upsert({
    where: { id: 1 },
    update: { name: "연어 샐러드", calories_kcal: 380 },
    create: {
      id: 1,
      name: "연어 샐러드",
      standard_serving_g: 250,
      calories_kcal: 380,
      carbohydrate_g: 14.5,
      protein_g: 32.0,
      fat_g: 11.2,
    },
  });

  const food2 = await prisma.foods.upsert({
    where: { id: 2 },
    update: { name: "닭가슴살 아보카도 샌드위치", calories_kcal: 450 },
    create: {
      id: 2,
      name: "닭가슴살 아보카도 샌드위치",
      standard_serving_g: 200,
      calories_kcal: 450,
      carbohydrate_g: 40.0,
      protein_g: 28.0,
      fat_g: 14.0,
    },
  });

  console.log(`🥗 Foods created: ${food1.name}, ${food2.name}`);

  // 6. 식단 기록 (meals & meal_items & meal_images)
  const meal = await prisma.meals.create({
    data: {
      user_id: user.id,
      meal_type: "LUNCH",
      comment: "단백질과 미네랄 풍부! 맛있게 잘 먹었어요 🥗",
      total_calories_kcal: 380,
      total_carbohydrate_g: 14.5,
      total_protein_g: 32.0,
      total_fat_g: 11.2,
      meal_images: {
        create: [
          {
            image_url: "https://storage.tammy.app/meals/salmon_salad.jpg",
            is_cover: true,
          },
        ],
      },
      meal_items: {
        create: [
          {
            food_name: "연어 샐러드",
            calories_kcal: 380,
            carbohydrate_g: 14.5,
            protein_g: 32.0,
            fat_g: 11.2,
            food_id: food1.id,
          },
        ],
      },
    },
  });

  console.log(`🍲 Meal log recorded: ID #${meal.id} (${meal.meal_type})`);

  // 7. 1-Tap 수분 섭취 및 운동 완료 기록 (water_logs & exercise_logs)
  await prisma.water_logs.create({
    data: {
      user_id: user.id,
      intake_ml: 250,
    },
  });

  const workoutLog = await prisma.exercise_logs.create({
    data: {
      user_id: user.id,
      is_completed: true,
      duration_minutes: 30,
      burned_calories_kcal: 150,
    },
  });

  console.log(`💧 Water log & 🏃 Workout log (#${workoutLog.id}) created.`);

  // 8. AI 공감 대화 & 기억 캡슐 (chat_messages & long_term_memories)
  const chatMsg = await prisma.chat_messages.create({
    data: {
      user_id: user.id,
      sender: "USER",
      message_text: "오늘 다이어트하면서 산책 다녀왔는데 스트레스가 좀 풀렸어!",
    },
  });

  await prisma.chat_messages.create({
    data: {
      user_id: user.id,
      sender: "TAMMY",
      message_text: "우주탐험가님, 오늘 하루도 너무 고생 많으셨어요! 산책으로 마음을 달랜 스스로를 꼭 칭찬해주세요 🌟",
    },
  });

  await prisma.long_term_memories.upsert({
    where: {
      user_id_category: {
        user_id: user.id,
        category: "DIET_CARE",
      },
    },
    update: {
      memory_content: "다이어트 스트레스 해소로 야외 산책을 선호함",
      importance_score: 5,
    },
    create: {
      user_id: user.id,
      category: "DIET_CARE",
      memory_content: "다이어트 스트레스 해소로 야외 산책을 선호함",
      importance_score: 5,
    },
  });

  console.log(`💬 Chat messages & Memory Pill created.`);

  // 9. 종합 인사이트 리포트 (monthly_reports)
  const yearMonth = new Date().toISOString().slice(0, 7);
  await prisma.monthly_reports.upsert({
    where: {
      user_id_report_year_month: {
        user_id: user.id,
        report_year_month: yearMonth,
      },
    },
    update: {
      summary_content: "지난 일주일간 단백질 섭취 비율이 목표 대비 120%로 매우 훌륭하며, 1-Tap 수분 및 산책 미션을 꾸준히 달성하셨습니다.",
    },
    create: {
      user_id: user.id,
      report_year_month: yearMonth,
      summary_content: "지난 일주일간 단백질 섭취 비율이 목표 대비 120%로 매우 훌륭하며, 1-Tap 수분 및 산책 미션을 꾸준히 달성하셨습니다.",
      aggregated_data: JSON.stringify([
        "주말에 야외 산책 30분 유지하기",
        "하루 수분 섭취 목표 1,500ml 탭 미션 이어가기",
      ]),
    },
  });

  console.log(`📊 Wellness Report seeded for ${yearMonth}.`);
  console.log("✅ Prisma seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
