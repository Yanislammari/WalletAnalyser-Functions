import BaseRepository from "./base.repository";
import { Forex } from "../models/schemas/forex";

class ForexRepository extends BaseRepository<Forex> {
  protected readonly model: typeof Forex = Forex;

  public async getAllForexPairs(): Promise<Forex[]> {
    return this.findAll();
  }

  public async getForexPair(baseCurrencyUuid: string, quoteCurrencyUuid: string): Promise<Forex | null> {
    return this.getOneByAttributes({
      base_currency: baseCurrencyUuid,
      quote_currency: quoteCurrencyUuid,
    });
  }

  public async getOrCreateForexPair(baseCurrencyUuid: string, quoteCurrencyUuid: string): Promise<Forex> {
    const [instance] = await Forex.findOrCreate({
      where: {
        base_currency: baseCurrencyUuid,
        quote_currency: quoteCurrencyUuid,
      },
      defaults: {
        base_currency: baseCurrencyUuid,
        quote_currency: quoteCurrencyUuid,
      } as Forex["_creationAttributes"],
    });
    return instance;
  }
}

export default ForexRepository;
