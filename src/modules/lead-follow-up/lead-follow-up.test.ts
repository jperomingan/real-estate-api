import { describe, expect, it } from "vitest";
import {
  createLeadFollowUpSchema,
  leadFollowUpQuerySchema,
  updateLeadFollowUpSchema,
} from "./lead-follow-up.schema.js";

describe("Lead follow-up schema", () => {
  it("should accept valid create input", () => {
    const input = {
      title: "Call client",
      description: "Follow up about viewing schedule",
      priority: "HIGH",
      dueDate: "2026-07-15T09:00:00.000Z",
    };

    expect(createLeadFollowUpSchema.parse(input)).toEqual(input);
  });

  it("should default priority to MEDIUM", () => {
    const input = {
      title: "Send quotation",
    };

    expect(createLeadFollowUpSchema.parse(input)).toEqual({
      title: "Send quotation",
      priority: "MEDIUM",
    });
  });

  it("should reject empty title", () => {
    expect(() =>
      createLeadFollowUpSchema.parse({
        title: "",
      }),
    ).toThrow();
  });

  it("should accept valid update input", () => {
    const input = {
      status: "DONE",
      priority: "LOW",
    };

    expect(updateLeadFollowUpSchema.parse(input)).toEqual(input);
  });

  it("should parse default query pagination", () => {
    expect(leadFollowUpQuerySchema.parse({})).toEqual({
      page: 1,
      limit: 20,
    });
  });
});
