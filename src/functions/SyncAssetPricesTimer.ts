import { app, InvocationContext, Timer } from "@azure/functions";
import SyncService from "../services/sync.service";
import { ASSETS_LIMIT } from "../constants/const";

const syncService: SyncService = new SyncService();

async function SyncAssetPricesTimer(_timer: Timer, context: InvocationContext): Promise<void> {
  context.log("SyncAssetPricesTimer triggered at", new Date().toISOString());

  try {
    await syncService.syncAssetPrices(ASSETS_LIMIT);
  }
  catch (error) {
    context.log("Error in SyncAssetPricesTimer:", error);
  }
}

app.timer("SyncAssetPricesTimer", {
  schedule: "0 0 * * *",
  handler: SyncAssetPricesTimer
});
