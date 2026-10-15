import { createAuth } from "@alrisali/auth";
import { createDb } from "@alrisali/db-server";

import { ENV } from "./env.server";

export const db = createDb(ENV);
export const auth = createAuth(ENV, db);
