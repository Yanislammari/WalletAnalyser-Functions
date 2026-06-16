import { app, InvocationContext, Timer } from "@azure/functions";
import SyncDividendsService from "../services/sync.dividends.service";

const syncDividendsService: SyncDividendsService = new SyncDividendsService();

async function SyncAssetDividendsTimer(_timer: Timer, context: InvocationContext): Promise<void> {
  context.log("SyncAssetDividendsTimer triggered at", new Date().toISOString());

  try {
    await syncDividendsService.syncAssetDividends();
  }
  catch (error) {
    context.log("Error in SyncAssetDividendsTimer:", error);
  }
}

app.timer("SyncAssetDividendsTimer", {
  schedule: "0 30 0 * * *",
  handler: SyncAssetDividendsTimer,
});
