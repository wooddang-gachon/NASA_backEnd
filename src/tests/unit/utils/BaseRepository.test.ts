import "reflect-metadata";
import { BaseRepository } from "../../../repositories/BaseRepository";

// Mocking Prisma Client
const mockPrisma = {
  findFirst: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
} as never;

class TestRepository extends BaseRepository<unknown, unknown, unknown> {
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
    (
      mockPrisma as unknown as { findFirst: jest.Mock }
    ).findFirst.mockResolvedValue({ id: 1, name: "Test" });
    const query = { id: 1 };

    // when
    const result = await repository.findFirst(query);

    // then
    expect(
      (mockPrisma as unknown as { findFirst: jest.Mock }).findFirst,
    ).toHaveBeenCalledWith({ where: query });
    expect(result).toEqual({ id: 1, name: "Test" });
  });
});
