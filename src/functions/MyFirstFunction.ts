import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export async function MyFirstFunction(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
	context.log(`Http function processed request for url "${request.url}"`);
	const name = request.query.get('name') || await request.text() || 'world';

	return { body: `Hello, ${name}!` };
};

app.http("MyFirstFunction", {
	methods: ["GET", "POST"],
	authLevel: "anonymous",
	handler: MyFirstFunction
});
