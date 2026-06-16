import { fn, col, Op, type CreationAttributes } from "sequelize";
import BaseRepository from "./base.repository";
import { AssetPrice } from "../models/schemas/asset.price";

class AssetPriceRepository extends BaseRepository<AssetPrice> {
  protected readonly model: typeof AssetPrice = AssetPrice;

  public async getByAssetAndDate(assetId: string, date: Date): Promise<AssetPrice | null> {
    const startOfDay: Date = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay: Date = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    return this.getOneByAttributes({
      asset_uuid: assetId,
      asset_price_date: { [Op.between]: [startOfDay, endOfDay] },
    });
  }

  public async updatePrice(uuid: string, price: number): Promise<void> {
    await this.update(
      { asset_price: price },
      { where: { uuid } }
    );
  }

  public async createPrice(assetId: string, price: number, date: Date): Promise<void> {
    await this.create({
      asset_uuid: assetId,
      asset_price: price,
      asset_price_date: date,
    });
  }

  public async getOldestPriceDatesByAssets(assetIds: string[]): Promise<Map<string, Date>> {
    const rows = await AssetPrice.findAll({
      where: { asset_uuid: { [Op.in]: assetIds } },
      attributes: ["asset_uuid", [fn("MIN", col("asset_price_date")), "oldest_date"]],
      group: ["asset_uuid"],
      raw: true,
    }) as unknown as Array<{ asset_uuid: string; oldest_date: string }>;

    const result: Map<string, Date> = new Map<string, Date>();
    for (const row of rows) {
      result.set(row.asset_uuid, new Date(row.oldest_date));
    }
    return result;
  }

  public async bulkCreatePrices(records: Array<{ asset_uuid: string; asset_price: number; asset_price_date: Date }>): Promise<void> {
    if (records.length === 0) {
      return;
    }

    await AssetPrice.bulkCreate(records as CreationAttributes<AssetPrice>[], {
      ignoreDuplicates: true,
    });
  }
}

export default AssetPriceRepository;
