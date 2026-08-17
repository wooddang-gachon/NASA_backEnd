import { getPrisma } from "../src/loaders/prisma";

const prisma = getPrisma();

async function main() {
  console.log("🌱 Starting Prisma database seeding...");

  // 기존 시드 데이터 초기화 (충돌 방지)
  await prisma.chat_messages.deleteMany();
  await prisma.quick_logs.deleteMany();
  await prisma.meal_items.deleteMany();
  await prisma.meal_images.deleteMany();
  await prisma.meals.deleteMany();
  await prisma.planet_travels.deleteMany();
  await prisma.food_mappings.deleteMany();
  await prisma.foods.deleteMany();
  console.log("🧹 Cleared existing transactional seed data.");

  // 1. 테스트 사용자 생성 (users)
  const user = await prisma.users.upsert({
    where: { email: "user@example.com" },
    update: {
      nickname: "우주탐험가",
      gender: "FEMALE",
      age: 25,
      password_hash: "$argon2id$v=19$m=65536,t=3,p=4$ffaGRe/COd8avRhslKEkGw$SxTgmaNe1lBLWl57R5kIkCq9OCeYmUfIqQogzXth/XU",
    },
    create: {
      email: "user@example.com",
      password_hash: "$argon2id$v=19$m=65536,t=3,p=4$ffaGRe/COd8avRhslKEkGw$SxTgmaNe1lBLWl57R5kIkCq9OCeYmUfIqQogzXth/XU", // Password123!
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
    update: { name: "아쿠아 웰니스 행성", planet_type: "WATER", required_fuel: 300 },
    create: { id: 1, name: "아쿠아 웰니스 행성", planet_type: "WATER", required_fuel: 300, description: "맑은 물과 생명력이 넘치는 첫 번째 웰니스 행성" },
  });

  const planet2 = await prisma.planets.upsert({
    where: { id: 2 },
    update: { name: "비타민 에너제틱 행성", planet_type: "MEAL", required_fuel: 500 },
    create: { id: 2, name: "비타민 에너제틱 행성", planet_type: "MEAL", required_fuel: 500, description: "풍부한 영양소와 단백질이 우주 광선으로 빛나는 행성" },
  });

  const planet3 = await prisma.planets.upsert({
    where: { id: 3 },
    update: { name: "마인드 힐링 행성", planet_type: "EMOTION", required_fuel: 800 },
    create: { id: 3, name: "마인드 힐링 행성", planet_type: "EMOTION", required_fuel: 800, description: "따뜻한 공감과 심리적 안식을 선물하는 타미의 고향 행성" },
  });

  console.log(`🪐 Planets created: ${planet1.name}, ${planet2.name}, ${planet3.name}`);

  // 4. 별여행 탐사 상태 (planet_travels)
  const travel = await prisma.planet_travels.create({
    data: {
      user_id: user.id,
      planet_id: planet1.id,
      planet_type: "WATER",
      fuel_spent: 100,
      status: "COMPLETED",
      title: "아쿠아 웰니스 행성 탐사 리포트",
      summary_content: "수분 섭취 탐사가 완료되었습니다.",
      recommendations: "하루 2,000ml 수분 섭취 유지",
      started_at: new Date(),
      completed_at: new Date(),
    },
  });

  console.log(`🚀 Space travel record initialized: Travel #${travel.id}`);

  // 5. 표준 음식 마스터 (foods)
  const yoloFoods = [
    { id: 10, name: "고등어구이", standard_serving_g: 100, calories_kcal: 200, carbohydrate_g: 0, protein_g: 20, fat_g: 13 },
    { id: 11, name: "김밥", standard_serving_g: 200, calories_kcal: 480, carbohydrate_g: 75, protein_g: 12, fat_g: 14 },
    { id: 12, name: "김치볶음밥", standard_serving_g: 300, calories_kcal: 550, carbohydrate_g: 80, protein_g: 15, fat_g: 18 },
    { id: 13, name: "불고기", standard_serving_g: 150, calories_kcal: 330, carbohydrate_g: 12, protein_g: 28, fat_g: 19 },
    { id: 14, name: "삼겹살", standard_serving_g: 200, calories_kcal: 660, carbohydrate_g: 0, protein_g: 34, fat_g: 58 },
    { id: 15, name: "양념치킨", standard_serving_g: 200, calories_kcal: 580, carbohydrate_g: 35, protein_g: 30, fat_g: 36 },
  ];

  for (const item of yoloFoods) {
    const createdFood = await prisma.foods.upsert({
      where: { name: item.name },
      update: item,
      create: item,
    });
    // food_mappings 테이블에도 EXACT 매칭으로 기본 등록
    await prisma.food_mappings.upsert({
      where: { raw_name: item.name },
      update: { food_id: createdFood.id, match_type: "EXACT" },
      create: { raw_name: item.name, food_id: createdFood.id, match_type: "EXACT" },
    });
  }

  const food1 = await prisma.foods.upsert({
    where: { name: "연어 샐러드" },
    update: { calories_kcal: 380 },
    create: {
      name: "연어 샐러드",
      standard_serving_g: 250,
      calories_kcal: 380,
      carbohydrate_g: 14.5,
      protein_g: 32.0,
      fat_g: 11.2,
    },
  });

  const food2 = await prisma.foods.upsert({
    where: { name: "닭가슴살 아보카도 샌드위치" },
    update: { calories_kcal: 450 },
    create: {
      name: "닭가슴살 아보카도 샌드위치",
      standard_serving_g: 200,
      calories_kcal: 450,
      carbohydrate_g: 40.0,
      protein_g: 28.0,
      fat_g: 14.0,
    },
  });

  console.log(`🥗 YOLO 6종 및 샘플 음식 데이터 세팅 완료!`);

  // 5.5. AI-RDB 음식명 매칭 테이블 (food_mappings) [FOD-005]
  await prisma.food_mappings.upsert({
    where: { raw_name: "생선 샐러드" },
    update: { food_id: food1.id, match_type: "ALIAS" },
    create: { raw_name: "생선 샐러드", food_id: food1.id, match_type: "ALIAS" },
  });

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
            image_url: "/uploads/salmon_salad.jpg",
            is_cover: true,
          },
        ],
      },
      meal_items: {
        create: [
          {
            custom_food_name: "연어 샐러드",
            intake_gram: 250,
            food_id: food1.id,
          },
        ],
      },
    },
  });

  console.log(`🍲 Meal log recorded: ID #${meal.id} (${meal.meal_type})`);

  // 7. 1-Tap 수분 섭취 및 운동 완료 기록 (quick_logs & exercise_logs)
  await prisma.quick_logs.create({
    data: {
      user_id: user.id,
      category: "WATER",
      amount: 250,
      earned_fuel: 10,
    },
  });

  const workoutLog = await prisma.quick_logs.create({
    data: {
      user_id: user.id,
      category: "EXERCISE",
      duration_minutes: 30,
      burned_calories_kcal: 150,
      earned_fuel: 10,
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

  console.log(`💬 Chat messages created.`);
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
