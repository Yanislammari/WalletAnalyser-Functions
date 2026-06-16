import { fn, col, Op, type CreationAttributes } from "sequelize";
import BaseRepository from "./base.repository";
import { AssetDividend } from "../models/schemas/asset.dividend";

class AssetDividendRepository extends BaseRepository<AssetDividend> {
  protected readonly model: typeof AssetDividend = AssetDividend;

  public async getByAssetAndExDate(assetId: string, exDate: Date): Promise<AssetDividend | null> {
    const dateStr: string = exDate.toISOString().split("T")[0];

    return this.getOneByAttributes({
      asset_uuid: assetId,
      ex_date: dateStr,
    });
  }

  public async updateDividend(uuid: string, amount: number): Promise<void> {
    await this.update(
      { dividend_amount: amount },
      { where: { uuid } }
    );
  }

  public async createDividend(assetId: string, amount: number, exDate: Date): Promise<void> {
    await this.create({
      asset_uuid: assetId,
      dividend_amount: amount,
      ex_date: exDate,
    });
  }

  public async getOldestDividendDatesByAssets(assetIds: string[]): Promise<Map<string, Date>> {
    const rows = await AssetDividend.findAll({
      where: { asset_uuid: { [Op.in]: assetIds } },
      attributes: ["asset_uuid", [fn("MIN", col("ex_date")), "oldest_date"]],
      group: ["asset_uuid"],
      raw: true,
    }) as unknown as Array<{ asset_uuid: string; oldest_date: string }>;

    const result: Map<string, Date> = new Map<string, Date>();
    for (const row of rows) {
      result.set(row.asset_uuid, new Date(row.oldest_date));
    }

    return result;
  }

  public async bulkCreateDividends(records: Array<{ asset_uuid: string; dividend_amount: number; ex_date: Date }>): Promise<void> {
    if (records.length === 0) {
      return;
    }

    await AssetDividend.bulkCreate(records as CreationAttributes<AssetDividend>[], {
      ignoreDuplicates: true,
    });
  }
}

export default AssetDividendRepository;
