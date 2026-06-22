export const errorResponseSchema = {
    type: "object",
    properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        errors: {},
    },
};

export const paginationSchema = {
    type: "object",
    properties: {
        page: { type: "number" },
        limit: { type: "number" },
        total: { type: "number" },
        totalPages: { type: "number" },
        hasNextPage: { type: "boolean" },
        hasPreviousPage: { type: "boolean" },
    },
};

export function successResponseSchema(dataSchema?: object) {
    return {
        type: "object",
        properties: {
            success: { type: "boolean" },
            message: { type: "string" },
            data: dataSchema ?? {},
        },
    };
}

export function paginatedResponseSchema(itemSchema: object) {
    return successResponseSchema({
        type: "object",
        properties: {
            items: {
                type: "array",
                items: itemSchema,
            },
            pagination: paginationSchema,
        },
    });
}