import { describe, expect, it } from "vitest";
import { reportQuerySchema } from "./report.schema.js";

describe("Report schema", () => {
  it("should accept an empty report query", () => {
    expect(reportQuerySchema.parse({})).toEqual({});
  });

  it("should accept a valid date range", () => {
    const query = {
      dateFrom: "2026-01-01T00:00:00.000Z",
      dateTo: "2026-12-31T23:59:59.000Z",
    };

    expect(reportQuerySchema.parse(query)).toEqual(query);
  });

  it("should accept brokerId filter", () => {
    const query = {
      brokerId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    };

    expect(reportQuerySchema.parse(query)).toEqual(query);
  });

  it("should reject dateFrom later than dateTo", () => {
    expect(() =>
      reportQuerySchema.parse({
        dateFrom: "2026-12-31T00:00:00.000Z",
        dateTo: "2026-01-01T00:00:00.000Z",
      }),
    ).toThrow();
  });
});
