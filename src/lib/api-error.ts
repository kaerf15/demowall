import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = "Bad Request") {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Not Found") {
    super(message, 404);
  }
}

type ApiHandler = (req: Request, ...args: any[]) => Promise<Response | NextResponse>;

export function withErrorHandler(handler: ApiHandler): ApiHandler {
  return async (req: Request, ...args: any[]) => {
    try {
      return await handler(req, ...args);
    } catch (error: any) {
      console.error("API Error:", error);

      if (error instanceof AppError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.statusCode }
        );
      }

      if (error instanceof ZodError) {
        return NextResponse.json(
          { error: "Validation Error", details: error.issues },
          { status: 400 }
        );
      }

      // Handle Prisma known errors (optional, simplified here)
      if (error.code && error.code.startsWith('P')) {
         // P2002: Unique constraint failed
         if (error.code === 'P2002') {
            return NextResponse.json(
                { error: "Duplicate entry found" },
                { status: 409 }
            );
         }
         // P2025: Record not found
         if (error.code === 'P2025') {
            return NextResponse.json(
                { error: "Resource not found" },
                { status: 404 }
            );
         }
      }

      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }
  };
}
