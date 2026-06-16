import { app, InvocationContext, Timer } from "@azure/functions";
import SyncForexService from "../services/sync.forex.service";

const syncForexService: SyncForexService = new SyncForexService();

async function SyncForexTimer(_timer: Timer, context: InvocationContext): Promise<void> {
  context.log("SyncForexTimer triggered at", new Date().toISOString());

  try {
    await syncForexService.syncForexRates();
  }
  catch (error) {
    context.log("Error in SyncForexTimer:", error);
  }
}

app.timer("SyncForexTimer", {
  schedule: "0 15 0 * * *",
  handler: SyncForexTimer,
});
