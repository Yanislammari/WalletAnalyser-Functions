import { Op } from "sequelize";
import { BaseRepository } from "./base.repository";
import { Asset } from "../models/schemas/asset";

class AssetRepository extends BaseRepository<Asset> {
  protected readonly model = Asset;

  public async getAssetsWithTicker(limit: number): Promise<Asset[]> {
    return this.getByAttributes({ ticker_name: { [Op.not]: null } }, { limit });
  }

  public async getAssetByUuid(uuid: string): Promise<Asset | null> {
    return this.getOneByAttributes({ uuid });
  }
}

export default AssetRepository;
