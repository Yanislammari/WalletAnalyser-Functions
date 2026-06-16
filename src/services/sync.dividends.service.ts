import { Asset } from "../models/schemas/asset";
import { AssetDividend } from "../models/schemas/asset.dividend";
import YahooDividendRaw from "../models/yahoo.dividend.raw";
import AssetRepository from "../repositories/asset.repository";
import AssetDividendRepository from "../repositories/asset.dividend.repository";
import AssetPriceRepository from "../repositories/asset.price.repository";
import YahooFinanceService from "./yahoo.finance.service";
import { HISTORY_CHUNK_SIZE, HISTORY_CHUNK_DELAY_MS } from "../constants/chunk";
import { HISTORY_YEARS } from "../constants/time";

// An asset with price data older than this threshold is considered "already initialized"
// (i.e. it was bulk-imported, not freshly added). If it has no dividends by now → skip backfill.
const NEW_ASSET_THRESHOLD_DAYS = 7;

class SyncDividendsService {
  private readonly assetRepository: AssetRepository;
  private readonly assetDividendRepository: AssetDividendRepository;
  private readonly assetPriceRepository: AssetPriceRepository;
  private readonly yahooFinanceService: YahooFinanceService;

  constructor() {
    this.assetRepository = new AssetRepository();
    this.assetDividendRepository = new AssetDividendRepository();
    this.assetPriceRepository = new AssetPriceRepository();
    this.yahooFinanceService = new YahooFinanceService();
  }

  public async syncAssetDividends(): Promise<void> {
    const assets: Asset[] = await this.assetRepository.getAllAssetsWithTicker();

    if (assets.length === 0) {
      return;
    }

    await this.backfillHistoricalDividends(assets);
    await this.syncTodayDividends(assets);
  }

  // Phase 1 — backfill missing dividend history, without re-fetching what's already stored
  private async backfillHistoricalDividends(assets: Asset[]): Promise<void> {
    const assetIds: string[] = assets.map((asset) => asset.uuid);

    const oldestDividendDates: Map<string, Date> = await this.assetDividendRepository.getOldestDividendDatesByAssets(assetIds);
    const oldestPriceDates: Map<string, Date> = await this.assetPriceRepository.getOldestPriceDatesByAssets(assetIds);

    const fiveYearsAgo: Date = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - HISTORY_YEARS);
    fiveYearsAgo.setUTCHours(0, 0, 0, 0);

    const newAssetCutoff: Date = new Date();
    newAssetCutoff.setDate(newAssetCutoff.getDate() - NEW_ASSET_THRESHOLD_DAYS);

    const assetsNeedingBackfill: Asset[] = assets.filter((asset) => {
      const oldestDividend: Date | undefined = oldestDividendDates.get(asset.uuid);

      // Has dividend data but it doesn't cover the full 5-year window → fill the gap
      if (oldestDividend) {
        return oldestDividend > fiveYearsAgo;
      }

      // No dividend data at all:
      // Only backfill if the asset is new (its price history was added recently).
      // Old assets with no dividends have already been checked → they don't pay dividends, skip.
      const oldestPrice: Date | undefined = oldestPriceDates.get(asset.uuid);
      return !oldestPrice || oldestPrice >= newAssetCutoff;
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
        const oldest: Date | undefined = oldestDividendDates.get(asset.uuid);
        const from: Date = fiveYearsAgo;
        const to: Date = oldest
          ? new Date(oldest.getTime() - 24 * 60 * 60 * 1000)
          : new Date();

        if (from > to) {
          continue;
        }

        try {
          const dividends: YahooDividendRaw[] = await this.yahooFinanceService.fetchHistoricalDividends(
            asset.ticker_name!,
            from,
            to
          );

          if (dividends.length === 0) {
            continue;
          }

          const records: Array<{ asset_uuid: string; dividend_amount: number; ex_date: Date }> =
            dividends.map((row) => ({
              asset_uuid: asset.uuid,
              dividend_amount: row.dividends,
              ex_date: row.date,
            }));

          await this.assetDividendRepository.bulkCreateDividends(records);
        }
        catch (err: unknown) {
          console.error(
            `SyncDividendsService: error backfilling dividends for ${asset.ticker_name} - ${err instanceof Error ? err.message : String(err)}`
          );
        }
      }
    }
  }

  // Phase 2 — check yesterday and today for all assets, upsert any new dividends
  private async syncTodayDividends(assets: Asset[]): Promise<void> {
    const yesterday: Date = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setUTCHours(0, 0, 0, 0);

    const today: Date = new Date();

    const chunks: Asset[][] = this.yahooFinanceService.chunk(assets, HISTORY_CHUNK_SIZE);

    for (let i = 0; i < chunks.length; i++) {
      if (i > 0) {
        await this.yahooFinanceService.sleep(HISTORY_CHUNK_DELAY_MS);
      }

      for (const asset of chunks[i]) {
        try {
          const dividends: YahooDividendRaw[] = await this.yahooFinanceService.fetchHistoricalDividends(
            asset.ticker_name!,
            yesterday,
            today
          );

          for (const row of dividends) {
            const existing: AssetDividend | null = await this.assetDividendRepository.getByAssetAndExDate(
              asset.uuid,
              row.date
            );

            if (existing) {
              await this.assetDividendRepository.updateDividend(existing.uuid, row.dividends);
            }
            else {
              await this.assetDividendRepository.createDividend(asset.uuid, row.dividends, row.date);
            }
          }
        }
        catch (err: unknown) {
          console.error(
            `SyncDividendsService: error syncing today dividends for ${asset.ticker_name} - ${err instanceof Error ? err.message : String(err)}`
          );
        }
      }
    }
  }
}

export default SyncDividendsService;
