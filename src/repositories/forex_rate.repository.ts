import { fn, col, Op, type CreationAttributes } from "sequelize";
import BaseRepository from "./base.repository";
import { ForexRate } from "../models/schemas/forex_rate";

class ForexRateRepository extends BaseRepository<ForexRate> {
  protected readonly model: typeof ForexRate = ForexRate;

  public async getByForexAndDate(forexId: string, date: Date): Promise<ForexRate | null> {
    const dateStr: string = date.toISOString().split("T")[0];
    return this.getOneByAttributes({
      forex_uuid: forexId,
      forex_rate_date: dateStr,
    });
  }

  public async updateRate(uuid: string, rate: number): Promise<void> {
    await this.update(
      { forex_rate: rate },
      { where: { uuid } }
    );
  }

  public async createRate(forexId: string, rate: number, date: Date): Promise<void> {
    await this.create({
      forex_uuid: forexId,
      forex_rate: rate,
      forex_rate_date: date,
    });
  }

  public async getOldestRateDatesByForex(forexIds: string[]): Promise<Map<string, Date>> {
    const rows = await ForexRate.findAll({
      where: { forex_uuid: { [Op.in]: forexIds } },
      attributes: ["forex_uuid", [fn("MIN", col("forex_rate_date")), "oldest_date"]],
      group: ["forex_uuid"],
      raw: true,
    }) as unknown as Array<{ forex_uuid: string; oldest_date: string }>;

    const result: Map<string, Date> = new Map<string, Date>();
    for (const row of rows) {
      result.set(row.forex_uuid, new Date(row.oldest_date));
    }
    return result;
  }

  public async bulkCreateRates(
    records: Array<{ forex_uuid: string; forex_rate: number; forex_rate_date: Date }>
  ): Promise<void> {
    if (records.length === 0) {
      return;
    }

    await ForexRate.bulkCreate(records as CreationAttributes<ForexRate>[], {
      ignoreDuplicates: true,
    });
  }
}

export default ForexRateRepository;
