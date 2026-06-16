import { DataTypes, Model } from "sequelize";
import { getSequelize } from "../../config/db";
import { Asset } from "./asset";

export class AssetDividend extends Model {
  public uuid!: string;
  public asset_uuid!: string;
  public dividend_amount!: number;
  public ex_date!: Date;
}

AssetDividend.init(
  {
    uuid: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    asset_uuid: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    dividend_amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    ex_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  },
  {
    sequelize: getSequelize(),
    timestamps: false,
    tableName: "AssetDividends",
  }
);

AssetDividend.belongsTo(Asset, { foreignKey: "asset_uuid" });
