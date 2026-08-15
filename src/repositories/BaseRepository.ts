/* eslint-disable @typescript-eslint/no-explicit-any */
import { EntityId } from "@/interfaces";

export type Delegate<T, WhereInput = Record<string, unknown>> = {
  findUnique(args: { where: WhereInput }): Promise<T | null>;
  findFirst(args: { where?: WhereInput }): Promise<T | null>;
  findMany(args?: {
    where?: WhereInput;
    skip?: number;
    take?: number;
    orderBy?: unknown;
  }): Promise<T[]>;
  create(args: { data: unknown }): Promise<T>;
  update(args: { where: WhereInput; data: unknown }): Promise<T>;
  delete(args: { where: WhereInput }): Promise<T>;
  count(args?: { where?: WhereInput }): Promise<number>;
};

export abstract class BaseRepository<
  T,
  CreateInput,
  UpdateInput,
  WhereInput = Record<string, unknown>,
> {
  protected constructor(protected readonly delegate: Delegate<T, WhereInput>) {}

  async findById(id: EntityId): Promise<T | null> {
    return this.delegate.findUnique({ where: { id } as unknown as WhereInput });
  }

  async findFirst(where: WhereInput): Promise<T | null> {
    return this.delegate.findFirst({ where });
  }

  async findMany(
    where?: WhereInput,
    skip?: number,
    take?: number,
    orderBy?: unknown,
  ): Promise<T[]> {
    return this.delegate.findMany({ where, skip, take, orderBy });
  }

  async create(data: CreateInput): Promise<T> {
    return this.delegate.create({ data });
  }

  async update(id: EntityId, data: UpdateInput): Promise<T> {
    return this.delegate.update({
      where: { id } as unknown as WhereInput,
      data,
    });
  }

  async delete(id: EntityId): Promise<T> {
    return this.delegate.delete({ where: { id } as unknown as WhereInput });
  }

  async count(where?: WhereInput): Promise<number> {
    return this.delegate.count({ where });
  }
}
