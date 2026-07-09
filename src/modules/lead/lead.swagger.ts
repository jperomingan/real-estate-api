import {
  errorResponseSchema,
  paginatedResponseSchema,
  successResponseSchema,
} from "../../utils/swagger-schemas.js";

export const leadStatusValues = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "VIEWING_SCHEDULED",
  "NEGOTIATION",
  "CLOSED_WON",
  "CLOSED_LOST",
  "ARCHIVED",
];

export const leadSourceValues = [
  "WEBSITE",
  "FACEBOOK",
  "REFERRAL",
  "WALK_IN",
  "PHONE_CALL",
  "EMAIL",
  "OTHER",
];

export const leadPropertyResponseSchema = {
  type: "object",
  nullable: true,
  properties: {
    id: { type: "string" },
    title: { type: "string" },
    price: { type: "string" },
    city: { type: "string" },
    province: { type: "string" },
    status: { type: "string" },
  },
};

export const leadBrokerResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    firstName: { type: "string" },
    lastName: { type: "string" },
    email: { type: "string" },
    phone: { type: "string", nullable: true },
  },
};

export const leadResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    firstName: { type: "string" },
    lastName: { type: "string", nullable: true },
    email: { type: "string", nullable: true },
    phone: { type: "string" },
    message: { type: "string", nullable: true },
    source: { type: "string", enum: leadSourceValues },
    status: { type: "string", enum: leadStatusValues },
    budget: { type: "string", nullable: true },
    preferredDate: { type: "string", nullable: true },
    propertyId: { type: "string", nullable: true },
    property: leadPropertyResponseSchema,
    brokerId: { type: "string" },
    broker: leadBrokerResponseSchema,
    clientId: { type: "string", nullable: true },
    createdAt: { type: "string" },
    updatedAt: { type: "string" },
  },
};

export const createLeadBodySchema = {
  type: "object",
  required: ["firstName", "phone"],
  properties: {
    firstName: {
      type: "string",
      description: "Lead first name. Example: Maria",
    },
    lastName: {
      type: "string",
      description: "Optional lead last name. Example: Santos",
    },
    email: {
      type: "string",
      description: "Optional lead email. Example: maria@example.com",
    },
    phone: {
      type: "string",
      description: "Lead phone number. Example: 09123456789",
    },
    message: {
      type: "string",
      description: "Optional inquiry message",
    },
    source: {
      type: "string",
      enum: leadSourceValues,
      description: "Where the lead came from. Defaults to WEBSITE.",
    },
    budget: {
      type: "number",
      description: "Optional client budget",
    },
    preferredDate: {
      type: "string",
      description: "Optional preferred date. ISO format.",
    },
    propertyId: {
      type: "string",
      description:
        "Optional property ID. If provided, broker will be assigned from the property.",
    },
    brokerId: {
      type: "string",
      description:
        "Required only when propertyId is not provided. Assigns lead to a broker/admin.",
    },
  },
};

export const leadParamsSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      description: "Lead ID",
    },
  },
};

export const leadListQuerySchemaForSwagger = {
  type: "object",
  properties: {
    search: {
      type: "string",
      description: "Search by first name, last name, email, or phone",
    },
    status: {
      type: "string",
      enum: leadStatusValues,
    },
    source: {
      type: "string",
      enum: leadSourceValues,
    },
    propertyId: {
      type: "string",
    },
    brokerId: {
      type: "string",
    },
    page: {
      type: "number",
    },
    limit: {
      type: "number",
    },
  },
};

export const updateLeadStatusBodySchema = {
  type: "object",
  required: ["status"],
  properties: {
    status: {
      type: "string",
      enum: leadStatusValues,
      description: "New lead status",
    },
  },
};

export const leadSuccessResponseSchema =
  successResponseSchema(leadResponseSchema);

export const leadListResponseSchema =
  paginatedResponseSchema(leadResponseSchema);

export const leadDeleteResponseSchema = successResponseSchema({
  type: "object",
  properties: {},
});

export const leadErrorResponseSchema = errorResponseSchema;
