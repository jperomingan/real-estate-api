export function trimString(value: unknown) {
    if (typeof value !== "string") {
        return value;
    }

    return value.trim();
}

export function emptyStringToUndefined(value: unknown) {
    if (typeof value !== "string") {
        return value;
    }

    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : undefined;
}

export function normalizeEmail(value: unknown) {
    if (typeof value !== "string") {
        return value;
    }

    return value.trim().toLowerCase();
}

export function normalizeOptionalEmail(value: unknown) {
    if (typeof value !== "string") {
        return value;
    }

    const trimmed = value.trim().toLowerCase();

    return trimmed.length > 0 ? trimmed : undefined;
}