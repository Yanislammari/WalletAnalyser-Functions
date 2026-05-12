import { app, InvocationContext, Timer } from "@azure/functions";
import SyncService from "../services/sync.service";

const syncService: SyncService = new SyncService();

async function SyncAssetPricesTimer(_timer: Timer, context: InvocationContext): Promise<void> {
  context.log("SyncAssetPricesTimer triggered at", new Date().toISOString());

  try {
    await syncService.syncAssetPrices(5);
  }
  catch (error) {
    context.log("Error in SyncAssetPricesTimer:", error);
  }
}

app.timer("SyncAssetPricesTimer", {
  schedule: "0 0 * * *",
  handler: SyncAssetPricesTimer
});
