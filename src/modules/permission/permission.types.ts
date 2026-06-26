export type UserRole =
    | "ADMIN"
    | "BROKER"
    | "CLIENT";

export type UserStatus =
    | "PENDING"
    | "APPROVED"
    | "REJECTED"
    | "ACTIVE"
    | "INACTIVE";

export type JwtUser = {
    id: string;
    email: string;
    role: UserRole;
    status: UserStatus;
};

export type Permission =
    | "MANAGE_USERS"
    | "MANAGE_PROPERTIES"
    | "MANAGE_LEADS"
    | "MANAGE_REVENUES"
    | "MANAGE_VIEWINGS"
    | "VIEW_OWN_VIEWINGS"
    | "VIEW_DASHBOARD"
    | "VIEW_AUDIT_LOGS"
    | "MANAGE_NOTIFICATIONS"
    | "SAVE_PROPERTIES";