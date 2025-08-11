import { Application } from "oak/mod.ts";
import { cacheRoutes } from "./utils/cache-routes.js";
import { router } from "./routes/routes.js";

const app = new Application();
app.use(cacheRoutes(3600));
app.use(router.routes());
app.use(router.allowedMethods());

export default app.handle;
