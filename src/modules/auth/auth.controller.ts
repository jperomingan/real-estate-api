import type { FastifyReply, FastifyRequest } from "fastify";
import { authService } from "./auth.service.js";
import type { LoginInput, RegisterInput } from "./auth.schema.js";
import { sendSuccess, sendError } from "../../utils/api-response.js";

type AuthenticatedRequest = FastifyRequest & {
  user?: {
    id: string;
    email: string;
    role: string;
    status: string;
  };
};

export async function registerController(
  request: FastifyRequest<{
    Body: RegisterInput;
  }>,
  reply: FastifyReply,
) {
  const result = await authService.register(request.body);

  return sendSuccess({
    reply,
    statusCode: 201,
    message: "User registered successfully",
    data: result,
  });
}

export async function loginController(
  request: FastifyRequest<{
    Body: LoginInput;
  }>,
  reply: FastifyReply,
) {
  const result = await authService.login(request.body);

  if (!result) {
    return sendError({
      reply,
      statusCode: 401,
      message: "Invalid email or password",
      code: "INVALID_CREDENTIALS",
      requestId: request.id,
    });
  }

  return sendSuccess({
    reply,
    message: "Login successful",
    data: result,
  });
}

export async function meController(
  request: AuthenticatedRequest,
  reply: FastifyReply,
) {
  if (!request.user) {
    return sendError({
      reply,
      statusCode: 401,
      message: "Unauthorized",
      code: "UNAUTHORIZED",
      requestId: request.id,
    });
  }

  const user = await authService.getCurrentUser(request.user.id);

  if (!user) {
    return sendError({
      reply,
      statusCode: 404,
      message: "User not found",
      code: "USER_NOT_FOUND",
      requestId: request.id,
    });
  }

  return sendSuccess({
    reply,
    message: "Current user retrieved successfully",
    data: user,
  });
}

export const authController = {
  register: registerController,
  login: loginController,
  me: meController,
};
