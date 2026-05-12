import { Model, ModelStatic, FindOptions, UpdateOptions, WhereOptions, Sequelize } from "sequelize";
import { getSequelize } from "../config/db";

export abstract class BaseRepository<T extends Model> {
  protected readonly sequelize: Sequelize;
  protected abstract readonly model: ModelStatic<T>;

  constructor() {
    this.sequelize = getSequelize();
  }

  protected async findOne(options: FindOptions): Promise<T | null> {
    return this.model.findOne(options) as Promise<T | null>;
  }

  protected async findAll(options?: FindOptions): Promise<T[]> {
    return this.model.findAll(options) as Promise<T[]>;
  }

  protected async getByAttributes(where: WhereOptions, options?: Omit<FindOptions, "where">): Promise<T[]> {
    return this.model.findAll({ where, ...options }) as Promise<T[]>;
  }

  protected async getOneByAttributes(where: WhereOptions): Promise<T | null> {
    return this.model.findOne({ where }) as Promise<T | null>;
  }

  protected async create(values: T["_creationAttributes"]): Promise<T> {
    return this.model.create(values) as Promise<T>;
  }

  protected async update(values: object, options: UpdateOptions): Promise<void> {
    await this.model.update(values, options);
  }
}
