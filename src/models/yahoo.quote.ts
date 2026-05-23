interface YahooQuote {
  symbol?: string;
  regularMarketPrice?: number;
  regularMarketTime?: Date;
  [key: string]: unknown;
}

export default YahooQuote;
