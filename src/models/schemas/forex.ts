import { DataTypes, Model } from "sequelize";
import { getSequelize } from "../../config/db";
import { Currency } from "./currency";

export class Forex extends Model {
  public uuid!: string;
  public base_currency!: string;   // UUID of base Currency
  public quote_currency!: string;  // UUID of quote Currency
}

Forex.init(
  {
    uuid: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    base_currency: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    quote_currency: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize: getSequelize(),
    timestamps: false,
    tableName: "Forexes",
  }
);

Forex.belongsTo(Currency, { as: "baseCurrency", foreignKey: "base_currency" });
Forex.belongsTo(Currency, { as: "quoteCurrency", foreignKey: "quote_currency" });
