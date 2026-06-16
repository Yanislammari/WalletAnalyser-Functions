import { Currency } from "../models/schemas/currency";
import { Forex } from "../models/schemas/forex";
import { ForexRate } from "../models/schemas/forex_rate";
import YahooPriceResponse from "../models/yahoo.price.response";
import CurrencyRepository from "../repositories/currency.repository";
import ForexRepository from "../repositories/forex.repository";
import ForexRateRepository from "../repositories/forex_rate.repository";
import YahooFinanceService from "./yahoo.finance.service";
import { HISTORY_CHUNK_DELAY_MS } from "../constants/chunk";
import { HISTORY_YEARS } from "../constants/time";

// Fetch forex history in pairs of 1 (each pair fetched individually)
const FOREX_CHUNK_DELAY_MS: number = HISTORY_CHUNK_DELAY_MS;

class SyncForexService {
  private readonly currencyRepository: CurrencyRepository;
  private readonly forexRepository: ForexRepository;
  private readonly forexRateRepository: ForexRateRepository;
  private readonly yahooFinanceService: YahooFinanceService;

  constructor() {
    this.currencyRepository = new CurrencyRepository();
    this.forexRepository = new ForexRepository();
    this.forexRateRepository = new ForexRateRepository();
    this.yahooFinanceService = new YahooFinanceService();
  }

  public async syncForexRates(): Promise<void> {
    const currencies: Currency[] = await this.currencyRepository.getAllCurrencies();

    if (currencies.length < 2) {
      // Need at least 2 currencies to form a pair
      return;
    }

    // Ensure all N×(N-1) directional pairs exist in the DB
    const pairs: Forex[] = await this.ensureAllPairsExist(currencies);

    if (pairs.length === 0) {
      return;
    }

    await this.backfillHistoricalRates(currencies, pairs);
    await this.syncTodayRates(currencies, pairs);
  }

  // Create Forex records for every directional pair that doesn't exist yet
  private async ensureAllPairsExist(currencies: Currency[]): Promise<Forex[]> {
    const pairs: Forex[] = [];

    for (const base of currencies) {
      for (const quote of currencies) {
        if (base.uuid === quote.uuid) {
          continue;
        }

        const pair: Forex = await this.forexRepository.getOrCreateForexPair(base.uuid, quote.uuid);
        pairs.push(pair);

        await this.yahooFinanceService.sleep(50); // light delay to avoid hammering DB
      }
    }

    return pairs;
  }

  // Phase 1 — backfill 5 years for pairs with incomplete history
  private async backfillHistoricalRates(currencies: Currency[], pairs: Forex[]): Promise<void> {
    const pairIds: string[] = pairs.map((p) => p.uuid);
    const oldestDates: Map<string, Date> = await this.forexRateRepository.getOldestRateDatesByForex(pairIds);

    const fiveYearsAgo: Date = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - HISTORY_YEARS);
    fiveYearsAgo.setUTCHours(0, 0, 0, 0);

    const pairsNeedingBackfill: Forex[] = pairs.filter((pair) => {
      const oldest: Date | undefined = oldestDates.get(pair.uuid);
      return !oldest || oldest > fiveYearsAgo;
    });

    if (pairsNeedingBackfill.length === 0) {
      return;
    }

    const currencyMap: Map<string, string> = new Map(
      currencies.map((c) => [c.uuid, c.currency_name])
    );

    for (let i = 0; i < pairsNeedingBackfill.length; i++) {
      if (i > 0) {
        await this.yahooFinanceService.sleep(FOREX_CHUNK_DELAY_MS);
      }

      const pair: Forex = pairsNeedingBackfill[i];
      const baseName: string | undefined = currencyMap.get(pair.base_currency);
      const quoteName: string | undefined = currencyMap.get(pair.quote_currency);

      if (!baseName || !quoteName) {
        continue;
      }

      const oldest: Date | undefined = oldestDates.get(pair.uuid);
      const from: Date = fiveYearsAgo;
      const to: Date = oldest
        ? new Date(oldest.getTime() - 24 * 60 * 60 * 1000)
        : new Date();

      if (from > to) {
        continue;
      }

      try {
        const rates: YahooPriceResponse[] = await this.yahooFinanceService.fetchHistoricalForexRates(
          baseName,
          quoteName,
          from,
          to
        );

        if (rates.length === 0) {
          continue;
        }

        const records: Array<{ forex_uuid: string; forex_rate: number; forex_rate_date: Date }> =
          rates.map((row) => ({
            forex_uuid: pair.uuid,
            forex_rate: row.price,
            forex_rate_date: row.date,
          }));

        await this.forexRateRepository.bulkCreateRates(records);
      }
      catch (err: unknown) {
        console.error(
          `SyncForexService: error backfilling ${baseName}/${quoteName} - ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  }

  // Phase 2 — fetch today's rate for all pairs, upsert
  private async syncTodayRates(currencies: Currency[], pairs: Forex[]): Promise<void> {
    const currencyMap: Map<string, string> = new Map(
      currencies.map((c) => [c.uuid, c.currency_name])
    );

    for (let i = 0; i < pairs.length; i++) {
      if (i > 0) {
        await this.yahooFinanceService.sleep(FOREX_CHUNK_DELAY_MS);
      }

      const pair: Forex = pairs[i];
      const baseName: string | undefined = currencyMap.get(pair.base_currency);
      const quoteName: string | undefined = currencyMap.get(pair.quote_currency);

      if (!baseName || !quoteName) {
        continue;
      }

      try {
        const rate: number | null = await this.yahooFinanceService.fetchLatestForexRate(baseName, quoteName);

        if (rate == null) {
          continue;
        }

        const today: Date = new Date();
        const existing: ForexRate | null = await this.forexRateRepository.getByForexAndDate(pair.uuid, today);

        if (existing) {
          await this.forexRateRepository.updateRate(existing.uuid, rate);
        }
        else {
          await this.forexRateRepository.createRate(pair.uuid, rate, today);
        }
      }
      catch (err: unknown) {
        console.error(
          `SyncForexService: error syncing today rate for ${baseName}/${quoteName} - ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  }
}

export default SyncForexService;
