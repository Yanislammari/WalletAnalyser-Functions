import { Sequelize } from "sequelize";
import { DATABASE_URL } from "../constants/env";

let sequelizeInstance: Sequelize | null = null;

export function getSequelize(): Sequelize {
  if (!sequelizeInstance) {
    sequelizeInstance = new Sequelize(DATABASE_URL as string, {
      dialect: "postgres",
      define: {
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
      timezone: "-00:00",
      dialectOptions: {
        ssl: { rejectUnauthorized: false },
        timezone: "Z",
        dateStrings: true,
      },
      logging: false,
    });
  }

  return sequelizeInstance;
}
