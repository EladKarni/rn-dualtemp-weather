/**
 * HTTP client utilities with timeout and error handling
 * Centralizes fetch patterns and error mapping
 */

import {
  ApiError,
  BadRequestError,
  ServerError,
  TimeoutError,
  NetworkError,
  toAppError,
} from './errors';
import { logger } from './logger';

/**
 * Fetch with automatic timeout using AbortController
 * @param url URL to fetch
 * @param timeoutMs Timeout in milliseconds (default: 10000)
 * @param options Fetch options
 * @returns Promise resolving to Response
 */
export const fetchWithTimeout = async (
  url: string,
  timeoutMs: number = 10000,
  options?: RequestInit
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Maps HTTP status codes to appropriate AppError types
 * @param status HTTP status code
 * @param responseText Optional response body text for context
 * @returns AppError instance
 */
export const mapHttpError = (status: number, responseText?: string): ApiError => {
  if (status === 400) {
    return new BadRequestError(responseText || 'Invalid request');
  }

  if (status === 401) {
    return new ApiError(
      'Unauthorized',
      status,
      'Authentication failed. Please try again later.'
    );
  }

  if (status === 404) {
    return new ApiError(
      'Not found',
      status,
      'The requested resource was not found.'
    );
  }

  if (status === 429) {
    return new ApiError(
      'Rate limit exceeded',
      status,
      'Too many requests. Please wait a moment and try again.'
    );
  }

  if (status >= 500) {
    return new ServerError(status);
  }

  // Generic client error (4xx)
  if (status >= 400 && status < 500) {
    return new ApiError(
      `Client error: ${status}`,
      status,
      'There was a problem with your request. Please try again.'
    );
  }

  // Unexpected status code
  return new ApiError(
    `Unexpected status: ${status}`,
    status,
    'An unexpected error occurred. Please try again.'
  );
};

/**
 * Handles fetch errors and converts them to AppError types
 * @param error The caught error
 * @returns Never - always throws an AppError
 */
export const handleFetchError = (error: unknown): never => {
  // AbortController timeout
  if (error instanceof Error && error.name === 'AbortError') {
    logger.warn('Request aborted due to timeout');
    throw new TimeoutError();
  }

  // Network errors (no internet, DNS failure, etc.)
  if (error instanceof TypeError) {
    logger.error('Network error:', error.message);
    throw new NetworkError('Network request failed');
  }

  // Already an AppError
  if (error instanceof ApiError) {
    throw error;
  }

  // Convert unknown errors
  const appError = toAppError(error);
  logger.error('Fetch error:', appError);
  throw appError;
};

/**
 * Combined fetch with timeout and error handling
 * Automatically handles common error scenarios
 * @param url URL to fetch
 * @param options Fetch options
 * @param timeoutMs Timeout in milliseconds (default: 10000)
 * @returns Promise resolving to Response
 */
export const fetchWithErrorHandling = async (
  url: string,
  options?: RequestInit,
  timeoutMs: number = 10000
): Promise<Response> => {
  try {
    const response = await fetchWithTimeout(url, timeoutMs, options);

    // Check for HTTP errors
    if (!response.ok) {
      const responseText = await response.text().catch(() => '');
      throw mapHttpError(response.status, responseText);
    }

    return response;
  } catch (error) {
    handleFetchError(error);
  }
};

/**
 * Fetches JSON with timeout and error handling
 * @param url URL to fetch
 * @param options Fetch options
 * @param timeoutMs Timeout in milliseconds (default: 10000)
 * @returns Promise resolving to parsed JSON
 */
export const fetchJson = async <T = any>(
  url: string,
  options?: RequestInit,
  timeoutMs: number = 10000
): Promise<T> => {
  const response = await fetchWithErrorHandling(url, options, timeoutMs);

  try {
    return await response.json();
  } catch (error) {
    logger.error('Failed to parse JSON response:', error);
    throw new ApiError(
      'Invalid JSON response',
      response.status,
      'Received invalid data from server. Please try again.'
    );
  }
};
