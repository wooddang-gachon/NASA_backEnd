import "reflect-metadata";
import { BaseRepository } from "../../../repositories/BaseRepository";
import { PrismaClient } from "@prisma/client";

// Mocking Prisma Client
const mockPrisma = {
  findFirst: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
} as unknown as any;

class TestRepository extends BaseRepository<any, any, any> {
  constructor() {
    super(mockPrisma);
  }
}

describe("BaseRepository Unit Tests", () => {
  let repository: TestRepository;

  beforeEach(() => {
    repository = new TestRepository();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should call findFirst on the injected delegate", async () => {
    // given
    mockPrisma.findFirst.mockResolvedValue({ id: 1, name: "Test" });
    const query = { id: 1 };

    // when
    const result = await repository.findFirst(query);

    // then
    expect(mockPrisma.findFirst).toHaveBeenCalledWith({ where: query });
    expect(result).toEqual({ id: 1, name: "Test" });
  });
});
