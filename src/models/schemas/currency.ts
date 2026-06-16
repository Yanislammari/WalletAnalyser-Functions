import { DataTypes, Model } from "sequelize";
import { getSequelize } from "../../config/db";

export class Currency extends Model {
  public uuid!: string;
  public currency_name!: string;
}

Currency.init(
  {
    uuid: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    currency_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize: getSequelize(),
    timestamps: false,
    tableName: "Currencies",
  }
);
