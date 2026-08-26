import { describe, expect, it } from "vitest";

describe("Supabase production configuration", () => {
  it("authenticates the configured publishable key against the project settings endpoint", async () => {
    const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(projectUrl).toMatch(/^https:\/\/.+\.supabase\.co$/);
    expect(publishableKey).toBeTruthy();
    expect(serviceRoleKey).toBeTruthy();

    const response = await fetch(`${projectUrl}/auth/v1/settings`, {
      headers: { apikey: publishableKey!, Authorization: `Bearer ${publishableKey}` },
    });

    expect(response.status).toBe(200);
  }, 15_000);
});
