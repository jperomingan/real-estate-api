export type PaginationInput = {
    page: number;
    limit: number;
    total: number;
};

export function buildPagination({ page, limit, total }: PaginationInput) {
    const totalPages = Math.ceil(total / limit);

    return {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
    };
}

export function getPaginationOffset(page: number, limit: number) {
    return (page - 1) * limit;
}