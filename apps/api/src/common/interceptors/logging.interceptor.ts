import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { catchError, tap } from "rxjs/operators";

type RequestWithId = {
  method: string;
  originalUrl?: string;
  url?: string;
  requestId?: string;
};

type ResponseWithStatus = {
  statusCode: number;
};

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger("HTTP");

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const request = http.getRequest<RequestWithId>();
    const response = http.getResponse<ResponseWithStatus>();
    const startedAt = Date.now();
    const path = request.originalUrl || request.url || "";

    return next.handle().pipe(
      tap(() => {
        const durationMs = Date.now() - startedAt;
        this.logger.log(
          JSON.stringify({
            requestId: request.requestId,
            method: request.method,
            path,
            status: response.statusCode,
            durationMs
          })
        );
      }),
      catchError((error) => {
        const durationMs = Date.now() - startedAt;
        const status = typeof error?.getStatus === "function" ? error.getStatus() : 500;
        this.logger.error(
          JSON.stringify({
            requestId: request.requestId,
            method: request.method,
            path,
            status,
            durationMs
          })
        );
        throw error;
      })
    );
  }
}
