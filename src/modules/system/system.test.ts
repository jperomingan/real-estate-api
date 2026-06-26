import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../../test/app-test-helper.js";

describe("System API", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should return API and developer information", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/info",
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();

    expect(body.success).toBe(true);
    expect(body.message).toBe("API information fetched successfully");

    expect(body.data.name).toBe("Real Estate Management System API");

    expect(body.data.version).toBe("1.0.0");

    expect(body.data.developer).toEqual({
      name: "Jennelyn Urot Peromingan",
      role: "Backend Developer and API Author",
      email: "perominganj@gmail.com",
      profile: "https://github.com/jperomingan",
    });

    expect(body.data.repository).toBe(
      "https://github.com/jperomingan/real-estate-api",
    );
  });
});
