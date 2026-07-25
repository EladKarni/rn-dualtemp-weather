# Green-Gate Result — `fix/env-weather-url-and-geocoding-throw`

**Executed:** 2026-07-16/17, per `plans/green-gate-plan.md` (Rev 2).
**Orchestration:** Fable 5 orchestrator; 13 Opus 4.8 workers + 11 Opus 4.8 adversarial verifiers (one per workstream, §2.4 protocol; 3 workstreams needed one fix round each, all re-verified CONFIRMED-GOOD).
**Outcome:** all four phases complete, every workstream CONFIRMED-GOOD, `yarn gate` green on the final tree, **22 local commits, nothing pushed**.

---

## 1 · The 42-finding disposition table

Finding numbers: 1–15 = tier-1 (review-confirmed), 16–42 = tier-2 (verified this pass). "Test that guards it" names the suite that would fail on regression.

| # | Finding (abridged) | Disposition | Commit(s) | Test that guards it |
|---|---|---|---|---|
| 1 | S2 privacy incomplete: GPS coords reach Sentry via fetch/XHR breadcrumbs + event values | **Fixed** — beforeBreadcrumb + recursive beforeSend scrubber; body_preview sanitized at source | `723b7b3`, `9eade47` | `sentryScrubbing.test.ts` (review's exact leak vectors), `fetchWeather.test.ts` |
| 2 | OpenWeather attribution removed while serving OpenWeather data | **Fixed per owner decision D1** — data source changed; ALL OpenWeather references stripped, no replacement credit | `2229f62` | `i18nParity.test.ts` (key sets); grep-verified zero product references |
| 3 | New Sentry reporting misfires ×4 (double reports, offline noise, sticky tag, render-body log) | **Fixed** — single-report policy; NoConnectionError never reported; per-event flow tags; render log in effect | `9eade47` (3a), `b986f8f` (3b/3d), `723b7b3` (3c) | `fetchWeather.test.ts` (offline zero / timeout exactly-one), `widgetTaskHandler.test.tsx` |
| 4 | Stale weather never recovers: coords not in query key, no resume refetch | **Fixed** — rounded coords in active+prefetch keys (D9 accepted); focusManager wired to AppState | `4a5347d`, `b8e23c8` | `useMultiLocationWeather.queryKey.test.ts`, `useAppLifecycle.test.ts` |
| 5 | Widget headless task races store rehydration (false no-location alarms) | **Fixed** — `ensureStoresHydrated()` awaits all three persisted stores before any read | `b986f8f` | `widgetUpdater.test.tsx`, `widgetTaskHandler.test.tsx` (order-asserted) |
| 6 | fetchForecast network path: no timeout; RN offline TypeError unmatched | **Fixed** — fetchWithTimeout(10s)→TimeoutError; toAppError matches RN's real offline errors. The `isInternetReachable` pre-flight guard is retained by design (it produces the silent NoConnectionError path); mid-flight drops report once as anomalies | `9eade47` | `fetchWeather.test.ts` (timeout), `errors.test.ts` (toAppError table) |
| 7 | base_url hardening incomplete: no normalization, no shape validation | **Fixed** — exported normalizer (trim/unset/trailing-slash); minimal Weather shape guard before any persist | `9eade47` | `fetchWeather.test.ts` (normalizer table, wrong-shape) |
| 8 | Raw server text shown to users; retryable 4xx marked unrecoverable | **Fixed** — server text internal-only; recoverable param; weather 404/400 keep Retry | `9eade47` | `fetchWeather.test.ts`, `errors.test.ts` |
| 9 | Location switch shows previous location's weather | **Fixed** — `{locationId, weather}` cache + selector guard + cancelled flag; kill-condition empirically verified | `4a5347d`, `b8e23c8` | `useMultiLocationWeather.race.test.tsx` (both orderings) |
| 10 | Proxy unauthenticated, wildcard CORS (denial-of-wallet) | **Spec delivered, human deploys (D4)** — rate limit / CORS allowlist / optional app token / alerting, fail-open verified | `0040587`, `540aa8a` | n/a (document); client 429 behavior cross-checked against code |
| 11 | CardFooter violates Rules of Hooks (crash on hydration flip) | **Fixed** — hooks above early return (Phase 0); regression tests + `rules-of-hooks=error` guards the class | `730eb37`, `4d1aaf2` | `CardFooter.test.tsx` (hydration flip); eslint gate |
| 12 | Widget layer English-only; iOS widget hardcodes 24h clock | **Fixed** — widget chrome i18n ×6, day labels via hydrated moment locale, formatDataAge localized, all three time paths honor clockFormat. *Residue (ruled in-spec-out):* `WeatherStandard` "Tap to refresh" footer + root-boundary copy intentionally English | `b5cd4fa` | `widgetDataUtils.formatDataAge.test.ts` (zh assertion), `widgetTaskHandler.test.tsx` |
| 13 | Zero persistence versioning across stores/persister | **Mitigated, versioning deferred** — every shape this pass changed is rehydration-tolerant (`useSettingsStore.merge` coerces legacy values; query-key change = one-time D9 invalidation; no SQLite DROPs). A formal zustand `version`/migrate scheme was not in plan scope | `4d1aaf2` | `useWeatherLoadingState.test.tsx` / store tests (legacy-value tolerance) |
| 14 | useScrollPositionReset snaps hourly forecast to 0 on every refresh | **Won't-fix this pass** — UX nit, not merge-blocking; no plan workstream covered it. Candidate follow-up | — | — |
| 15 | Version string hardcoded in AppFooter (third copy) | **Fixed** — reads `Constants.expoConfig?.version ?? '2.1.0'` (D8: version stays 2.1.0) | `751c03c` | tsc/gate (typed import) |
| 16 | Over-privileged ACCESS_BACKGROUND_LOCATION (Play policy risk) | **Fixed (D7)** — permission removed, `isAndroidBackgroundLocationEnabled:false`, when-in-use string only | `4643d79` | `appConfig.test.ts` (static + effective config, both profiles) |
| 17 | Error banner permanently disabled after one dismissal; dead lastUpdated | **Fixed** — dismissal keyed to error identity, resets on change/clear; lastUpdated ISO end-to-end | `4d1aaf2`, `4a5347d` | `useWeatherLoadingState.test.tsx` |
| 18 | Two SkeletonScreens mounted simultaneously | **Fixed** — single `screenState` with explicit precedence; five boolean guards → one switch | `4d1aaf2`, `e6cb33d` | `useRenderDecision.test.ts` (matrix + precedence edges) |
| 19 | Deleting active location dangles activeLocationId (endless skeleton) | **Fixed** — GPS-if-exists → first-remaining → null; addLocation self-heals | `4d1aaf2` | `useLocationStore.test.ts` (fallback matrix) |
| 20 | Main-app error/loading surfaces hardcoded English | **Fixed** — userMessageKey across the full taxonomy; ErrorScreen/LoadingScreen/banner localized ×6 | `b5cd4fa` | `errors.taxonomyKeys.test.ts`, `i18nParity.test.ts` |
| 21 | Selector-less useForecastStore() re-renders whole tree | **Fixed** — getState() in effects/queryFns; no reactive read was load-bearing | `4a5347d` | verifier-audited; race/queryKey suites exercise the paths |
| 22 | addLocation silently drops duplicates; modal closes as if success | **Fixed** — typed DuplicateLocationError, rendered feedback, modal stays open | `4d1aaf2` | `useLocationStore.test.ts`, `errors.userMessageKey.test.ts` |
| 23 | MaxLocationsReached translation discarded (English "unexpected error") | **Fixed** — MaxLocationsError with userMessageKey; copy corrected 5→%{count}=25 | `4d1aaf2`, `b5cd4fa` | `useLocationStore.test.ts` |
| 24 | Geocoding trusts response shape (unvalidated cast) | **Fixed** — Array.isArray guard; non-array 200 throws recoverable invalid-response ApiError | `14c38ab` | `geocoding.searchCities.test.ts` |
| 25 | City search hardcodes lang=en in auto-detect | **Fixed** — passes resolved `i18n.locale` | `b5cd4fa` | verifier-audited call site |
| 26 | TypeScript strict entirely off | **Fixed beyond floor** — `strict: true` enabled repo-wide (18 errors, all fixed; none deferred); gate runs tsc on every commit/CI | `730eb37`, `6635436` | the gate itself |
| 27 | Inline AppStateContext value re-renders temperature/chart tree | **Won't-fix this pass** — perf nit; no plan workstream covered memoizing the provider value. Candidate follow-up | — | — |
| 28 | All 25 locations fetched eagerly on cold start / language change | **Won't-fix (by design)** — prefetch warms the offline/widget cache; plan kept the behavior, coords-in-key (D9) bounds staleness. Revisit only if quota pressure appears | — | — |
| 29 | Language switching throws on web (native-only getLanguage) | **Fixed twice** — Phase-2 guard (`4643d79`), then superseded by expo-localization which works on web (`d296fcf`) | `4643d79`, `d296fcf` | gate (strict imports); language-store paths exercised in suites |
| 30 | Search debounce cancels timer but not in-flight requests | **Won't-fix this pass** — low-severity out-of-order race behind a debounce; no workstream covered it. Candidate follow-up (AbortController in searchCities) | — | — |
| 31 | ErrorBoundary fallbacks surface raw internal Error.message | **Partially addressed** — ErrorScreen chrome localized; root ErrorFallback copy is static by design. The `error?.message` pass-through from ErrorBoundary→ErrorScreen remains (pre-existing). Follow-up row | `b5cd4fa` (chrome) | — |
| 32 | locationLoadingStates + callbacks rebuilt every render (React.memo defeated) | **Fixed** — useQueries `combine` (structurally shared) + useCallback/useMemo; LocationPill memo verified to hold | `4a5347d` | verifier-audited; queryKey suite |
| 33 | Forecast bytes persisted twice (RQ dehydration + SQLite) | **Won't-fix (by design)** — deliberate dual cache: RQ persister for instant paint, SQLite for widgets/offline. Persist config now centralized in `src/config/queryClient.ts` for future tuning | `dd45dee` (centralized) | — |
| 34 | Every weather save re-renders all 3 widget types; icon map rebuilt per render | **Partially fixed** — icon map hoisted to module scope (single source); full-widget refresh on save retained by design (widgets must reflect new data) | `8c6ff96` | `widgetDataUtils.getWeatherIcon.test.ts` |
| 35 | .gitignore env hardening incomplete | **Fixed** — `.env`, `.env.*`, `!.env.example`; no tracked env file | `4643d79` | verifier-audited (`git check-ignore`) |
| 36 | eas.json preview environment may drop EXPO_PUBLIC_* vars | **Fixed (preview)** — URL pinned in preview env; **production is a human follow-up** (EAS dashboard parity, §5) | `4643d79` | — |
| 37 | Error surfaces zero RTL; rtlStyleHelper dead code | **Fixed** — WeatherErrorBanner manually mirrored (same pattern as the other 13); rtlStyleHelper + dead RTL exports deleted | `b5cd4fa`, `89a478c` | verifier-audited pattern match |
| 38 | WeatherTypes.ts overstates OneCall contract (minutely/wind_gust required) | **Won't-fix this pass** — D1 keeps WeatherTypes shape; runtime shape guard (finding 7) protects the load-bearing fields; retyping is churn without a consumer | — | `fetchWeather.test.ts` (shape guard) |
| 39 | Ten dead exports incl. orphaned ErrorBanner component | **Fixed** — files + export clusters deleted (−834 LOC, zero-reference-verified). `getCityCoordinates` dead-but-kept (out of deletion spec; flagged) | `89a478c` | gate green post-deletion; `useForecastStore.database.test.ts` (weather_errors kill-condition) |
| 40 | AppFooter cleanup left dead imports/styles/orphaned logo | **Fixed** | `2229f62` | verifier-audited |
| 41 | 15 of 57 i18n keys unreferenced (~90 dead strings) | **Fixed** — 11 dead keys deleted ×6 post-K recompute (string-literal protocol; Sunrise/Sunset spared — dynamic `i18n.t(capitalize(type))`; userMessageKey-referenced keys spared) | `89a478c` | `i18nParity.test.ts` (75 keys ×6 identical) |
| 42 | expo-linking unused; three overlapping localization libraries | **Fixed** — consolidated on expo-localization; 3 deps removed; dangling config plugin removed | `d296fcf` | gate (clean install path verified by verifier) |

### Verifier-discovered rows (§2.4.3 — pre-existing, did not block CONFIRMED-GOOD)

| # | Observation | Status |
|---|---|---|
| V1 | `website/.next/` build output is committed to the repo | Pre-existing; flag for cleanup |
| V2 | `api_message` Sentry extra carries raw server text at source | Spec-consistent (finding 6 routes it there); Worker B's recursive scrubber sanitizes it as backstop |
| V3 | Numeric coords under non-standard keys (e.g. `coord_lat`) would survive the scrubber | Spec-scoped; in practice the app only attaches 1-decimal coarsened coords (`coarsenCoord`) |
| V4 | Offline refresh with NO cache emits one `widget_refresh_no_data` event (level: warning) | Within spec — genuinely dataless display state |
| V5 | jest `transformIgnorePatterns` doesn't transform i18n-js (ESM) — tests must mock `localization/i18n` | Known; documented pattern used by all suites |
| V6 | `getCityCoordinates` (geocoding.ts) dead-but-kept | Conservative; candidate deletion |
| V7 | ~~Geoapify attribution not rendered anywhere while Geoapify still serves city search~~ | **Superseded 2026-07-17** — Geoapify is no longer in the stack; the proxy migrated to WeatherAPI.com (`search-cities`/`get-location` both call `api.weatherapi.com/v1/search.json`). Attribution question re-targets to WeatherAPI — see §5 item 10 (low priority) |
| V8 | `WeatherStandard` "Tap to refresh" live-widget footer still English | Ruled outside spec item 2's literal list; residue of finding 12 |
| V9 | ErrorBoundary passes raw `error?.message` into ErrorScreen | Same as finding 31 — follow-up |
| V10 | Removing react-native-localization-settings dropped the OS-level per-app-language declaration (Android 13+/iOS picker) | **Human follow-up** — re-declare via app.json `locales`/CFBundleLocalizations if wanted |
| V11 | Sentry plugin was registered twice (app.json + app.config.js append) | **Confirmed real and fixed** in `4643d79` |
| V12 | `httpClient.mapHttpError` returns plain ApiError for 401/404/429 (vs fetchWeather's richer subclasses) | Documented contract asymmetry, pinned by `httpClient.test.ts` |

**Execution notes:** two Worker I spawns failed instantly with garbled output (0 tool uses, tree verified untouched both times); the third attempt with a restructured prompt completed and was independently verified. Verification rounds needed: Worker E (race-test kill-condition), Worker M (fail-open sketch), Worker F (discretionary precedence-edge hardening) — each fixed in one round and re-verified CONFIRMED-GOOD. All other workstreams passed round 1.

---

## 2 · Final gate output

```
$ yarn gate            # tsc --noEmit (strict:true) && eslint . && jest --ci
tsc:    0 errors
eslint: 0 errors (40 pre-existing warnings, non-gating per D10)
Test Suites: 26 passed, 26 total
Tests:       262 passed, 262 total
Snapshots:   0 total
Done in 5.52s.        GATE EXIT: 0
```

Gate was green at every phase exit and re-run after every verifier-driven fix round. CI (`.github/workflows/ci.yml`) runs the identical gate on push/PR to `main` — it activates when you push.

---

## 3 · Commit list (22, oldest first — all local, nothing pushed)

| Commit | Summary |
|---|---|
| `730eb37` | chore: establish green gate (tsc excl. website, eslint expo flat config, jest-expo, CI workflow, CardFooter hooks order) |
| `9eade47` | fix(fetch): normalize base_url, timeout+shape validation, single Sentry report, keep Retry on 4xx (Worker A) |
| `723b7b3` | fix(privacy): complete S2 — scrub breadcrumb URLs and all event values (Worker B) |
| `b986f8f` | fix(widgets): three-store hydration gate; stop reporting expected offline; unstick tag (Worker C) |
| `2229f62` | chore(branding): remove all OpenWeather references (owner decision D1) (Worker D) |
| `4a5347d` | fix(data): refetch on GPS movement and app resume; kill stale-location race (Worker E) |
| `4d1aaf2` | fix(ui-state): mutually-exclusive render states, location-store edges, honest add feedback, ISO lastUpdated (Worker F) |
| `4643d79` | fix(config): drop background-location, guard web getLanguage, env gitignore, preview URL, dedupe Sentry plugin (Worker G) |
| `14c38ab` | test: independent suite — error mapping, formatters, i18n parity, geocoding guard, store/db coverage (Worker H) |
| `955bbb5` | chore(lint): restore @tanstack/query rules to error for useMultiLocationWeather |
| `b8e23c8` | fix(review): Worker E — addresses verifier round 1 (race-test kill condition, key builder, NaN guard) |
| `e6cb33d` | fix(review): Worker F — addresses verifier round 1 (precedence-edge tests) |
| `0040587` | docs: proxy hardening spec (rate-limit, CORS, optional app token) — for human deployment (Worker M) |
| `540aa8a` | fix(review): Worker M — addresses verifier round 1 (fail-open rate-limit sketch) |
| `8c6ff96` | refactor: SegmentedControl, single widget icon map, SkeletonBox; WeatherExtended twins merged (Worker J) |
| `b5cd4fa` | feat(i18n): localize error surfaces + widget chrome ×6; honor clock format (Worker K) |
| `89a478c` | chore: delete verified dead code (−834 LOC) (Worker I) |
| `dd45dee` | refactor(organization): style-file convention, domain moves, cycle break, index.js glue (Worker L 1/4) |
| `d296fcf` | chore(deps): consolidate on expo-localization; drop 3 unused deps (Worker L 2/4) |
| `6635436` | chore(ts): enable strict mode and fix all resulting errors (Worker L 3/4) |
| `751c03c` | docs(readme): rewrite setup/features/structure; version from expo-constants; plan statuses (Worker L 4/4) |
| `5c4a7bf` | chore(tests): correct stale comments in widgetUpdater cycle-break tests |

(+ this document's commit.)

---

## 4 · Translations-for-review (aggregate, D5 — agent-authored, human review required)

**Worker F — 1 new key** (`4d1aaf2`):

| Key | en | es | fr | ar | he | zh |
|---|---|---|---|---|---|---|
| DuplicateLocation | This location has already been added | Esta ubicación ya ha sido agregada | Cet emplacement a déjà été ajouté | تمت إضافة هذا الموقع بالفعل | מיקום זה כבר נוסף | 该地点已添加 |

**Worker K — 30 new keys + 1 modified** (`b5cd4fa`), order en · es · fr · ar · he · zh:

*Modified:* **MaxLocationsReached** — Maximum %{count} locations saved · Máximo %{count} ubicaciones guardadas · Maximum %{count} emplacements enregistrés · الحد الأقصى %{count} مواقع محفوظة · מקסימום %{count} מיקומים שמורים · 最多保存%{count}个地点

*Error taxonomy (14):*
- **ErrNetwork** — Unable to connect to the internet · No se puede conectar a internet · Impossible de se connecter à Internet · تعذّر الاتصال بالإنترنت · לא ניתן להתחבר לאינטרנט · 无法连接到互联网
- **ErrNoConnection** — No internet connection. Please check your network settings. · Sin conexión a internet. Comprueba la configuración de tu red. · Pas de connexion Internet. Vérifiez vos paramètres réseau. · لا يوجد اتصال بالإنترنت. يرجى التحقق من إعدادات الشبكة. · אין חיבור לאינטרנט. אנא בדוק את הגדרות הרשת. · 没有网络连接。请检查您的网络设置。
- **ErrTimeout** — The request took too long. Please try again. · La solicitud tardó demasiado. Inténtalo de nuevo. · La requête a pris trop de temps. Veuillez réessayer. · استغرق الطلب وقتًا طويلاً. يرجى المحاولة مرة أخرى. · הבקשה ארכה זמן רב מדי. אנא נסה שוב. · 请求超时。请重试。
- **ErrApiGeneric** — An error occurred while fetching data · Se produjo un error al obtener los datos · Une erreur s'est produite lors de la récupération des données · حدث خطأ أثناء جلب البيانات · אירעה שגיאה בעת אחזור הנתונים · 获取数据时出错
- **ErrRateLimit** — Too many requests. Please slow down and try again. · Demasiadas solicitudes. Reduce la velocidad e inténtalo de nuevo. · Trop de requêtes. Veuillez ralentir et réessayer. · طلبات كثيرة جدًا. يرجى التمهّل والمحاولة مرة أخرى. · יותר מדי בקשות. אנא האט ונסה שוב. · 请求过于频繁。请稍后再试。
- **ErrServer** — Our servers are experiencing issues. Please try again in a moment. · Nuestros servidores tienen problemas. Inténtalo de nuevo en un momento. · Nos serveurs rencontrent des problèmes. Veuillez réessayer dans un instant. · تواجه خوادمنا مشكلات. يرجى المحاولة مرة أخرى بعد قليل. · השרתים שלנו נתקלים בבעיות. אנא נסה שוב בעוד רגע. · 我们的服务器出现问题。请稍后重试。
- **ErrNotFound** — The requested data was not found. Please try again. · No se encontraron los datos solicitados. Inténtalo de nuevo. · Les données demandées sont introuvables. Veuillez réessayer. · تعذّر العثور على البيانات المطلوبة. يرجى المحاولة مرة أخرى. · הנתונים המבוקשים לא נמצאו. אנא נסה שוב. · 未找到请求的数据。请重试。
- **ErrBadRequest** — Invalid request. Please check your input and try again. · Solicitud no válida. Comprueba tus datos e inténtalo de nuevo. · Requête invalide. Veuillez vérifier votre saisie et réessayer. · طلب غير صالح. يرجى التحقق من إدخالك والمحاولة مرة أخرى. · בקשה לא תקינה. אנא בדוק את הקלט ונסה שוב. · 请求无效。请检查您的输入并重试。
- **ErrAuth** — Weather service is temporarily unavailable. Please try again later. · El servicio meteorológico no está disponible temporalmente. Inténtalo de nuevo más tarde. · Le service météo est temporairement indisponible. Veuillez réessayer plus tard. · خدمة الطقس غير متاحة مؤقتًا. يرجى المحاولة لاحقًا. · שירות מזג האוויר אינו זמין באופן זמני. אנא נסה שוב מאוחר יותר. · 天气服务暂时不可用。请稍后再试。
- **ErrPermissionDenied** — Location access is required. Please enable it in your device settings. · Se requiere acceso a la ubicación. Actívalo en la configuración de tu dispositivo. · L'accès à la localisation est requis. Activez-le dans les paramètres de votre appareil. · الوصول إلى الموقع مطلوب. يرجى تفعيله في إعدادات جهازك. · נדרשת גישה למיקום. אנא הפעל אותה בהגדרות המכשיר. · 需要位置访问权限。请在设备设置中启用。
- **ErrLocationUnavailable** — Unable to determine your location. Make sure GPS is enabled. · No se pudo determinar tu ubicación. Asegúrate de que el GPS esté activado. · Impossible de déterminer votre position. Assurez-vous que le GPS est activé. · تعذّر تحديد موقعك. تأكد من تفعيل نظام تحديد المواقع (GPS). · לא ניתן לקבוע את מיקומך. ודא שה-GPS מופעל. · 无法确定您的位置。请确保已启用 GPS。
- **ErrPositionTimeout** — Finding your location is taking too long. Please try again. · Encontrar tu ubicación está tardando demasiado. Inténtalo de nuevo. · La localisation prend trop de temps. Veuillez réessayer. · تحديد موقعك يستغرق وقتًا طويلاً. يرجى المحاولة مرة أخرى. · איתור מיקומך אורך זמן רב מדי. אנא נסה שוב. · 定位时间过长。请重试。
- **ErrUnexpected** — An unexpected error occurred. Please try again. · Ocurrió un error inesperado. Inténtalo de nuevo. · Une erreur inattendue s'est produite. Veuillez réessayer. · حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى. · אירעה שגיאה בלתי צפויה. אנא נסה שוב. · 发生意外错误。请重试。
- **ErrGeneric** — Something went wrong. Please try again. · Algo salió mal. Inténtalo de nuevo. · Une erreur s'est produite. Veuillez réessayer. · حدث خطأ ما. يرجى المحاولة مرة أخرى. · משהו השתבש. אנא נסה שוב. · 出了点问题。请重试。

*Error/loading screens (6):*
- **ErrorTitle** — Unable to Load Weather · No se pudo cargar el clima · Impossible de charger la météo · تعذّر تحميل الطقس · לא ניתן לטעון את מזג האוויר · 无法加载天气
- **ErrorDefaultMessage** — Unable to fetch weather data. Please check your connection and try again. · No se pudieron obtener los datos meteorológicos. Comprueba tu conexión e inténtalo de nuevo. · Impossible de récupérer les données météo. Vérifiez votre connexion et réessayez. · تعذّر جلب بيانات الطقس. يرجى التحقق من اتصالك والمحاولة مرة أخرى. · לא ניתן לאחזר את נתוני מזג האוויר. אנא בדוק את החיבור ונסה שוב. · 无法获取天气数据。请检查您的网络连接并重试。
- **ErrorSupport** — If this happens often, please contact support at · Si esto ocurre a menudo, contacta con soporte en · Si cela se produit souvent, contactez le support à · إذا تكرر هذا كثيرًا، يرجى التواصل مع الدعم على · אם זה קורה לעיתים קרובות, אנא פנה לתמיכה בכתובת · 如果经常发生这种情况，请联系支持：
- **BannerSupport** — If this happens often, contact %{email} for help. · Si esto ocurre a menudo, contacta con %{email} para obtener ayuda. · Si cela se produit souvent, contactez %{email} pour obtenir de l'aide. · إذا تكرر هذا كثيرًا، تواصل مع %{email} للحصول على المساعدة. · אם זה קורה לעיתים קרובות, פנה אל %{email} לעזרה. · 如果经常发生这种情况，请联系 %{email} 寻求帮助。
- **LoadingTitle** — Loading Weather... · Cargando el clima... · Chargement de la météo... · جارٍ تحميل الطقس... · טוען מזג אוויר... · 正在加载天气...
- **LoadingMessage** — Fetching forecast for %{location} · Obteniendo el pronóstico para %{location} · Récupération des prévisions pour %{location} · جارٍ جلب التوقعات لـ %{location} · מאחזר תחזית עבור %{location} · 正在获取 %{location} 的预报

*Widget chrome (10):*
- **WidgetUnavailable** — Weather data unavailable · Datos meteorológicos no disponibles · Données météo indisponibles · بيانات الطقس غير متاحة · נתוני מזג אוויר אינם זמינים · 天气数据不可用
- **WidgetTapToRetry** — Tap to retry · Toca para reintentar · Touchez pour réessayer · اضغط لإعادة المحاولة · הקש כדי לנסות שוב · 点按以重试
- **WidgetRefreshing** — Refreshing... · Actualizando... · Actualisation... · جارٍ التحديث... · מרענן... · 正在刷新...
- **WidgetLoadError** — Unable to load weather · No se pudo cargar el clima · Impossible de charger la météo · تعذّر تحميل الطقس · לא ניתן לטעון מזג אוויר · 无法加载天气
- **WidgetRefreshError** — Unable to refresh · No se pudo actualizar · Impossible d'actualiser · تعذّر التحديث · לא ניתן לרענן · 无法刷新
- **WidgetHi** — Hi · Máx · Max · عظمى · מקס · 高
- **WidgetLo** — Lo · Mín · Min · صغرى · מינ · 低
- **WidgetAgeMinutes** — %{count}m ago · hace %{count} min · il y a %{count} min · قبل %{count} د · לפני %{count} ד׳ · %{count} 分钟前
- **WidgetAgeHours** — %{count}h ago · hace %{count} h · il y a %{count} h · قبل %{count} س · לפני %{count} ש׳ · %{count} 小时前
- **WidgetAgeDays** — %{count}d ago · hace %{count} d · il y a %{count} j · قبل %{count} ي · לפני %{count} י׳ · %{count} 天前

---

## 5 · Human follow-up checklist

1. [ ] **Review the diff and push** the branch (22 commits, `730eb37..HEAD`). Nothing has been pushed.
2. [ ] **Open the PR** to `main` and verify the CI workflow goes green on GitHub (it runs the same `yarn gate`).
3. [ ] **Apply the proxy hardening spec** (`plans/proxy-hardening-spec.md`) in the proxy repo — rate limit first, observe, then tighten. Note: the app treats 429 as non-recoverable (no Retry button) and reads `retryAfter` from the JSON body — the spec's 429 contract accounts for both.
4. [ ] **Cut a new EAS build** so the Android manifest actually drops `ACCESS_BACKGROUND_LOCATION` (and picks up the removed native deps + strict-mode bundle), **then** retract any Play Console background-location declaration.
5. [ ] **Review the agent-authored translations** (§4 above — F's key + K's 30+1, all six languages).
6. [ ] **EAS dashboard parity for `production`**: verify `EXPO_PUBLIC_WEATHER_API_URL` is set in the EAS `production` environment (only `preview` is pinned in eas.json; production was deliberately not guessed).
7. [ ] **Update store-listing copy/screenshots** if they mention OpenWeather (outside the repo).
8. [ ] Website: no redeploy needed — content unchanged (zero OpenWeather references; marketing site doesn't call the proxy).
9. [ ] **Strict mode:** nothing deferred — `strict: true` is fully enabled and green; no decision needed.
10. [ ] **WeatherAPI attribution — low priority, verify when convenient (supersedes V7/Geoapify):** the proxy now serves WeatherAPI.com data (Geoapify is out of the stack entirely), and the app credits no provider. WeatherAPI's *free* tier requires a "Powered by WeatherAPI.com" link; **the account is on a paid business plan, which is generally exempt** — so this is a confirm-the-terms item, not a blocker. Confirm the key in the proxy's production `WEATHERAPI_KEY` belongs to the paid plan; if attribution turns out to be required, add a credit line in Settings/About. Owner decision D1 (strip OpenWeather, credit nobody) remains correct either way.
11. [ ] **Per-app language picker (V10):** removing `react-native-localization-settings` dropped its `languages: [ar,en,es,fr,he,zh]` OS-level declaration. In-app switching is unaffected. Re-declare via app.json `locales` / iOS `CFBundleLocalizations` + new build if you want the Android 13+/iOS system picker.
12. [ ] Optional follow-ups filed but not blocking: findings 14 (scroll reset), 27 (context value memo), 30 (search request cancellation), 31/V9 (raw error.message pass-through), V1 (committed website/.next), V6 (getCityCoordinates), V8 (WeatherStandard footer string).
