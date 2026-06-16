import BaseRepository from "./base.repository";
import { Currency } from "../models/schemas/currency";

class CurrencyRepository extends BaseRepository<Currency> {
  protected readonly model: typeof Currency = Currency;

  public async getAllCurrencies(): Promise<Currency[]> {
    return this.findAll();
  }
}

export default CurrencyRepository;
