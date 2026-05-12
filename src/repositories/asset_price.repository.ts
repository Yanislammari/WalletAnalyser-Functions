import { Op } from "sequelize";
import { BaseRepository } from "./base.repository";
import { AssetPrice } from "../models/schemas/asset_price";

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
}

export default AssetPriceRepository;
