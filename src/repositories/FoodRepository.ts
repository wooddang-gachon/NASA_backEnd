import { Service } from "typedi";
import { getPrisma } from "../loaders/prisma";
import Logger from "../loaders/logger";
import { Prisma, foods } from "@prisma/client";
import { BaseRepository } from "./BaseRepository";

@Service()
export default class FoodRepository extends BaseRepository<
  foods,
  Prisma.foodsCreateInput,
  Prisma.foodsUpdateInput
> {
  constructor() {
    super(getPrisma().foods);
  }

  public async createMealImage(imageUrl: string, isCover: boolean = true) {
    const prisma = getPrisma();
    return prisma.meal_images.create({
      data: {
        image_url: imageUrl,
        is_cover: isCover,
      },
    });
  }

  public async findFoodMappingByRawName(rawName: string) {
    const prisma = getPrisma();
    return prisma.food_mappings.findFirst({
      where: { raw_name: rawName },
      include: { food: true },
    });
  }

  public async findFoodMasterByNameOrKeyword(
    rawName: string,
    keywordCleaned: string,
  ) {
    return this.findFirst({
      OR: [
        { name: { contains: rawName } },
        { name: { contains: keywordCleaned } },
      ],
    });
  }

  public async createFoodMapping(
    rawName: string,
    foodId: number,
    matchType: "EXACT" | "ALIAS",
  ) {
    const prisma = getPrisma();
    return prisma.food_mappings.create({
      data: {
        raw_name: rawName,
        food_id: foodId,
        match_type: matchType,
      },
      include: { food: true },
    });
  }

  public async searchFoodsByKeyword(keyword: string, take: number = 10) {
    return this.findMany({ name: { contains: keyword } }, undefined, take);
  }

  public async findUserById(userId: number) {
    const prisma = getPrisma();
    return prisma.users.findUnique({ where: { id: userId } });
  }

  /**
   * 트랜잭션을 사용하여 식단 기록, 사용자 경험치 증가 및 펫 상태 업데이트를 원자적으로 수행합니다.
   * @param userId - User ID
   * @param mealData - Meal data to create
   * @param processedItems - Processed meal items array
   * @param imageInfo - Meal image information
   * @param imageInfo.imageId - Image ID
   * @param imageInfo.imageUrl - Image URL
   * @param gainedFuel - Gained fuel amount
   * @param gainedExp - Gained experience amount
   * @param toMealItemCreateInput - Mapper function for meal item create input
   * @param toMealImageCreateInput - Mapper function for meal image create input
   * @param toStatusLogCreateInput - Mapper function for status log create input
   * @returns Transaction result containing created meal, updated user, and gained fuel
   */
  public async createMealLogWithTransaction(
    userId: number,
    mealData: Prisma.mealsUncheckedCreateInput,
    processedItems: Array<{
      foodName: string;
      intakeGram: number;
      foodId?: number | null;
      boundingBox?: Record<string, unknown>;
      confidence?: number;
      imageId?: string | number | null;
    }>,
    imageInfo: { imageId?: string | number; imageUrl?: string },
    gainedFuel: number,
    gainedExp: number,
    toMealItemCreateInput: (
      mealId: bigint,
      foodName: string,
      intakeGram: number,
      foodId?: number | null,
      boundingBox?: unknown,
      confidence?: number,
      imageId?: bigint | null,
    ) => Prisma.meal_itemsUncheckedCreateInput,
    toMealImageCreateInput: (
      mealId: bigint,
      imageUrl: string,
    ) => Prisma.meal_imagesUncheckedCreateInput,
    toStatusLogCreateInput: (
      userId: number,
      actionType: string,
      expChange: number,
      currentLevel: number,
      currentExp: number,
    ) => Prisma.tammy_status_logsUncheckedCreateInput,
  ) {
    const prisma = getPrisma();

    return prisma.$transaction(async (tx) => {
      // 1. meals 생성
      const meal = await tx.meals.create({ data: mealData });

      let defaultImageRecord: { id: bigint } | null = null;

      // 2-1. imageId (PK)로 기존 meal_images 찾기 및 업데이트
      if (imageInfo.imageId) {
        try {
          const imgId = BigInt(imageInfo.imageId);
          defaultImageRecord = await tx.meal_images.findUnique({
            where: { id: imgId },
          });

          if (defaultImageRecord) {
            await tx.meal_images.update({
              where: { id: imgId },
              data: { meal_id: meal.id },
            });
            Logger.info(
              `[FoodRepository] Linked existing meal_images via imageId (ID: ${imgId}) to mealId: ${meal.id}`,
            );
          }
        } catch {
          Logger.warn(
            `[FoodRepository] Failed to find meal_images with imageId: ${imageInfo.imageId}`,
          );
        }
      }

      // 2-2. imageId가 없고 imageUrl이 있는 경우
      if (!defaultImageRecord && imageInfo.imageUrl) {
        const existingImage = await tx.meal_images.findFirst({
          where: { image_url: imageInfo.imageUrl },
        });

        if (existingImage) {
          defaultImageRecord = existingImage;
          await tx.meal_images.update({
            where: { id: existingImage.id },
            data: { meal_id: meal.id },
          });
          Logger.info(
            `[FoodRepository] Linked existing meal_images via imageUrl (ID: ${existingImage.id}) to mealId: ${meal.id}`,
          );
        } else {
          defaultImageRecord = await tx.meal_images.create({
            data: toMealImageCreateInput(meal.id, imageInfo.imageUrl),
          });
          Logger.info(
            `[FoodRepository] Created new meal_images record for mealId: ${meal.id}`,
          );
        }
      }

      // 3. meal_items N건 생성
      const mealItemsData = processedItems.map((item) => {
        const targetImageId =
          item.imageId || (defaultImageRecord ? defaultImageRecord.id : null);
        return toMealItemCreateInput(
          meal.id,
          item.foodName,
          item.intakeGram,
          item.foodId,
          item.boundingBox,
          item.confidence,
          targetImageId ? BigInt(targetImageId) : null,
        );
      });

      if (mealItemsData.length > 0) {
        await tx.meal_items.createMany({ data: mealItemsData });
      }

      // 4. 유저 및 펫(Tammy) 상태 업데이트
      const updatedUser = await tx.users.update({
        where: { id: userId },
        data: { current_fuel: { increment: gainedFuel } },
      });

      const tammyStatus = await tx.tammy_statuses.update({
        where: { user_id: userId },
        data: { current_exp: { increment: gainedExp } },
      });

      await tx.tammy_status_logs.create({
        data: toStatusLogCreateInput(
          userId,
          "MEAL_LOG",
          gainedExp,
          tammyStatus.level,
          tammyStatus.current_exp,
        ),
      });

      return { meal, updatedUser, gainedFuel };
    });
  }
}
