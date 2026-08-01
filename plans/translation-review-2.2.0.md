# Translation review — 2.2.0 (agent pass, pre-owner review)

Generated 2026-07-31 by a five-locale review fan-out (one reviewer per locale vs the English reference), synthesized below. The five wrong-meaning strings it found (4 ar, 1 zh) were already fixed in src/localization/; everything else is left for the owner pass.

# Translation Review Summary — 5 Locales

## 1. Must-fix: wrong-meaning strings

### Arabic (4 strings, all in the older core-UI block)
| Key | Shipped | Problem | Fix |
|---|---|---|---|
| `Min` | دقيقة | Means "minute" (time unit) — users see "minute: 12°" | الصغرى |
| `MinMax` | دقيقة/الأعلى | "minute/highest" — same error plus register mismatch | الصغرى/العظمى |
| `DailyTitle` | العنوان اليومي | Translates the i18n *key name* ("the daily title"), not "Daily Forecast" | التوقعات الجوية اليومية |
| `Feels` | ستشعر كأنه/يبدو كأنه | Two slash-separated MT candidates shipped verbatim | الإحساس كأنها |

### Chinese (1 string)
| Key | Shipped | Problem | Fix |
|---|---|---|---|
| `DailyTitle` | 全天预报 | Means a whole-*day* forecast; the section is the multi-day list | 每日预报 |

No blockers or wrong-meaning strings in Spanish, French, or Hebrew.

## 2. Per-locale verdicts

**Spanish — shippable after minor fixes.** No meaning errors; errors, placeholders, and widget strings are sound. Fix before release: unaccented Minimo/Maximo trio (visible spelling error), the wide `hace %{count} min` widget footer string, the "Reduce la velocidad" calque, and a consistency pass on three wobbling term pairs (agregar/añadir, clima/tiempo, Ajustes/Configuración). All string-only edits in `src/localization/es.ts`.

**French — needs one polish pass, nothing user-harmful.** Error taxonomy, placeholders, and plurals all hold. The work is mechanical: strip English Title Case from ~10 settings labels (the biggest MT tell), unify "emplacement" → "lieu" (wrong register for a saved city), de-calque `MaxLocationsReached`, and shorten the three `WidgetAge` strings ("il y a 59 min" is ~2x the English width at 9pt — the one real overflow risk).

**Arabic — blocked on the 4-string cluster above.** Everything outside that cluster is strong: fluent error/permission strings, consistent terminology, excellent widget chrome (عظمى/صغرى), bidi-safe placeholders. After the four fixes plus `Max` → العظمى (to pair with الصغرى) and the 11–99 plural fix in `MaxLocationsReached`, it ships.

**Hebrew — largely shippable; one widget cluster to fix.** Meaning faithful throughout, good register and terminology. The invented abbreviations must go: מ״נ (`WidgetLo`, the in-file comment defending it is wrong) → מינ׳ or מינ; י׳ (`WidgetAgeDays`, reads as gematria 10) → ימים; ש׳ (`WidgetAgeHours`) → שע׳. Also add את to `DeleteLocationConfirm` so the concatenated city name composes grammatically.

**Chinese — shippable after the `DailyTitle` fix.** Register, error taxonomy, measure words, and the principled 位置/定位 vs 地点 split are all good. Worth taking in the same pass: 中 → 中午, 最新更新于 → 更新于, iOS-flavored 点按 → 点击 on an Android widget, 联系支持 → 联系支持团队, and fullwidth-colon/no-space punctuation cleanup.

## 3. Cross-locale patterns (source-string and code issues)

**`DailyTitle` failed in 3 of 5 locales** (ar: key-name translated; zh: wrong scope; fr: drifted to "Week"). The English "Daily Forecast" is ambiguous between "forecast for the day" and "day-by-day forecast" — consider renaming the key or adding a translator comment ("header over the multi-day list").

**"Min" is a trap.** Arabic expanded it as "minute"; Spanish shipped it unaccented; the abbreviation also collides with the minutes unit in `WidgetAgeMinutes`. Add a translator comment ("minimum temperature") or rename the keys `MinTemp`/`MaxTemp`.

**`ErrRateLimit` "please slow down" calqued in es, fr, and he** — all three read like a road sign. The English idiom doesn't travel; consider rewriting the English source to "wait a moment and try again" so future locales don't inherit it.

**`MaxLocationsReached` is telegraphic in all 4 non-English reviews.** The English "Maximum %{count} locations saved" is itself not a sentence; every locale calqued it. Rewrite the English as a full sentence ("You can save up to %{count} locations") and retranslate.

**`WidgetAge` strings are a systematic width hazard.** es and fr overflow at 9pt (fix: drop "hace"/"il y a"); zh has convention-breaking spaces; he uses invented unit abbreviations. When fixing, keep the compact bare-duration idiom ("59 min") consistent across locales.

**English Title Case leaked into es and fr settings labels** (~10 keys each). Both languages want sentence case; a one-time sweep fixes the strongest MT tell in each file.

**Code-level fix affecting 3 locales:** `DeleteLocationConfirm` is concatenated in code (`LocationList.tsx:36`, `LocationDropdown.tsx:78`) as `fragment + name + "?"`. This breaks French typography (needs " ?"), Hebrew grammar (missing את — fixable in-string as a workaround), and Arabic punctuation (؟ vs ?). Convert to a full template with a `%{name}` placeholder and let each locale own its punctuation. This is the one fix that requires touching components, not just the string tables.

---

## Full per-locale issue lists

### es (mixed es-ES / es-419 — file leans es-ES: comprueba, ajustes, añade)

Shippable after minor fixes — there are no blockers and no meaning errors: the full error taxonomy (including the location-permission and GPS strings), search flow, delete confirmation (the code-side concatenation with the appended name and '?' composes correctly with the opening '¿'), placeholders (%{count}, %{email}, %{location}), and the accessibility-driven widget theme names ('Azul medianoche', 'Gris pizarra', 'Morado ciruela', 'Verde bosque') are all accurate and natural. WidgetHi/WidgetLo as 'Máx'/'Mín' are the idiomatic Spanish weather abbreviations and fit the widget columns. What needs attention before release: the unaccented 'Minimo/Maximo' trio (a visible spelling error), the 'hace %{count} min' widget age string that runs ~4 characters wider than the English at 9-14pt, one MT calque ('Reduce la velocidad'), and a consistency pass to settle three wobbling term pairs — agregar/añadir, clima/tiempo, and Ajustes/Configuración. All are quick string-only edits in src/localization/es.ts.

- **[awkward] MinMax** — current: 'Minimo/Maximo' → suggested: 'Mín/Máx'
  - Missing accents (correct spelling is Mínimo/Máximo) — a visible orthographic error to any Spanish reader. Also much longer than the English 'Min/Max' for a compact stat label, and inconsistent with WidgetHi/WidgetLo which correctly use the accented abbreviations Máx/Mín.
- **[awkward] Min** — current: 'Minimo' → suggested: "Mínimo (or the standard weather abbreviation 'Mín' if the slot is narrow)"
  - Missing accent — correct spelling is 'Mínimo'.
- **[awkward] Max** — current: 'Maximo' → suggested: "Máximo (or 'Máx' if the slot is narrow)"
  - Missing accent — correct spelling is 'Máximo'.
- **[awkward] Feels** — current: 'Se siente como' → suggested: "Sensación térmica (or just 'Sensación' if the label column in DailyForecastExpanded is tight)"
  - Literal calque of 'Feels Like'. Understandable, but every mainstream Spanish weather app (AEMET, Google Weather, Apple Weather) uses 'Sensación térmica' — 'Se siente como' reads as machine translation.
- **[awkward] WidgetAgeMinutes** — current: 'hace %{count} min' → suggested: "%{count} min (and correspondingly '%{count} h' / '%{count} d' for WidgetAgeHours/WidgetAgeDays, keeping the three visually parallel)"
  - Fit hazard: worst case 'hace 59 min' is 11 characters vs English '59m ago' at 7, rendered at 9-14pt in a tiny widget column. Same pattern applies to WidgetAgeHours ('hace 23 h') and WidgetAgeDays ('hace 7 d'), though those are shorter. Dropping 'hace' is idiomatic for a compact age tag and matches the telegraphic English register. Plural handling is fine either way since Spanish unit abbreviations don't inflect.
- **[awkward] OpenSettings** — current: 'Abrir Configuración' → suggested: 'Abrir ajustes'
  - Terminology inconsistency: the app's own settings screen is 'Ajustes' (key Settings), but this button says 'Configuración' — two different words for the same concept in one app. 'Ajustes' also matches the es-ES lean of the rest of the file (comprueba, añade).
- **[awkward] AddLocation** — current: 'Agregar Ubicación' → suggested: 'Añadir ubicación'
  - Dialect mixing: 'agregar' is Latin American, while the adjacent empty-state and permission strings (NoLocationDescription, ErrPermissionDenied) use es-ES 'añade una ciudad' — the user sees both verbs for the same action on the same screen. The file overall leans es-ES ('comprueba', 'ajustes'), so 'añadir' is the consistent choice.
- **[awkward] DuplicateLocation** — current: 'Esta ubicación ya ha sido agregada' → suggested: 'Ya has añadido esta ubicación'
  - Same agregar/añadir mixing as AddLocation, compounded by a stiff passive ('ya ha sido agregada') where Spanish UI copy prefers an active or stative form.
- **[awkward] ErrRateLimit** — current: 'Demasiadas solicitudes. Reduce la velocidad e inténtalo de nuevo.' → suggested: 'Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.'
  - 'Reduce la velocidad' is a word-for-word calque of 'slow down' that in Spanish reads like a driving instruction, not a rate-limit message.
- **[nitpick] NoLocationDescription** — current: 'Añade una ciudad para ver su tiempo. No necesitas activar el acceso a la ubicación.' → suggested: 'Añade una ciudad para ver su clima. No necesitas activar el acceso a la ubicación.'
  - Terminology inconsistency: this is the only string using 'tiempo' for weather, while ErrorTitle, LoadingTitle, and WidgetLoadError all use 'clima'. Out of context 'ver su tiempo' can also momentarily parse as 'see its time'. Pick one term app-wide; since the file already uses 'clima' three times, align to it.
- **[nitpick] MaxLocationsReached** — current: 'Máximo %{count} ubicaciones guardadas' → suggested: 'Solo puedes guardar %{count} ubicaciones'
  - Telegraphic and slightly ungrammatical ('máximo' needs 'de' before a quantified noun). The placeholder survives and is positioned fine; the phrasing just doesn't explain why the add failed.
- **[nitpick] ErrPositionTimeout** — current: 'Encontrar tu ubicación está tardando demasiado. Inténtalo de nuevo.' → suggested: 'Estamos tardando demasiado en encontrar tu ubicación. Inténtalo de nuevo.'
  - Infinitive-as-subject mirrors the English gerund structure and sounds translated; a personal construction is more natural.
- **[nitpick] TemperatureUnit (also TimeFormat, AppLanguage, CurrentLocation, AddLocation, DeleteLocation, ShowSunriseSunset, Format12Hour, Format24Hour)** — current: 'Unidad de Temperatura / Formato de Hora / Idioma de la Aplicación / Ubicación Actual / ...' → suggested: "Sentence-case throughout: 'Unidad de temperatura', 'Formato de hora', 'Idioma de la aplicación', 'Ubicación actual', 'Eliminar ubicación', 'Mostrar amanecer/atardecer', '12 horas', '24 horas'"
  - English-style Title Case carried into Spanish, where UI convention is sentence case (only the first word capitalized). The file is also internally inconsistent: EnableLocation ('Activar ubicación') and UseCurrentLocation ('Usar ubicación actual') already use sentence case.

### fr

Needs one polish pass, but nothing is user-harmful: there are no blockers and no wrong-meaning strings — the whole error/permission taxonomy (ErrPermissionDenied, ErrLocationUnavailable, ErrNoConnection, etc.) is accurate and natural, placeholders all survive in grammatical positions, the single-template plural approach holds (min/h/j are invariant abbreviations), and the maroon/marron false friend was correctly handled with \"Bordeaux\". The fixes needed are mechanical and clustered: strip the English Title Case from ~10 settings labels (the biggest MT tell), unify \"emplacement\" onto \"lieu\" (the table already uses \"lieu\" in NoLocationTitle, and \"emplacement\" is the wrong word for a saved city anyway), de-calque MaxLocationsReached, and shorten the three WidgetAge strings, which at roughly double the English width are the one genuine overflow risk in the 9pt 1x1 widget footer. Ship after those; the remaining items are nitpicks.

- **[awkward] TemperatureUnit, TimeFormat, Format12Hour, Format24Hour, CurrentLocation, AddLocation, DeleteLocation, OpenSettings, AppLanguage, ShowSunriseSunset** — current: '"Unité de Température", "Format d\'Heure", "12 Heures", "24 Heures", "Position Actuelle", "Ajouter un Emplacement", "Supprimer l\'Emplacement", "Ouvrir les Paramètres", "Langue de l\'Application", "Afficher Lever/Coucher du Soleil"' → suggested: '"Unité de température", "Format de l\'heure", "12 heures", "24 heures", "Position actuelle", "Ajouter un lieu", "Supprimer le lieu", "Ouvrir les paramètres", "Langue de l\'application", "Afficher le lever/coucher du soleil"'
  - English Title Case carried straight into French. French UI convention (Apple and Microsoft French style guides alike) is sentence case — only the first word capitalized. Mid-phrase capitals like "de Température" or "l'Application" are the single strongest machine-translation tell in the table. "Format d'Heure" is additionally unidiomatic phrasing.
- **[awkward] Locations, AddLocation, NoResults, DuplicateLocation, DeleteLocation (vs NoLocationTitle)** — current: '"Emplacements" / "Ajouter un Emplacement" / "Aucun emplacement trouvé" / "Cet emplacement a déjà été ajouté" / "Supprimer l\'Emplacement" — while NoLocationTitle says "Aucun lieu pour l\'instant"' → suggested: 'Unify on "lieu": Locations → "Lieux", AddLocation → "Ajouter un lieu", NoResults → "Aucun lieu trouvé" (or "Aucune ville trouvée", matching the "Rechercher une ville..." placeholder), DuplicateLocation → "Ce lieu a déjà été ajouté", DeleteLocation → "Supprimer le lieu"'
  - Terminology split: "emplacement" and "lieu" are both used for the same concept (a saved place). "Emplacement" is also the wrong register — it denotes a physical spot or slot (emplacement de parking, de camping), not a city in a weather app. Note "position"/"localisation" for GPS matters are used correctly and should stay as-is.
- **[awkward] MaxLocationsReached** — current: 'Maximum %{count} emplacements enregistrés' → suggested: 'Vous avez atteint la limite de %{count} lieux enregistrés. (placeholder stays mid-sentence; "lieux" plural is safe since the cap is always >1, same assumption as the English)'
  - Word-for-word calque of "Maximum %{count} locations saved" — telegraphic, not a French sentence; a native speaker would never phrase a limit warning this way.
- **[awkward] WidgetAgeMinutes / WidgetAgeHours / WidgetAgeDays** — current: 'il y a %{count} min / il y a %{count} h / il y a %{count} j' → suggested: 'Drop "il y a" and use bare compact durations, the established French timestamp idiom (Twitter/WhatsApp style): "%{count} min", "%{count} h", "%{count} j". In a stale-data footer the elapsed-time reading is unambiguous, and the invariant abbreviations keep the single plural template safe.'
  - Correct French but a fit hazard: worst case "il y a 59 min" is 13 characters vs the English "59m ago" at 7 — nearly double — and it renders at fontSize 9 in the 1x1 compact widget footer (src/widgets/WeatherCompact.tsx:109). Clipping there is worse than cosmetic: a truncation like "il y a 5…" misreads as a different age.
- **[nitpick] ErrRateLimit** — current: 'Trop de requêtes. Veuillez ralentir et réessayer.' → suggested: 'Trop de requêtes. Veuillez patienter un instant avant de réessayer.'
  - "Veuillez ralentir" is a literal "please slow down" — in French it reads like a road sign addressed to a driver, not app copy.
- **[nitpick] ErrorSupport** — current: 'Si cela se produit souvent, contactez le support à' → suggested: "Si cela se produit souvent, contactez l'assistance à l'adresse"
  - The dangling "à" before the line-broken email (ErrorScreen.tsx:52 renders the address on the next line) is an anglicism; French wants "à l'adresse". "Le support" is tolerated consumer French but "l'assistance" is the standard term.
- **[nitpick] DeleteLocationConfirm** — current: 'Êtes-vous sûr de vouloir supprimer' → suggested: 'Change the call sites to a full template and translate as "Voulez-vous vraiment supprimer %{name} ?" — the standard genderless French confirmation, with the correct space before the question mark.'
  - Code appends " ${location.name}?" (src/components/Settings/LocationList.tsx:36, src/components/LocationDropdown/LocationDropdown.tsx:78), producing "…supprimer Paris?" — French typography requires a space before "?" ("Paris ?"). Also "sûr" silently genders the user male ("sûre" for women). Neither is fixable from the string table alone.
- **[nitpick] DailyTitle** — current: 'Semaine' → suggested: 'Keep if the list is ~7 days; otherwise "Prochains jours".'
  - Means "Week", a shift from "Daily Forecast"; the list renders however many days the API returns (typically 8 with OpenWeather), so the header slightly misdescribes the content. Defensible as a compact section title.

### ar

Needs fixes before shipping, but the damage is confined to one cluster. Four strings in the older core-UI block are genuine mistranslations a native speaker would laugh at or be confused by: Min rendered as "minute" (دقيقة) — also poisoning MinMax — DailyTitle translated as "the daily title" instead of "Daily Forecast", and Feels shipping two slash-separated MT candidates verbatim. Everything else is in good shape: the error taxonomy and permission strings (ErrPermissionDenied, ErrLocationUnavailable, etc.) are fluent, accurate, and correctly non-alarming; terminology is consistent (الموقع for location throughout, جلب for fetch); the widget chrome is excellent — عظمى/صغرى are the idiomatic Hi/Lo weather terms and short enough for 9–14pt columns, and the age templates (قبل %{count} د/س/ي) put the placeholder in the grammatically correct slot and render correctly in RTL with embedded Latin digits. The color swatch accessibility names correctly add color heads only where the bare noun would be ambiguous, matching the English comment's intent. Placeholders all survive intact (%{count}, %{location}, %{email}) in correct positions, and mixed-direction strings (12 ساعة, لـ %{location}, the mid-sentence %{email}) are bidi-safe. One code-level note outside the table: LocationDropdown/LocationList append an ASCII "?" after DeleteLocationConfirm + city name; Arabic convention prefers "؟", which can only be fixed at the call site, not in the table.

- **[wrong-meaning] Min** — current: 'دقيقة' → suggested: 'الصغرى'
  - "دقيقة" means "minute" (the unit of time) — the MT engine expanded the abbreviation "Min" as "minute" instead of "minimum". This renders as a label next to the day's minimum temperature in DailyForecastExpanded, so users see "minute: 12°".
- **[wrong-meaning] MinMax** — current: 'دقيقة/الأعلى' → suggested: 'الصغرى/العظمى'
  - Same "Min → minute" mistranslation, yielding "minute/highest". Also mixes two different registers on either side of the slash. Rendered as a section label in the expanded daily forecast.
- **[wrong-meaning] DailyTitle** — current: 'العنوان اليومي' → suggested: 'التوقعات الجوية اليومية'
  - Means "the daily title/headline" — the translator translated the i18n key name, not the English string "Daily Forecast". This is the visible header of the daily forecast section.
- **[wrong-meaning] Feels** — current: 'ستشعر كأنه/يبدو كأنه' → suggested: 'الإحساس كأنها (or, if space allows, درجة الحرارة المحسوسة)'
  - This is two alternative MT candidates ("you will feel as if / it seems as if") shipped verbatim with the separating slash — raw translation-memory debris, not a usable label. It renders above the feels-like temperature in the expanded daily card.
- **[awkward] Max** — current: 'الأعلى' → suggested: 'العظمى'
  - Understandable ("the highest") but not the idiomatic Arabic weather term, and inconsistent with the widget chrome which correctly uses عظمى/صغرى (WidgetHi/WidgetLo). It sits directly next to Min in the same card, so the pair should match.
- **[awkward] MaxLocationsReached** — current: 'الحد الأقصى %{count} مواقع محفوظة' → suggested: 'يمكن حفظ %{count} موقعًا كحد أقصى'
  - Telegraphic word-for-word rendering ("the maximum %{count} locations saved"), and with count = 25 (MAX_SAVED_LOCATIONS) the plural is grammatically wrong: numbers 11–99 take the singular accusative (٢٥ موقعًا), not the broken plural مواقع which is for 3–10. Since the app uses one template, pick the form correct for 25.
- **[awkward] Noon** — current: 'وقت الظهيرة' → suggested: 'ظهرًا'
  - Breaks the pattern of its three sibling column labels, which are all short adverbials (صباحًا، مساءً، ليلًا); "وقت الظهيرة" ("the time of noon") is a longer noun phrase in a different register and the widest of the four column labels in the expanded daily card.
- **[nitpick] Searching** — current: 'جاري البحث...' → suggested: 'جارٍ البحث...'
  - Orthographic inconsistency: every other in-progress string in the table (Locating, LoadingTitle, LoadingMessage, WidgetRefreshing) uses the correct جارٍ with tanwin kasr; this one alone uses جاري.

### he

The table is largely shippable: meaning is faithful throughout, register is consistent consumer-neutral Hebrew (masculine imperatives used consistently, standard for Israeli apps), terminology is consistent (מיקום everywhere for location, the אחזור family for fetching), the colour-swatch accessibility labels are genuinely well-adapted attested Hebrew shade names rather than calques, and placeholders (%{count}, %{email}, %{location}) all survive in grammatically correct positions with no RTL scrambling risk. There are no blockers and no wrong-meaning strings. The one cluster that needs fixing before release is the widget abbreviations: מ״נ (WidgetLo) and י׳ (WidgetAgeDays) are invented abbreviations no Hebrew reader will recognize — the in-file comment defending מ״נ is factually wrong — and ש׳ for hours is non-idiomatic; all three have short, idiomatic replacements that fit the widget columns. Secondary fixes: add את to the delete-confirmation fragment (it is concatenated with the city name and currently composes an ungrammatical sentence), and smooth two stiff error strings (MaxLocationsReached, ErrRateLimit).

- **[awkward] WidgetLo** — current: 'מ״נ' → suggested: 'מינ׳ (with geresh, matching טמפ׳), or plain מינ to pair cleanly with מקס. Both are 4 chars or fewer and fit the 9–14pt column.'
  - מ״נ is not a real Hebrew abbreviation for מינימום — the code comment's claim is false. Gershayim marks acronyms of multiple words (צה״ל, ש״ח); a truncated single word takes a terminal geresh, exactly like טמפ׳ already used in this file (MinMax). A Hebrew reader seeing מ״נ in a widget will not recognize it and can only infer 'low' from position. It is also asymmetric with WidgetHi = מקס, which carries no punctuation.
- **[awkward] WidgetAgeDays** — current: 'לפני %{count} י׳' → suggested: "לפני %{count} ימים — it fits the widget footer. Caveat: with count=1 this composes as 'לפני 1 ימים'; ideally special-case day 1 in formatDataAge (e.g. 'לפני יום'), but the full word is still far better than י׳."
  - י׳ is not an abbreviation for ימים in any Hebrew usage — readers parse a lone yod+geresh as the letter/gematria 10 (as in dates like י׳ בתשרי). 'לפני 3 י׳' is unintelligible. Hebrew simply has no compact day abbreviation.
- **[awkward] WidgetAgeHours** — current: 'לפני %{count} ש׳' → suggested: 'לפני %{count} שע׳'
  - ש׳ alone is not the idiomatic compact form for שעות (a lone ש׳ conventionally abbreviates שנה or שורה). Israeli apps (Google Maps, Waze, transit apps) use שע׳ for hours.
- **[awkward] DeleteLocationConfirm** — current: 'האם אתה בטוח שברצונך למחוק' → suggested: "האם אתה בטוח שברצונך למחוק את (the appended name then composes grammatically: 'למחוק את תל אביב?'). RTL punctuation composes correctly even for Latin-script city names, so only the את is missing."
  - The code appends the location name directly (`${t("DeleteLocationConfirm")} ${location.name}?`), so the composed Hebrew sentence is 'האם אתה בטוח שברצונך למחוק תל אביב?' — missing the object marker את, which standard Hebrew requires before a definite object/proper name. The fragment was translated without accounting for the concatenation.
- **[awkward] MaxLocationsReached** — current: 'מקסימום %{count} מיקומים שמורים' → suggested: 'ניתן לשמור עד %{count} מיקומים'
  - Stiff calque of the English noun phrase; as an error message shown when the user hits the cap, 'מקסימום 5 מיקומים שמורים' reads like a spec line, not a sentence a Hebrew app would show.
- **[awkward] ErrRateLimit** — current: 'יותר מדי בקשות. אנא האט ונסה שוב.' → suggested: 'יותר מדי בקשות. המתן מעט ונסה שוב.'
  - 'אנא האט' is a literal rendering of 'please slow down' and reads like a road sign / driving instruction in Hebrew; no Israeli app tells the user to האט.
- **[nitpick] WidgetAgeMinutes** — current: 'לפני %{count} ד׳' → suggested: 'לפני %{count} דק׳'
  - ד׳ for minutes is seen (school timetables) but the dominant compact convention in consumer apps is דק׳ (Google Maps/Waze style), which also pairs with the suggested שע׳ for hours. Minor, since ד׳ is at least attested.
- **[nitpick] WidgetStyle** — current: "סגנון הווידג'ט" → suggested: 'סגנון הווידג׳ט'
  - Uses an ASCII apostrophe for the ג' instead of the Hebrew geresh (U+05F3) — inconsistent with the file's own careful use of ׳/״ in טמפ׳ and the age abbreviations.

### zh-CN (Chinese, Simplified)

The table is largely well translated: register is consistent friendly-neutral (您-form throughout), the error taxonomy is accurate — including the deliberately masked ErrAuth and the reassuring ErrPermissionDenied — all placeholders survive with correct measure words (%{count}个地点), the 位置/定位 (device position) vs 地点 (saved place) split is a principled and natural distinction rather than an inconsistency, the widget theme names correctly carry a colour head (午夜蓝, 石板灰), and the widget Hi/Lo abbreviations 高/低 are ideal single-character fits. One string must be fixed before shipping: DailyTitle 全天预报 misdescribes the multi-day forecast section as a whole-day forecast (should be 每日预报). The rest are polish items — the ambiguous standalone 中 for Noon, the redundant 最新更新于, the iOS-flavored 点按以重试 on an Android widget, the anglicized 联系支持, and punctuation/spacing conventions (fullwidth colons, no space before 分钟前/小时前/天前 in the tight widget footer). Shippable after the DailyTitle fix; the awkward-tier items are worth taking in the same pass.

- **[wrong-meaning] DailyTitle** — current: '全天预报' → suggested: '每日预报'
  - 全天预报 means an all-day/whole-day forecast for a single day, but this string is the section header over the multi-day forecast list (DailyForecast.tsx maps over the coming days). A Chinese reader would expect this section to show today's hour-span, not the week ahead. Standard term in Chinese weather apps is 每日预报.
- **[awkward] Noon** — current: '中' → suggested: '中午'
  - 中 alone means 'middle', not noon. It only reads as noon inside the compact 早/中/晚 triple, and this label set breaks that pattern (its siblings are the full words 傍晚 and 夜晚), so as a standalone temperature-row label it is confusing.
- **[awkward] Updated** — current: '最新更新于: ' → suggested: '更新于：'
  - 最新更新于 is redundant ('latest updated at') and reads machine-translated; it also uses a halfwidth colon plus trailing space where Chinese text takes a fullwidth colon with no space.
- **[awkward] WidgetTapToRetry** — current: '点按以重试' → suggested: '点击重试'
  - 点按 is Apple/iOS HIG terminology and 以 makes it stiff; these are Android widgets, where the universal convention is 点击. Also shorter, which helps in widget chrome.
- **[awkward] ErrorSupport** — current: '如果经常发生这种情况，请联系支持：' → suggested: '如果经常发生这种情况，请联系支持团队：'
  - 联系支持 is an anglicism — 支持 by itself is not a natural noun for the support team in Chinese; it needs a head noun (支持团队 / 客服).
- **[nitpick] Morn** — current: '早' → suggested: '早晨'
  - Single-character 早 is telegraphic and inconsistent with its two-character siblings 傍晚/夜晚 (and 中午 once Noon is fixed).
- **[nitpick] WidgetAgeMinutes** — current: '%{count} 分钟前' → suggested: '%{count}分钟前'
  - The space between the number and the unit wastes width in the 9-14pt widget footer; compact Chinese UI convention is no space (5分钟前, as in WeChat/iOS). Chinese needs no plural handling, so the single template is fine.
- **[nitpick] WidgetAgeHours** — current: '%{count} 小时前' → suggested: '%{count}小时前'
  - Same as WidgetAgeMinutes: drop the space before the unit for width and convention in the tiny widget footer.
- **[nitpick] WidgetAgeDays** — current: '%{count} 天前' → suggested: '%{count}天前'
  - Same as WidgetAgeMinutes: drop the space before the unit for width and convention in the tiny widget footer.
- **[nitpick] Sunrise** — current: '日出时间: ' → suggested: '日出时间：'
  - Halfwidth colon with trailing space inside Chinese text; should be the fullwidth colon with no space.
- **[nitpick] Sunset** — current: '日落时间: ' → suggested: '日落时间：'
  - Halfwidth colon with trailing space inside Chinese text; should be the fullwidth colon with no space.
- **[nitpick] LoadingMessage** — current: '正在获取 %{location} 的预报' → suggested: '正在获取%{location}的预报'
  - Spaces around the placeholder produce visible gaps for Chinese place names ('正在获取 北京 的预报'); CJK-to-CJK boundaries take no space, and Latin names still read fine without them. Placeholder position itself is grammatically correct.
