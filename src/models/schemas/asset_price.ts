import { DataTypes, Model } from "sequelize";
import { getSequelize } from "../../config/db";
import { Asset } from "./asset";

export class AssetPrice extends Model {
  public uuid!: string;
  public asset_uuid!: string;
  public asset_price!: number;
  public asset_price_date!: Date;
}

AssetPrice.init(
  {
    uuid: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    asset_uuid: { 
      type: DataTypes.UUID,
      allowNull: false
    },
    asset_price: { 
      type: DataTypes.FLOAT,
      allowNull: false
    },
    asset_price_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
  },
  {
    sequelize: getSequelize(),
    timestamps: false,
    tableName: "AssetPrices",
  }
);

AssetPrice.belongsTo(Asset, { foreignKey: "asset_uuid" });
