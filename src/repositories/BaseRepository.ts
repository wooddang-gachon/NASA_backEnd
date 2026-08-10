import { PrismaClient } from "@prisma/client";
import { EntityId } from "@/interfaces";

// PrismaClient의 delegate 구조와 호환되는 타입 정의
export type Delegate<T> = {
  findUnique(args: { where: any }): Promise<T | null>;
  findFirst(args: { where?: any }): Promise<T | null>;
  findMany(args?: { where?: any; skip?: number; take?: number; orderBy?: any }): Promise<T[]>;
  create(args: { data: any }): Promise<T>;
  update(args: { where: any; data: any }): Promise<T>;
  delete(args: { where: any }): Promise<T>;
  count(args?: { where?: any }): Promise<number>;
};

export abstract class BaseRepository<T, CreateInput, UpdateInput> {
  protected constructor(protected readonly delegate: Delegate<T>) {}

  async findById(id: EntityId): Promise<T | null> {
    return this.delegate.findUnique({ where: { id } });
  }

  async findFirst(where: any): Promise<T | null> {
    return this.delegate.findFirst({ where });
  }

  async findMany(where?: any, skip?: number, take?: number, orderBy?: any): Promise<T[]> {
    return this.delegate.findMany({ where, skip, take, orderBy });
  }

  async create(data: CreateInput): Promise<T> {
    return this.delegate.create({ data });
  }

  async update(id: EntityId, data: UpdateInput): Promise<T> {
    return this.delegate.update({
      where: { id },
      data,
    });
  }

  async delete(id: EntityId): Promise<T> {
    return this.delegate.delete({ where: { id } });
  }

  async count(where?: any): Promise<number> {
    return this.delegate.count({ where });
  }
}
