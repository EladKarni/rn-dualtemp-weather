# Plan: API Rate Limiting & Security Enhancement

## Overview
Implement client-side rate limiting and request throttling for the geocoding search API to prevent abuse and improve reliability.

## Priority
**Critical** - API endpoint exposed without visible protection beyond 300ms debounce

## Current State Analysis

### Existing Protection
- **Debounce**: 300ms delay in [AddLocationScreen.tsx:86](src/screens/AddLocationScreen.tsx#L86)
- **Minimum query length**: 3 characters ([geocoding.ts:13](src/utils/geocoding.ts#L13))
- **Result limit**: 5 results per query ([geocoding.ts:19](src/utils/geocoding.ts#L19))

### Vulnerabilities
- **Rapid sequential searches**: User can trigger many searches by quickly typing/deleting
- **No per-session limits**: Unlimited searches in single session
- **No exponential backoff**: Failed requests retry immediately
- **No caching**: Same query searched multiple times hits API each time

## Solution Architecture

### 1. Multi-Layer Rate Limiting

#### Layer 1: In-Memory Query Cache
- Cache search results for 5 minutes
- Prevents duplicate API calls for same query
- Use Map with automatic cleanup

#### Layer 2: Token Bucket Algorithm
- 10 requests per minute allowed
- Bucket refills at 1 token per 6 seconds
- Visual feedback when rate limited

#### Layer 3: Exponential Backoff
- Retry failed requests with increasing delays
- Max 3 retries with 1s, 2s, 4s delays
- Circuit breaker after consecutive failures

#### Layer 4: Request Deduplication
- Cancel in-flight requests when new search starts
- Use AbortController for fetch cancellation

## Implementation Plan

### Step 1: Create Rate Limiter Utility

**File**: `src/utils/rateLimiter.ts`

```typescript
interface RateLimiterConfig {
  maxRequests: number;    // Max requests per window
  windowMs: number;       // Time window in ms
  strategy: 'token-bucket' | 'sliding-window';
}

class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private queue: Array<() => void>;

  constructor(config: RateLimiterConfig);

  async acquire(): Promise<void>;
  canProceed(): boolean;
  getWaitTime(): number;
  reset(): void;
}
```

**Features**:
- Token bucket implementation (10 tokens, refill rate: 1/6s)
- Queue excess requests instead of rejecting
- Return wait time for UI feedback
- Reset method for testing/debugging

**Test Cases**:
- ✓ Should allow requests within limit
- ✓ Should throttle requests exceeding limit
- ✓ Should refill tokens over time
- ✓ Should queue requests and process in order
- ✓ Should calculate correct wait time

### Step 2: Create Search Cache Utility

**File**: `src/utils/searchCache.ts`

```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class SearchCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private maxSize: number;
  private ttlMs: number;

  constructor(maxSize: number, ttlMs: number);

  get(key: string): T | null;
  set(key: string, value: T): void;
  clear(): void;
  size(): number;

  private cleanup(): void;  // Remove expired entries
  private evictOldest(): void;  // LRU eviction when full
}
```

**Configuration**:
- Max cache size: 50 entries
- TTL: 5 minutes (300,000ms)
- LRU eviction policy

**Test Cases**:
- ✓ Should cache and retrieve values
- ✓ Should expire entries after TTL
- ✓ Should evict oldest when max size reached
- ✓ Should handle cache misses
- ✓ Should normalize keys (lowercase, trim)

### Step 3: Create Retry Logic Utility

**File**: `src/utils/retryWithBackoff.ts`

```typescript
interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  shouldRetry: (error: Error) => boolean;
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig
): Promise<T>;
```

**Exponential Backoff Strategy**:
- Retry 1: 1000ms delay
- Retry 2: 2000ms delay
- Retry 3: 4000ms delay
- Give up after 3 failed attempts

**Retryable Errors**:
- Network errors (fetch failed)
- 429 (Too Many Requests)
- 500, 502, 503, 504 (Server errors)

**Non-Retryable**:
- 400 (Bad Request)
- 401 (Unauthorized)
- 404 (Not Found)

### Step 4: Enhance Geocoding Utility

**File**: `src/utils/geocoding.ts` (modifications)

```typescript
// Add at top
const searchCache = new SearchCache<CityResult[]>(50, 300000);
const rateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60000,
  strategy: 'token-bucket'
});

let abortController: AbortController | null = null;

export const searchCities = async (
  query: string
): Promise<CityResult[]> => {
  if (!query || query.trim().length < 3) {
    return [];
  }

  const normalizedQuery = query.trim().toLowerCase();

  // Check cache first
  const cached = searchCache.get(normalizedQuery);
  if (cached) {
    return cached;
  }

  // Cancel previous request
  if (abortController) {
    abortController.abort();
  }
  abortController = new AbortController();

  // Check rate limit
  if (!rateLimiter.canProceed()) {
    const waitTime = rateLimiter.getWaitTime();
    throw new RateLimitError(`Please wait ${Math.ceil(waitTime / 1000)}s`);
  }

  await rateLimiter.acquire();

  try {
    const results = await retryWithBackoff(
      () => fetchSearchResults(normalizedQuery, abortController!.signal),
      {
        maxRetries: 3,
        baseDelayMs: 1000,
        maxDelayMs: 4000,
        shouldRetry: isRetryableError
      }
    );

    // Cache results
    searchCache.set(normalizedQuery, results);

    return results;
  } catch (error) {
    if (error.name === 'AbortError') {
      // Request was cancelled, don't throw
      return [];
    }
    throw error;
  }
};

// Helper function
async function fetchSearchResults(
  query: string,
  signal: AbortSignal
): Promise<CityResult[]> {
  const response = await fetch(
    `${base_url}search-cities?q=${encodeURIComponent(query)}&limit=5`,
    { signal }
  );

  if (!response.ok) {
    throw new ApiError(`Search failed: ${response.status}`, response.status);
  }

  return response.json();
}

function isRetryableError(error: Error): boolean {
  if (error instanceof ApiError) {
    return [429, 500, 502, 503, 504].includes(error.statusCode);
  }
  return error.name === 'TypeError'; // Network errors
}

// Custom error classes
class ApiError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = 'ApiError';
  }
}

class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}
```

### Step 5: Update AddLocationScreen UI

**File**: `src/screens/AddLocationScreen.tsx` (modifications)

Add state for rate limit feedback:
```typescript
const [isRateLimited, setIsRateLimited] = useState(false);
const [rateLimitWaitTime, setRateLimitWaitTime] = useState(0);
```

Update search effect:
```typescript
searchTimeoutRef.current = setTimeout(async () => {
  try {
    setIsSearching(true);
    setError(null);
    setIsRateLimited(false);

    const results = await searchCities(searchQuery);
    setSearchResults(results);

    if (results.length === 0) {
      setError(i18n.t("NoResults"));
    }
  } catch (err) {
    console.error("Search error:", err);

    if (err instanceof RateLimitError) {
      setIsRateLimited(true);
      setRateLimitWaitTime(extractWaitTime(err.message));
      setError(err.message);
    } else {
      setError(i18n.t("SearchError"));
    }

    setSearchResults([]);
  } finally {
    setIsSearching(false);
  }
}, 300);
```

Add visual feedback:
```typescript
{isRateLimited && (
  <View style={styles.rateLimitBanner}>
    <Text style={styles.rateLimitText}>
      ⏱️ {i18n.t("RateLimited")}
    </Text>
    <Text style={styles.rateLimitSubtext}>
      {i18n.t("TooManyRequests", { seconds: rateLimitWaitTime })}
    </Text>
  </View>
)}
```

### Step 6: Add Localization Strings

**Files**: `src/localization/*.ts` (all languages)

Add to all translation files:
```typescript
RateLimited: "Rate limit reached",
TooManyRequests: "Please wait {{seconds}} seconds before searching again",
SearchCancelled: "Search cancelled",
```

### Step 7: Add Monitoring & Telemetry (Optional)

**File**: `src/utils/apiTelemetry.ts`

```typescript
interface ApiMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  rateLimitedRequests: number;
  cacheHits: number;
  cacheMisses: number;
  averageResponseTime: number;
}

class ApiTelemetry {
  private metrics: ApiMetrics;

  recordRequest(success: boolean, fromCache: boolean, durationMs: number): void;
  recordRateLimit(): void;
  getMetrics(): ApiMetrics;
  reset(): void;
}

export const telemetry = new ApiTelemetry();
```

Log metrics periodically to console (dev mode only).

## Testing Strategy

### Unit Tests

**`src/utils/__tests__/rateLimiter.test.ts`**
- Token bucket behavior
- Rate limit enforcement
- Token refill timing
- Queue management

**`src/utils/__tests__/searchCache.test.ts`**
- Cache hit/miss
- TTL expiration
- LRU eviction
- Key normalization

**`src/utils/__tests__/retryWithBackoff.test.ts`**
- Exponential backoff delays
- Max retry limit
- Retryable vs non-retryable errors
- Circuit breaker behavior

### Integration Tests

**`src/utils/__tests__/geocoding.integration.test.ts`**
- End-to-end flow with all layers
- Cache then rate limit then retry
- Abort controller cancellation
- Error propagation

### Manual Testing

- [ ] Type rapidly - should rate limit after 10 searches
- [ ] Search same query twice - should hit cache (instant result)
- [ ] Trigger API error - should retry with backoff
- [ ] Start search, immediately change query - should cancel previous
- [ ] Wait 1 minute - rate limit should reset

## Performance Impact

### Before
- **API calls**: N (every unique query)
- **Latency**: ~200-500ms per search
- **Cost**: High (no caching)
- **Reliability**: Low (no retries)

### After
- **API calls**: Reduced by ~60% (cache hit rate)
- **Latency**: <10ms for cached, ~300-700ms for uncached (with retry)
- **Cost**: Low (cache + rate limit)
- **Reliability**: High (exponential backoff)

## Configuration Options

Expose via environment/config:
```typescript
export const API_CONFIG = {
  RATE_LIMIT_MAX_REQUESTS: 10,
  RATE_LIMIT_WINDOW_MS: 60000,
  CACHE_TTL_MS: 300000,
  CACHE_MAX_SIZE: 50,
  RETRY_MAX_ATTEMPTS: 3,
  RETRY_BASE_DELAY_MS: 1000,
  SEARCH_DEBOUNCE_MS: 300,
  MIN_QUERY_LENGTH: 3,
};
```

## Rollout Plan

### Phase 1: Core Infrastructure (Day 1)
- Implement RateLimiter, SearchCache, retryWithBackoff
- Add unit tests
- No UI changes yet

### Phase 2: Integration (Day 2)
- Update geocoding.ts with all layers
- Add error types
- Integration tests

### Phase 3: UI Feedback (Day 3)
- Update AddLocationScreen with visual feedback
- Add translations
- Manual testing

### Phase 4: Monitoring (Day 4 - Optional)
- Add telemetry
- Log metrics in dev mode
- Performance profiling

## Success Criteria

- [ ] Cache hit rate > 40% in typical usage
- [ ] Rate limit prevents > 10 requests/min
- [ ] Failed requests retry with exponential backoff
- [ ] Duplicate searches don't hit API
- [ ] User sees clear feedback when rate limited
- [ ] All tests passing
- [ ] No performance degradation

## Estimated Effort
**2-3 days** (6-8 hours coding, 2-3 hours testing)

## Files to Create/Modify

**New Files**:
- `src/utils/rateLimiter.ts`
- `src/utils/searchCache.ts`
- `src/utils/retryWithBackoff.ts`
- `src/utils/apiTelemetry.ts` (optional)
- `src/utils/__tests__/rateLimiter.test.ts`
- `src/utils/__tests__/searchCache.test.ts`
- `src/utils/__tests__/retryWithBackoff.test.ts`
- `src/utils/__tests__/geocoding.integration.test.ts`

**Modified Files**:
- `src/utils/geocoding.ts`
- `src/screens/AddLocationScreen.tsx`
- `src/screens/AddLocationScreen.Styles.ts`
- `src/localization/en.ts` (and all other language files)

## Dependencies
- None - uses built-in JavaScript features
- Optional: Add `exponential-backoff` npm package (or implement manually)

## Backward Compatibility
- Fully backward compatible
- Graceful degradation if APIs fail
- No breaking changes to function signatures

## Alternative Approaches Considered

### 1. Server-Side Rate Limiting Only
- **Pros**: Centralized control, harder to bypass
- **Cons**: Requires backend changes, higher latency, poor UX (hard errors)
- **Decision**: Client-side is better for UX, can complement server-side

### 2. React Query Built-in Features
- **Pros**: Already using React Query
- **Cons**: Doesn't handle rate limiting, limited retry config
- **Decision**: Use both - React Query for caching, custom for rate limiting

### 3. Third-Party Libraries (bottleneck, async-sema)
- **Pros**: Battle-tested implementations
- **Cons**: Additional dependencies, potential over-engineering
- **Decision**: Implement manually for simplicity and control
