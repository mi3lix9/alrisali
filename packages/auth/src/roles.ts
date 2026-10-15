// Roles alone, without the server's auth: the web admin imports this too
// (`@alrisali/auth/roles`).

/** The better-auth admin plugin role that marks an Admin. */
export const ADMIN_ROLE = "admin";

/**
 * Whether a user holds the Admin role. better-auth stores roles on the user,
 * comma-separated when there are several.
 */
export const isAdmin = (user: { role?: string | null | undefined }): boolean =>
  (user.role ?? "")
    .split(",")
    .map((role) => role.trim())
    .includes(ADMIN_ROLE);
