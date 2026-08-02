const token = (process.env.EXPO_PUBLIC_WEATHER_APP_TOKEN ?? "").trim();

/**
 * Sent on every request to the weather proxy. Whitespace-only is treated as
 * unset, mirroring getAppTokenConfig() on the proxy side, so a stray trailing
 * space in .env cannot land in the token_bad counter — that counter is how we
 * decide when enforcement is safe, and it must mean "wrong token", not
 * "our own misconfiguration".
 */
export const APP_TOKEN_HEADERS: Record<string, string> = token
  ? { "x-app-token": token }
  : {};
