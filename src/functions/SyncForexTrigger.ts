import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import SyncForexService from "../services/sync.forex.service";

const syncForexService: SyncForexService = new SyncForexService();

async function SyncForexTrigger(_req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log("SyncForexTrigger triggered at", new Date().toISOString());

  try {
    await syncForexService.syncForexRates();

    return {
      status: 200,
      jsonBody: {
        processedAt: new Date().toISOString(),
        message: "Forex rates synchronized successfully",
      },
    };
  }
  catch (error) {
    context.log("Error in SyncForexTrigger:", error);

    return {
      status: 500,
      jsonBody: { error: String(error) },
    };
  }
}

app.http("SyncForexHttp", {
  methods: ["GET", "POST"],
  authLevel: "function",
  handler: SyncForexTrigger,
});
