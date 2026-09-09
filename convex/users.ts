import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/** Returns the current authenticated user's ID, or null if not signed in. */
export const getCurrentUserId = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    return userId ?? null;
  },
});
