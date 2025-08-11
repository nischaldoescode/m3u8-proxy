import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { cacheRoutes } from "./utils/cache-routes.js";
import { router } from "./routes/routes.js";
import { compose } from "oak/middleware.ts";

const composed = compose([
  cacheRoutes(3600),
  router.routes(),
  router.allowedMethods(),
]);

export default (req) => composed(req);
