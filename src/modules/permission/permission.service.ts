import type {
    JwtUser,
    Permission,
    UserRole,
} from "./permission.types.js";

const rolePermissions: Record<
    UserRole,
    readonly Permission[]
> = {
    ADMIN: [
        "MANAGE_USERS",
        "MANAGE_PROPERTIES",
        "MANAGE_LEADS",
        "MANAGE_REVENUES",
        "MANAGE_VIEWINGS",
        "VIEW_OWN_VIEWINGS",
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
    ],

    CLIENT: [
        "VIEW_OWN_VIEWINGS",
        "MANAGE_NOTIFICATIONS",
        "SAVE_PROPERTIES",
    ],
};

export function getPermissionsForRole(
    role: UserRole,
): readonly Permission[] {
    return rolePermissions[role];
}

export function hasPermission(
    user: JwtUser,
    permission: Permission,
): boolean {
    if (user.status !== "ACTIVE") {
        return false;
    }

    return rolePermissions[user.role].includes(
        permission,
    );
}