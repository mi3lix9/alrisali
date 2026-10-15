// Deploy step, after the server database migrations: Hot Updater's schema
// settings rows and the app's client API key.
import { ENV } from "@/env.server";
import { createOtaServer, requireOtaConfig } from "@/features/ota";
import { db } from "@/services";

await createOtaServer(requireOtaConfig(ENV), db).prepare();
console.log("Hot Updater is ready.");
