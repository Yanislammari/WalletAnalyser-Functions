import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import SyncDividendsService from "../services/sync.dividends.service";

const syncDividendsService: SyncDividendsService = new SyncDividendsService();

async function SyncAssetDividendsTrigger(_req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log("SyncAssetDividendsTrigger triggered at", new Date().toISOString());

  try {
    await syncDividendsService.syncAssetDividends();

    return {
      status: 200,
      jsonBody: {
        processedAt: new Date().toISOString(),
        message: "Asset dividends synchronized successfully",
      },
    };
  }
  catch (error) {
    context.log("Error in SyncAssetDividendsTrigger:", error);

    return {
      status: 500,
      jsonBody: { error: String(error) },
    };
  }
}

app.http("SyncAssetDividendsHttp", {
  methods: ["GET", "POST"],
  authLevel: "function",
  handler: SyncAssetDividendsTrigger,
});
