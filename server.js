import { Application } from "oak/mod.ts";
import { cacheRoutes } from "./utils/cache-routes.js";
import { router } from "./routes/routes.js";

const app1 = new Application();
app1.use(cacheRoutes(3600));
app1.use(router.routes());
app1.use(router.allowedMethods());

// Always export fetch handler for Deno Deploy
export default {
  fetch: app1.fetch, // Oak 11+ provides a fetch method
};

// Only start listening when running locally or in Docker
if (!Deno.env.get("DENO_DEPLOYMENT_ID")) {
  console.log("Oak server running at http://localhost:4001");
  await app1.listen({ port: 4001 });
}
