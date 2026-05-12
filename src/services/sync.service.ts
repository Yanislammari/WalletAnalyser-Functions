
import PriceResponse from "../models/price_response";
import { Asset } from "../models/schemas/asset";
import { AssetPrice } from "../models/schemas/asset_price";
import AssetRepository from "../repositories/asset.repository";
import AssetPriceRepository from "../repositories/asset_price.repository";
import MarketstackService from "./marketstack.service";

class SyncService {
  private readonly assetRepository: AssetRepository;
  private readonly assetPriceRepository: AssetPriceRepository;
  private readonly marketstackService: MarketstackService;

  constructor() {
    this.assetRepository = new AssetRepository();
    this.assetPriceRepository = new AssetPriceRepository();
    this.marketstackService = new MarketstackService();
  }

  public async syncAssetPrices(limit: number): Promise<void> {
    const assets: Asset[] = await this.assetRepository.getAssetsWithTicker(limit);

    for (const asset of assets) {
      try {
        const latestPrice: PriceResponse | null = await this.marketstackService.fetchLatestPrice(asset.ticker_name!);

        if (!latestPrice) {
          continue;
        }

        const priceDate: Date = new Date(latestPrice.date);
        const existingAssetPrice: AssetPrice | null = await this.assetPriceRepository.getByAssetAndDate(asset.uuid, priceDate);

        if (existingAssetPrice) {
          await this.assetPriceRepository.updatePrice(existingAssetPrice.uuid, latestPrice.adj_close);
        }
        else {
          await this.assetPriceRepository.createPrice(asset.uuid, latestPrice.adj_close, priceDate);
        }
      }
      catch (err: any) {
        throw new Error(`SYNC_ERROR: Failed to sync price for asset ${asset.ticker_name} (${asset.uuid}): ${err.message}`);
      }
    }
  }
}

export default SyncService;
