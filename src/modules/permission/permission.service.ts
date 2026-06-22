import { JwtUser, Permission } from "./permission.types.js";

const rolePermissions: Record<string, Permission[]> = {
    ADMIN: [
        "MANAGE_USERS",
        "MANAGE_PROPERTIES",
        "MANAGE_LEADS",
        "MANAGE_REVENUES",
        "MANAGE_VIEWINGS",
        "VIEW_DASHBOARD",
        "VIEW_AUDIT_LOGS",
        "MANAGE_NOTIFICATIONS",
        "SAVE_PROPERTIES",
    ],

    BROKER: [
        "MANAGE_PROPERTIES",
        "MANAGE_LEADS",
        "MANAGE_REVENUES",
        "MANAGE_VIEWINGS",
        "VIEW_DASHBOARD",
        "MANAGE_NOTIFICATIONS",
        "SAVE_PROPERTIES",
    ],

    CLIENT: [
        "SAVE_PROPERTIES",
        "MANAGE_NOTIFICATIONS",
    ],
};

export function hasPermission(user: JwtUser, permission: Permission) {
    if (user.status === "REJECTED" || user.status === "INACTIVE") {
        return false;
    }

    if (user.role === "BROKER" && user.status !== "APPROVED") {
        return false;
    }

    const permissions = rolePermissions[user.role] ?? [];

    return permissions.includes(permission);
}