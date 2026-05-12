import { MARKETSTACK_API_KEY, MARKETSTACK_API_URL } from "../constants/env";
import PriceResponse from "../models/price_response";

class MarketstackService {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = MARKETSTACK_API_KEY;
    this.baseUrl = MARKETSTACK_API_URL;
  }

  public async fetchLatestPrice(ticker: string): Promise<PriceResponse | null> {
    const url: string = `${this.baseUrl}eod/latest?symbols=${ticker}&access_key=${this.apiKey}`;

    const response: Response = await fetch(url, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`MARKETSTACK_ERROR: Failed to fetch Marketstack data - ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    const data: PriceResponse[] = json.data;

    if (!data || data.length === 0) {
      return null;
    }

    const item: PriceResponse = data[0];

    return {
      symbol: item.symbol,
      adj_close: item.adj_close,
      date: item.date,
    };
  }
}

export default MarketstackService;
