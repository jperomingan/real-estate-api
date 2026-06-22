import { describe, expect, it } from "vitest";
import { buildPaginationMeta } from "../utils/api-response.js";

describe("API Response Helpers", () => {
    it("should build pagination meta", () => {
        const meta = buildPaginationMeta({
            page: 2,
            limit: 10,
            total: 35,
        });

        expect(meta.pagination.page).toBe(2);
        expect(meta.pagination.limit).toBe(10);
        expect(meta.pagination.total).toBe(35);
        expect(meta.pagination.totalPages).toBe(4);
        expect(meta.pagination.hasNextPage).toBe(true);
        expect(meta.pagination.hasPreviousPage).toBe(true);
    });

    it("should detect first page", () => {
        const meta = buildPaginationMeta({
            page: 1,
            limit: 10,
            total: 15,
        });

        expect(meta.pagination.hasPreviousPage).toBe(false);
        expect(meta.pagination.hasNextPage).toBe(true);
    });

    it("should detect last page", () => {
        const meta = buildPaginationMeta({
            page: 2,
            limit: 10,
            total: 15,
        });

        expect(meta.pagination.hasPreviousPage).toBe(true);
        expect(meta.pagination.hasNextPage).toBe(false);
    });
});