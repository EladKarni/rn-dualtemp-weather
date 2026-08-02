/**
 * Review-mandated test #9 — httpClient error mapping.
 *
 * Covers `mapHttpError` (status -> AppError) and `handleFetchError`
 * (thrown-value -> AppError), the latter being the geocoding re-throw path this
 * branch changed: AbortError -> TimeoutError, TypeError -> NetworkError.
 *
 * Contract note (post Phase-1 Worker A): `BadRequestError.userMessage` is always
 * the generic string; server-supplied text only lives in the internal
 * `message`. `mapHttpError(400, 'Invalid search query')` therefore yields a
 * BadRequestError whose userMessage is generic — asserted below.
 *
 * `mapHttpError` builds PLAIN `ApiError`s (not the specialized RateLimitError /
 * AuthenticationError / NotFoundError subclasses) for 401/404/429 — only 400 and
 * 5xx use dedicated subclasses. These tests pin the httpClient contract as
 * written, distinct from fetchWeather's own richer mapping.
 */
import {
  mapHttpError,
  handleFetchError,
} from '../httpClient';
import {
  ApiError,
  AppError,
  BadRequestError,
  NetworkError,
  NoConnectionError,
  ServerError,
  TimeoutError,
} from '../errors';

jest.mock('../logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    exception: jest.fn(),
  },
}));

describe('mapHttpError', () => {
  it('400 -> BadRequestError with GENERIC userMessage, server text internal only', () => {
    const err = mapHttpError(400, 'Invalid search query');
    expect(err).toBeInstanceOf(BadRequestError);
    // Post-Worker-A contract: userMessage never carries server text.
    expect(err.userMessage).toBe(
      'Invalid request. Please check your input and try again.'
    );
    expect(err.userMessage).not.toContain('Invalid search query');
    // ...but the server text is preserved internally for logs/Sentry.
    expect(err.message).toContain('Invalid search query');
    expect(err.statusCode).toBe(400);
    // BadRequestError defaults to non-recoverable.
    expect(err.recoverable).toBe(false);
  });

  it('400 with no responseText still maps to a BadRequestError', () => {
    const err = mapHttpError(400);
    expect(err).toBeInstanceOf(BadRequestError);
    expect(err.userMessage).toBe(
      'Invalid request. Please check your input and try again.'
    );
  });

  it('401 -> plain ApiError (not AuthenticationError) with 401 status', () => {
    const err = mapHttpError(401);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).not.toBeInstanceOf(ServerError);
    expect(err.statusCode).toBe(401);
    expect(err.userMessage).toBe(
      'Authentication failed. Please try again later.'
    );
    expect(err.recoverable).toBe(false); // ApiError: recoverable only for >=500
  });

  it('404 -> plain ApiError with 404 status', () => {
    const err = mapHttpError(404);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(404);
    expect(err.userMessage).toBe('The requested resource was not found.');
    expect(err.recoverable).toBe(false);
  });

  it('429 -> plain ApiError with 429 status', () => {
    const err = mapHttpError(429);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(429);
    expect(err.userMessage).toContain('Too many requests');
    expect(err.recoverable).toBe(false);
  });

  it.each([500, 502, 503, 599])('%p -> ServerError (recoverable)', (status) => {
    const err = mapHttpError(status);
    expect(err).toBeInstanceOf(ServerError);
    expect(err.statusCode).toBe(status);
    expect(err.recoverable).toBe(true);
  });

  it('generic 4xx (e.g. 418) -> plain ApiError client-error message', () => {
    const err = mapHttpError(418);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(418);
    expect(err.message).toContain('418');
    expect(err.userMessage).toBe(
      'There was a problem with your request. Please try again.'
    );
  });

  it('unexpected status (e.g. 302) -> generic ApiError', () => {
    const err = mapHttpError(302);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(302);
    expect(err.message).toContain('Unexpected status');
  });
});

describe('handleFetchError', () => {
  it('always throws (never returns)', () => {
    expect(() => handleFetchError(new Error('x'))).toThrow();
  });

  it('AbortError -> TimeoutError', () => {
    const abort = Object.assign(new Error('Aborted'), { name: 'AbortError' });
    expect(() => handleFetchError(abort)).toThrow(TimeoutError);
  });

  it('TypeError -> NetworkError (the offline/geocoding re-throw path)', () => {
    let thrown: unknown;
    try {
      handleFetchError(new TypeError('Failed to fetch'));
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(NetworkError);
    // handleFetchError constructs a base NetworkError, not the NoConnection
    // subclass, so pin the exact shape.
    expect(thrown).not.toBeInstanceOf(NoConnectionError);
    expect((thrown as NetworkError).code).toBe('NETWORK_ERROR');
  });

  it('re-throws an existing ApiError instance unchanged', () => {
    const original = new BadRequestError('boom', true);
    let thrown: unknown;
    try {
      handleFetchError(original);
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBe(original);
  });

  it('converts an unknown Error via toAppError (UNKNOWN_ERROR)', () => {
    let thrown: unknown;
    try {
      handleFetchError(new Error('something weird'));
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(AppError);
    expect((thrown as AppError).code).toBe('UNKNOWN_ERROR');
  });

  it('maps a network-substring Error to NoConnectionError via toAppError', () => {
    let thrown: unknown;
    try {
      handleFetchError(new Error('Network request failed'));
    } catch (e) {
      thrown = e;
    }
    // This is an Error (not TypeError), so it falls through to toAppError, which
    // matches the RN offline message and yields NoConnectionError.
    expect(thrown).toBeInstanceOf(NoConnectionError);
  });
});
