import { app, HttpRequest, HttpResponseInit, InvocationContext, Timer } from "@azure/functions";
import SyncService from "../services/sync.service";

const syncService: SyncService = new SyncService();

async function SyncAssetPricesTrigger(_req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log("SyncAssetPricesTrigger triggered at", new Date().toISOString());

  try {
    await syncService.syncAssetPrices(20);

    return {
      status: 200,
      jsonBody: {
        processedAt: new Date().toISOString(),
        message: "Asset prices synchronized successfully"
      },
    };
  }
  catch (error) {
    context.log("Error in SyncAssetPricesTrigger:", error);
    return {
      status: 500,
      jsonBody: { error: String(error) }
    };
  }
}

app.http("SyncAssetPricesHttp", {
  methods: ["GET", "POST"],
  authLevel: "function",
  handler: SyncAssetPricesTrigger,
});
