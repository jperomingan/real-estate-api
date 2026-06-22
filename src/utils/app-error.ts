export class AppError extends Error {
    statusCode: number;
    errors?: unknown;

    constructor(message: string, statusCode = 400, errors?: unknown) {
        super(message);

        this.name = "AppError";
        this.statusCode = statusCode;
        this.errors = errors;
    }
}

export function isAppError(error: unknown): error is AppError {
    return error instanceof AppError;
}