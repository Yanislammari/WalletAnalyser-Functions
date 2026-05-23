import { Asset } from "../models/schemas/asset";
import { AssetPrice } from "../models/schemas/asset.price";
import YahooPriceResponse from "../models/yahoo.price.response";
import AssetRepository from "../repositories/asset.repository";
import AssetPriceRepository from "../repositories/asset.price.repository";
import YahooFinanceService from "./yahoo.finance.service";
import { HISTORY_CHUNK_SIZE, HISTORY_CHUNK_DELAY_MS } from "../constants/chunk";
import { HISTORY_YEARS } from "../constants/time";

class SyncService {
  private readonly assetRepository: AssetRepository;
  private readonly assetPriceRepository: AssetPriceRepository;
  private readonly yahooFinanceService: YahooFinanceService;

  constructor() {
    this.assetRepository = new AssetRepository();
    this.assetPriceRepository = new AssetPriceRepository();
    this.yahooFinanceService = new YahooFinanceService();
  }

  public async syncAssetPrices(): Promise<void> {
    const assets: Asset[] = await this.assetRepository.getAllAssetsWithTicker();

    if (assets.length === 0) {
      return;
    }

    await this.backfillHistoricalPrices(assets);
    await this.syncTodayPrices(assets);
  }

  private async backfillHistoricalPrices(assets: Asset[]): Promise<void> {
    const assetIds: string[] = assets.map((asset) => asset.uuid);
    const oldestDates: Map<string, Date> = await this.assetPriceRepository.getOldestPriceDatesByAssets(assetIds);

    const fiveYearsAgo: Date = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - HISTORY_YEARS);
    fiveYearsAgo.setUTCHours(0, 0, 0, 0);

    const assetsNeedingBackfill: Asset[] = assets.filter((asset) => {
      const oldest: Date | undefined = oldestDates.get(asset.uuid);
      return !oldest || oldest > fiveYearsAgo;
    });

    if (assetsNeedingBackfill.length === 0) {
      return;
    }

    const chunks: Asset[][] = this.yahooFinanceService.chunk(assetsNeedingBackfill, HISTORY_CHUNK_SIZE);

    for (let i = 0; i < chunks.length; i++) {
      if (i > 0) {
        await this.yahooFinanceService.sleep(HISTORY_CHUNK_DELAY_MS);
      }

      for (const asset of chunks[i]) {
        const oldest: Date | undefined = oldestDates.get(asset.uuid);
        const from: Date = fiveYearsAgo;

        const to: Date = oldest
          ? new Date(oldest.getTime() - 24 * 60 * 60 * 1000)
          : new Date();

        if (from > to) {
          continue;
        }

        try {
          const historical: YahooPriceResponse[] = await this.yahooFinanceService.fetchHistoricalPrices(asset.ticker_name!, from, to);

          if (historical.length === 0) {
            continue;
          }

          const records: Array<{ asset_uuid: string; asset_price: number; asset_price_date: Date }> =
            historical.map((row) => ({
              asset_uuid: asset.uuid,
              asset_price: row.price,
              asset_price_date: row.date,
            }));

          await this.assetPriceRepository.bulkCreatePrices(records);
        }
        catch (err: unknown) {
          console.error(`SyncService: error backfilling ${asset.ticker_name} - ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }
  }

  private async syncTodayPrices(assets: Asset[]): Promise<void> {
    const tickers: string[] = assets.map((asset) => asset.ticker_name!);
    const priceMap: Map<string, YahooPriceResponse> = await this.yahooFinanceService.fetchLatestPrices(tickers);

    for (const asset of assets) {
      const priceResult: YahooPriceResponse | undefined = priceMap.get(asset.ticker_name!);

      if (!priceResult) {
        continue;
      }

      try {
        const existing: AssetPrice | null = await this.assetPriceRepository.getByAssetAndDate(asset.uuid, priceResult.date);

        if (existing) {
          await this.assetPriceRepository.updatePrice(existing.uuid, priceResult.price);
        }
        else {
          await this.assetPriceRepository.createPrice(asset.uuid, priceResult.price, priceResult.date);
        }
      }
      catch (err: unknown) {
        console.error(`SyncService: error syncing today price for ${asset.ticker_name} - ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }
}

export default SyncService;
