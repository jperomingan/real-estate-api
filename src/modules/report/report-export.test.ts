import { describe, expect, it } from "vitest";
import { buildCsv } from "./report-export.service.js";

describe("Report CSV export", () => {
  it("should build CSV with headers and rows", () => {
    const csv = buildCsv(["status", "count"], [
      {
        status: "NEW",
        count: 2,
      },
      {
        status: "CONTACTED",
        count: 1,
      },
    ]);

    expect(csv).toBe("status,count\nNEW,2\nCONTACTED,1");
  });

  it("should escape values with commas", () => {
    const csv = buildCsv(["source", "count"], [
      {
        source: "Facebook, Ads",
        count: 3,
      },
    ]);

    expect(csv).toBe('source,count\n"Facebook, Ads",3');
  });

  it("should escape double quotes", () => {
    const csv = buildCsv(["source", "count"], [
      {
        source: 'Client "Referral"',
        count: 1,
      },
    ]);

    expect(csv).toBe('source,count\n"Client ""Referral""",1');
  });

  it("should include headers when rows are empty", () => {
    const csv = buildCsv(["status", "count"], []);

    expect(csv).toBe("status,count");
  });
});
