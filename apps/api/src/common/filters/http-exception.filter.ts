import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";

type RequestWithId = {
  method: string;
  originalUrl?: string;
  url?: string;
  requestId?: string;
};

type ResponseWithHeaders = {
  status: (code: number) => ResponseWithHeaders;
  json: (body: any) => void;
  setHeader: (name: string, value: string) => void;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger("Exceptions");

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<ResponseWithHeaders>();
    const request = ctx.getRequest<RequestWithId>();
    const isProd = process.env.NODE_ENV === "production";

    let status = 500;
    let error = "Internal Server Error";
    let message = "Что-то пошло не так. Попробуйте ещё раз.";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const payload = exception.getResponse() as { message?: string | string[]; error?: string };
      error = payload?.error || error;
      if (Array.isArray(payload?.message)) {
        message = payload.message.join("; ");
      } else if (typeof payload?.message === "string") {
        message = payload.message;
      } else {
        message = exception.message || message;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      status = 400;
      error = "Bad Request";
      message = "Некорректные данные запроса.";
    }

    const requestId = request.requestId;
    if (requestId) {
      response.setHeader("x-request-id", requestId);
    }

    if (!isProd && exception instanceof Error) {
      this.logger.error(
        `${request.method} ${request.originalUrl || request.url || ""} -> ${status}`,
        exception.stack
      );
    } else {
      this.logger.error(`${request.method} ${request.originalUrl || request.url || ""} -> ${status}`);
    }

    response.status(status).json({
      statusCode: status,
      error,
      message,
      requestId,
      timestamp: new Date().toISOString()
    });
  }
}
