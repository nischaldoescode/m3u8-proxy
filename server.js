import { Application } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { cacheRoutes } from "./utils/cache-routes.js";
import { router } from "./routes/routes.js";

const app1 = new Application();
app1.use(cacheRoutes(3600));
app1.use(router.routes());
app1.use(router.allowedMethods());

await app1.listen({ port: 4001 });
console.log("Oak server running at http://localhost:4001");
