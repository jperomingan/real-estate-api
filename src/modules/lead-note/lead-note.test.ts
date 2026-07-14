import { describe, expect, it } from "vitest";
import {
  createLeadNoteSchema,
  leadNoteQuerySchema,
  updateLeadNoteSchema,
} from "./lead-note.schema.js";

describe("Lead note schema", () => {
  it("should accept valid create input", () => {
    const input = {
      type: "CALL",
      content: "Called client and confirmed interest.",
    };

    expect(createLeadNoteSchema.parse(input)).toEqual(input);
  });

  it("should default type to GENERAL", () => {
    const input = {
      content: "Client prefers a condo near IT Park.",
    };

    expect(createLeadNoteSchema.parse(input)).toEqual({
      type: "GENERAL",
      content: "Client prefers a condo near IT Park.",
    });
  });

  it("should reject empty content", () => {
    expect(() =>
      createLeadNoteSchema.parse({
        content: "",
      }),
    ).toThrow();
  });

  it("should accept valid update input", () => {
    const input = {
      type: "MEETING",
      content: "Updated meeting notes.",
    };

    expect(updateLeadNoteSchema.parse(input)).toEqual(input);
  });

  it("should parse default query pagination", () => {
    expect(leadNoteQuerySchema.parse({})).toEqual({
      page: 1,
      limit: 20,
    });
  });
});
