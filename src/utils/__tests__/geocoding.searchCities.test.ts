/**
 * searchCities shape-guard test (tier-2) + baseline behavior.
 *
 * Guard decision (plan §5 Worker H item 2): a non-array JSON body is treated as
 * an INVALID RESPONSE and surfaced as a recoverable `ApiError` — NOT silently
 * coerced to `[]`. Justification:
 *   - A non-array body is a proxy/server fault, never a legitimate "no results"
 *     set. Returning `[]` would render the misleading "No locations found" empty
 *     state and hide a real regression; throwing surfaces it honestly.
 *   - The AddLocationScreen caller handles the throw gracefully: it catches,
 *     runs `toAppError`, and shows a dismissible error banner whose Retry button
 *     is gated on `error.recoverable` — so a recoverable ApiError gives the user
 *     an actionable retry rather than a dead-end empty list.
 *   - It mirrors Worker A's 200-but-wrong-shape decision in fetchWeather: a
 *     malformed 2xx body is never accepted as truth.
 *
 * Uses distinct query strings per case to avoid the module-level 10-minute
 * search cache producing cross-test hits.
 */
import { searchCities } from '../geocoding';
import {
  ApiError,
  BadRequestError,
  ServerError,
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

type FetchResult = {
  ok: boolean;
  status: number;
  body: unknown;
};

const mockFetchOnce = ({ ok, status, body }: FetchResult) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status,
    json: jest.fn().mockResolvedValue(body),
  }) as unknown as typeof fetch;
};

const catchErr = async (query: string): Promise<any> => {
  try {
    await searchCities(query);
    return null;
  } catch (e) {
    return e;
  }
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('searchCities — short query short-circuit', () => {
  it('returns [] without hitting the network for < 3 chars', async () => {
    global.fetch = jest.fn();
    expect(await searchCities('ab')).toEqual([]);
    expect(await searchCities('')).toEqual([]);
    expect(await searchCities('   ')).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('searchCities — valid array response', () => {
  it('returns the parsed city array', async () => {
    const cities = [
      { name: 'London', lat: 51.5, lon: -0.12, country: 'GB' },
      { name: 'London', lat: 42.98, lon: -81.24, country: 'CA' },
    ];
    mockFetchOnce({ ok: true, status: 200, body: cities });
    const results = await searchCities('london');
    expect(results).toEqual(cities);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('accepts an empty array as a legitimate "no results" set', async () => {
    mockFetchOnce({ ok: true, status: 200, body: [] });
    expect(await searchCities('zzzville')).toEqual([]);
  });
});

describe('searchCities — non-array shape guard', () => {
  it('throws a recoverable invalid-response ApiError for an object body', async () => {
    mockFetchOnce({ ok: true, status: 200, body: { error: 'unexpected' } });
    const err = await catchErr('paris');
    expect(err).toBeInstanceOf(ApiError);
    expect(err.recoverable).toBe(true);
    // Generic, user-safe message — no server internals leaked.
    expect(err.userMessage).toBe('Received invalid data from server. Please try again.');
  });

  it('throws for a null body', async () => {
    mockFetchOnce({ ok: true, status: 200, body: null });
    const err = await catchErr('berlin');
    expect(err).toBeInstanceOf(ApiError);
    expect(err.recoverable).toBe(true);
  });

  it('throws for a string body (HTML-error-page style)', async () => {
    mockFetchOnce({ ok: true, status: 200, body: 'Cannot GET /search-cities' });
    const err = await catchErr('madrid');
    expect(err).toBeInstanceOf(ApiError);
    expect(err.recoverable).toBe(true);
  });
});

describe('searchCities — HTTP error mapping (via mapHttpError/handleFetchError)', () => {
  it('maps a 400 to a BadRequestError with a generic userMessage', async () => {
    mockFetchOnce({ ok: false, status: 400, body: {} });
    const err = await catchErr('tokyo');
    expect(err).toBeInstanceOf(BadRequestError);
    expect(err.userMessage).toBe(
      'Invalid request. Please check your input and try again.'
    );
  });

  it('maps a 500 to a ServerError (recoverable)', async () => {
    mockFetchOnce({ ok: false, status: 500, body: {} });
    const err = await catchErr('osaka');
    expect(err).toBeInstanceOf(ServerError);
    expect(err.recoverable).toBe(true);
  });
});
