import { DataTypes, Model } from "sequelize";
import { getSequelize } from "../../config/db";

export class Asset extends Model {
  public uuid!: string;
  public ticker_name!: string | null;
  public official_name!: string | null;
  public asset_type!: string | null;
  public base_currency_uuid!: string | null;
  public sector_uuid!: string | null;
  public country_uuid!: string | null;
}

Asset.init(
  {
    uuid: {
      type: DataTypes.UUID,
      primaryKey: true
    },
    ticker_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    official_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    asset_type: {
      type: DataTypes.STRING,
      allowNull: true
    },
    base_currency_uuid: {
      type: DataTypes.UUID,
      allowNull: true
    },
    sector_uuid: {
      type: DataTypes.UUID,
      allowNull: true
    },
    country_uuid: {
      type: DataTypes.UUID,
      allowNull: true
    },
  },
  {
    sequelize: getSequelize(),
    timestamps: false,
    tableName: "Assets",
  }
);
