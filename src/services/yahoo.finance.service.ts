import YahooFinance from "yahoo-finance2";
import { SYNC_CHUNK_SIZE, SYNC_CHUNK_DELAY_MS } from "../constants/chunk";
import YahooPriceResponse from "../models/yahoo.price.response";
import YahooQuote from "../models/yahoo.quote";
import YahooHistoricalRow from "../models/yahoo.historical.raw";

class YahooFinanceService {
  private readonly yahooFinance: InstanceType<typeof YahooFinance>;
  private readonly CHUNK_SIZE: number;
  private readonly CHUNK_DELAY_MS: number;

  constructor() {
    this.yahooFinance = new YahooFinance();
    this.CHUNK_SIZE = SYNC_CHUNK_SIZE;
    this.CHUNK_DELAY_MS = SYNC_CHUNK_DELAY_MS;
  }

  public async fetchLatestPrices(tickers: string[]): Promise<Map<string, YahooPriceResponse>> {
    const results: Map<string, YahooPriceResponse> = new Map<string, YahooPriceResponse>();
    const chunks: string[][] = this.chunk(tickers, this.CHUNK_SIZE);

    for (let i = 0; i < chunks.length; i++) {
      if (i > 0) {
        await this.sleep(this.CHUNK_DELAY_MS);
      }

      const batch: string[] = chunks[i];

      try {
        const quotes: YahooQuote[] = await this.yahooFinance.quote(batch) as unknown as YahooQuote[];

        for (const quote of quotes) {
          if (!quote.symbol || quote.regularMarketPrice == null) {
            continue;
          }

          results.set(quote.symbol, {
            ticker: quote.symbol,
            price: quote.regularMarketPrice,
            date: quote.regularMarketTime ?? new Date(),
          });
        }
      }
      catch (err: unknown) {
        throw new Error(`YahooFinanceService: error fetching batch ${i + 1}/${chunks.length} - ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return results;
  }

  public async fetchHistoricalPrices(ticker: string, from: Date, to: Date): Promise<YahooPriceResponse[]> {
    const rows: YahooHistoricalRow[] = await this.yahooFinance.historical(ticker, {
      period1: from,
      period2: to,
      interval: "1d",
    }) as unknown as YahooHistoricalRow[];

    return rows
      .filter((row) => row.date != null && (row.adjClose != null || row.close != null))
      .map((row) => ({
        ticker,
        price: row.adjClose ?? row.close,
        date: row.date,
      }));
  }

  public chunk<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }

  public sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default YahooFinanceService;
