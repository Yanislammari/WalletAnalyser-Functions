import { DataTypes, Model } from "sequelize";
import { getSequelize } from "../../config/db";
import { Forex } from "./forex";

export class ForexRate extends Model {
  public uuid!: string;
  public forex_uuid!: string;
  public forex_rate_date!: Date;
  public forex_rate!: number;
}

ForexRate.init(
  {
    uuid: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    forex_uuid: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    forex_rate_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    forex_rate: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
  },
  {
    sequelize: getSequelize(),
    timestamps: false,
    tableName: "ForexRates",
  }
);

ForexRate.belongsTo(Forex, { as: "forex", foreignKey: "forex_uuid" });
