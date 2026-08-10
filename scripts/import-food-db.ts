import fs from "fs";
import path from "path";
import readline from "readline";
import { getPrisma } from "../src/loaders/prisma";

const prisma = getPrisma();

function parseNumber(val: string | undefined): number {
  if (!val) return 0;
  const cleaned = val.replace(/[^0-9.]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export async function importFoodData() {
  const csvPath = path.join(process.cwd(), "data", "food_nutrition.csv");

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ File not found: ${csvPath}`);
    return;
  }

  console.log("🚀 Starting Bulk Import of Food Nutrition Data...");

  const fileStream = fs.createReadStream(csvPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let isHeader = true;
  const foodRecords: any[] = [];
  const existingNames = new Set<string>();

  for await (const line of rl) {
    if (isHeader) {
      isHeader = false;
      continue;
    }

    if (!line.trim()) continue;

    // 간단한 CSV 파싱 (쉼표 기준 분할)
    const cols = line.split(",");
    if (cols.length < 9) continue;

    const name = cols[0]?.trim();
    const category = cols[1]?.trim() || null;
    const representativeName = cols[2]?.trim() || null;
    const servingRaw = cols[3]?.trim();
    const caloriesRaw = cols[4]?.trim();
    const proteinRaw = cols[5]?.trim();
    const fatRaw = cols[6]?.trim();
    const carbsRaw = cols[7]?.trim();
    const weightRaw = cols[8]?.trim();

    if (!name || existingNames.has(name)) continue;
    existingNames.add(name);

    foodRecords.push({
      name,
      category,
      representative_name: representativeName,
      standard_serving_g: parseNumber(servingRaw) || 100,
      total_weight_g: parseNumber(weightRaw) || null,
      calories_kcal: Math.round(parseNumber(caloriesRaw)),
      protein_g: parseNumber(proteinRaw),
      fat_g: parseNumber(fatRaw),
      carbohydrate_g: parseNumber(carbsRaw),
    });
  }

  console.log(`📊 Parsed ${foodRecords.length} unique food records from CSV.`);

  // 1000개씩 청크 분할하여 Bulk Insert
  const CHUNK_SIZE = 1000;
  let insertedCount = 0;

  for (let i = 0; i < foodRecords.length; i += CHUNK_SIZE) {
    const chunk = foodRecords.slice(i, i + CHUNK_SIZE);
    const result = await prisma.foods.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    insertedCount += result.count;
    console.log(`📦 Inserted chunk ${Math.floor(i / CHUNK_SIZE) + 1}/${Math.ceil(foodRecords.length / CHUNK_SIZE)}: +${result.count} foods`);
  }

  console.log(`🎉 Total ${insertedCount} new food items inserted into 'foods' table.`);

  // food_mappings 자동 매핑 생성
  console.log("🔗 Generating initial 'food_mappings' for new food items...");
  const allFoods = await prisma.foods.findMany({ select: { id: true, name: true } });
  const mappingRecords = allFoods.map((f) => ({
    raw_name: f.name,
    food_id: f.id,
    match_type: "EXACT" as const,
  }));

  for (let i = 0; i < mappingRecords.length; i += CHUNK_SIZE) {
    const chunk = mappingRecords.slice(i, i + CHUNK_SIZE);
    await prisma.food_mappings.createMany({
      data: chunk,
      skipDuplicates: true,
    });
  }

  console.log(`✅ Bulk Food Import & Mapping Completed Successfully! Total DB foods count: ${allFoods.length}`);
}

importFoodData()
  .catch((e) => console.error("❌ Import failed:", e))
  .finally(async () => {
    await prisma.$disconnect();
  });
