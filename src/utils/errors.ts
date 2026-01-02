/**
 * Base error class for the application
 */
export class AppError extends Error {
  constructor(
    message: string,
    public userMessage: string,
    public code: string,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Network-related errors
 */
export class NetworkError extends AppError {
  constructor(message: string, userMessage?: string) {
    super(
      message,
      userMessage || 'Unable to connect to the internet',
      'NETWORK_ERROR',
      true
    );
  }
}

export class NoConnectionError extends NetworkError {
  constructor() {
    super(
      'No internet connection',
      'No internet connection. Please check your network settings.'
    );
    this.code = 'NO_CONNECTION';
  }
}

export class TimeoutError extends NetworkError {
  constructor() {
    super(
      'Request timed out',
      'The request took too long. Please try again.'
    );
    this.code = 'TIMEOUT';
  }
}

/**
 * Location/GPS errors
 */
export class LocationError extends AppError {
  constructor(message: string, userMessage: string, code: string) {
    super(message, userMessage, code, true);
  }
}

export class PermissionDeniedError extends LocationError {
  constructor() {
    super(
      'Location permission denied',
      'Location access is required. Please enable it in your device settings.',
      'PERMISSION_DENIED'
    );
    this.recoverable = false; // Requires user action in settings
  }
}

export class LocationUnavailableError extends LocationError {
  constructor() {
    super(
      'Location unavailable',
      'Unable to determine your location. Make sure GPS is enabled.',
      'LOCATION_UNAVAILABLE'
    );
  }
}

export class PositionTimeoutError extends LocationError {
  constructor() {
    super(
      'Location timeout',
      'Finding your location is taking too long. Please try again.',
      'POSITION_TIMEOUT'
    );
  }
}

/**
 * API-related errors
 */
export class ApiError extends AppError {
  constructor(
    message: string,
    public statusCode: number,
    userMessage?: string
  ) {
    super(
      message,
      userMessage || 'An error occurred while fetching data',
      `API_ERROR_${statusCode}`,
      statusCode >= 500 // Server errors are recoverable (retry)
    );
  }
}

export class RateLimitError extends ApiError {
  constructor(retryAfter?: number) {
    const message = retryAfter
      ? `Too many requests. Please wait ${retryAfter} seconds.`
      : 'Too many requests. Please slow down and try again.';

    super('Rate limit exceeded', 429, message);
    this.code = 'RATE_LIMIT';
  }
}

export class ServerError extends ApiError {
  constructor(statusCode: number) {
    super(
      `Server error: ${statusCode}`,
      statusCode,
      'Our servers are experiencing issues. Please try again in a moment.'
    );
    this.code = 'SERVER_ERROR';
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super(
      `${resource} not found`,
      404,
      `${resource} was not found. Please check and try again.`
    );
    this.code = 'NOT_FOUND';
    this.recoverable = false;
  }
}

export class BadRequestError extends ApiError {
  constructor(details?: string) {
    super(
      'Bad request',
      400,
      details || 'Invalid request. Please check your input and try again.'
    );
    this.code = 'BAD_REQUEST';
    this.recoverable = false;
  }
}

export class AuthenticationError extends ApiError {
  constructor() {
    super(
      'Weather service authentication failed',
      401,
      'Weather service is temporarily unavailable. Please try again later.'
    );
    this.code = 'AUTHENTICATION_ERROR';
    this.recoverable = false; // No retry for 401 errors
  }
}

/**
 * User input errors
 */
export class UserError extends AppError {
  constructor(message: string, userMessage: string, code: string) {
    super(message, userMessage, code, false);
  }
}

export class InvalidInputError extends UserError {
  constructor(field: string) {
    super(
      `Invalid input: ${field}`,
      `Please enter a valid ${field}.`,
      'INVALID_INPUT'
    );
  }
}

export class DuplicateLocationError extends UserError {
  constructor() {
    super(
      'Duplicate location',
      'This location has already been added.',
      'DUPLICATE_LOCATION'
    );
  }
}

/**
 * Error factory to convert unknown errors to AppError
 */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new NoConnectionError();
  }

  if (error instanceof Error) {
    if (error.message.includes('timeout')) {
      return new TimeoutError();
    }
    if (error.message.includes('network')) {
      return new NetworkError('Network error occurred');
    }

    // Generic fallback - use error.message for internal logging only
    return new AppError(
      error.message,
      'An unexpected error occurred. Please try again.',
      'UNKNOWN_ERROR',
      true
    );
  }

  return new AppError(
    'Unknown error',
    'Something went wrong. Please try again.',
    'UNKNOWN_ERROR',
    true
  );
}
