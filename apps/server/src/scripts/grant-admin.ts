// Gives (or, with --revoke, takes away) the Admin role on the account with
// this email. The account must exist: sign in once (or sign up on /admin)
// first. Usage: bun run admin:grant <email> [--revoke]
import { grantAdminRole, revokeAdminRole } from "@alrisali/auth";
import { createDb } from "@alrisali/db-server";

import { ENV } from "@/env.server";

const [email, flag] = process.argv.slice(2);
if (!email || (flag !== undefined && flag !== "--revoke")) {
  console.error("Usage: bun run admin:grant <email> [--revoke]");
  process.exit(1);
}

const db = createDb(ENV);
if (flag === "--revoke") {
  await revokeAdminRole(db, email);
  console.log(`${email} is no longer an Admin`);
} else {
  await grantAdminRole(db, email);
  console.log(`${email} is now an Admin`);
}
