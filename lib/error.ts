export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly retryable: boolean;
  public readonly subsystem: string;
  public readonly cause?: any;

  constructor(params: {
    message: string;
    code: string;
    statusCode?: number;
    retryable?: boolean;
    subsystem: string;
    cause?: any;
  }) {
    super(params.message);
    this.name = "AppError";
    this.code = params.code;
    this.statusCode = params.statusCode || 500;
    this.retryable = params.retryable ?? false;
    this.subsystem = params.subsystem;
    this.cause = params.cause;
  }
}
