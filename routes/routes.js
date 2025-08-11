import { Router } from "oak/mod.ts";
import { m3u8Proxy } from "../utils/m3u8-proxy.js";

const router = new Router();
router.get("/m3u8-proxy", m3u8Proxy);

export { router };