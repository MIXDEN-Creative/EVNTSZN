import { createSafeActionClient } from "next-safe-action";
import { requirePlatformUser } from "@/lib/evntszn";

export const actionClient = createSafeActionClient({
  handleServerError(e) {
    if (e instanceof Error) {
      return e.message;
    }
    return "An unexpected error occurred.";
  },
});

export const authActionClient = actionClient.use(async ({ next }) => {
  const viewer = await requirePlatformUser("/account");
  if (!viewer.user) {
    throw new Error("Unauthorized");
  }
  return next({ ctx: { viewer } });
});
