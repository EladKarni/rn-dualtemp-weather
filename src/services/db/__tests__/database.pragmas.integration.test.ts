/**
 * The concurrency pragmas, executed against a REAL SQLite engine.
 *
 * The sibling unit test proves the app issues the right statements; it cannot
 * prove those statements do anything, because the driver is a mock. This one
 * runs them against node:sqlite (SQLite 3.50.x, the same engine family as
 * expo-sqlite's vendored 3.50.3) on real files, and asserts the observable
 * consequences: the file header flips to WAL, and a blocked writer waits
 * instead of failing instantly.
 *
 * Worth having because the whole fix rests on two claims that are easy to state
 * and easy to get wrong — "WAL lets a reader and a writer coexist" and
 * "busy_timeout makes a second writer wait". Both are verified here rather than
 * taken on faith.
 *
 * Node 22.5+ only; skipped automatically elsewhere so it can never fail a CI
 * runner for being on an older Node.
 */
import fs from "fs";
import os from "os";
import path from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
let DatabaseSync: any;
try {
  ({ DatabaseSync } = require("node:sqlite"));
} catch {
  DatabaseSync = null;
}

const describeIfSqlite = DatabaseSync ? describe : describe.skip;

/**
 * Monotonic elapsed milliseconds. NOT Date.now(): the jest-expo environment
 * mocks it, and a mocked clock reports these waits as negative — which would
 * make the two timing assertions below silently meaningless.
 */
const elapsedMs = (from: bigint): number => Number(process.hrtime.bigint() - from) / 1e6;

/** The pragmas applied by WeatherDatabase.applyConcurrencyPragmas, in order. */
const BUSY_TIMEOUT_MS = 5000;
const applyPragmas = (db: any) => {
  db.exec(`PRAGMA busy_timeout = ${BUSY_TIMEOUT_MS};`);
  return db.prepare("PRAGMA journal_mode = WAL;").get();
};

describeIfSqlite("concurrency pragmas against real SQLite", () => {
  let dir: string;
  let file: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "dualtemp-sqlite-"));
    file = path.join(dir, "weather_forecasts.db");
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  const seed = (db: any) => {
    db.exec(
      "CREATE TABLE IF NOT EXISTS weather_cache (location_id TEXT PRIMARY KEY, last_updated INTEGER NOT NULL);"
    );
    db.exec("INSERT OR REPLACE INTO weather_cache VALUES ('a', 1), ('b', 2);");
  };

  it("a default database really is on the rollback journal", () => {
    // The premise of the whole fix. If expo-sqlite ever starts defaulting to
    // WAL, this fails and the fix becomes redundant rather than wrong.
    const db = new DatabaseSync(file);
    seed(db);
    db.close();

    // Bytes 18 and 19 of the header are the write/read format versions:
    // 1,1 means legacy rollback journal, 2,2 means WAL.
    const header = fs.readFileSync(file).subarray(0, 20);
    expect([header[18], header[19]]).toEqual([1, 1]);
  });

  it("applying the pragmas converts the file to WAL", () => {
    const db = new DatabaseSync(file);
    seed(db);

    const result = applyPragmas(db);
    expect(String(result.journal_mode).toLowerCase()).toBe("wal");

    db.exec("INSERT OR REPLACE INTO weather_cache VALUES ('c', 3);");
    db.close();

    const header = fs.readFileSync(file).subarray(0, 20);
    expect([header[18], header[19]]).toEqual([2, 2]);
  });

  it("WAL lets one connection read while another writes", () => {
    // The failure that was observed: the widget's connection reading while the
    // app's DELETE tried to run. Under the rollback journal this is the case
    // that fails; it is the reason WAL is worth having at all.
    const writer = new DatabaseSync(file);
    seed(writer);
    applyPragmas(writer);

    const reader = new DatabaseSync(file);
    reader.exec(`PRAGMA busy_timeout = ${BUSY_TIMEOUT_MS};`);

    // Open a read transaction and leave it open, exactly as an in-flight query
    // on the other connection would.
    reader.exec("BEGIN;");
    expect(reader.prepare("SELECT COUNT(*) AS n FROM weather_cache;").get().n).toBe(2);

    // The write must succeed while that reader is still open.
    expect(() =>
      writer.prepare("DELETE FROM weather_cache WHERE last_updated < ?").run(2)
    ).not.toThrow();

    reader.exec("COMMIT;");
    reader.close();
    writer.close();
  });

  it("busy_timeout makes a second writer wait rather than fail instantly", () => {
    // WAL still allows only ONE writer, so this is the half of the fix that
    // covers writer-vs-writer — both contexts running CREATE TABLE IF NOT
    // EXISTS on first launch, or a widget save landing during the eviction.
    const a = new DatabaseSync(file);
    seed(a);
    applyPragmas(a);

    const b = new DatabaseSync(file);
    b.exec("PRAGMA busy_timeout = 250;");

    a.exec("BEGIN IMMEDIATE;"); // a now holds the write lock

    const started = process.hrtime.bigint();
    let threw = false;
    try {
      b.exec("INSERT OR REPLACE INTO weather_cache VALUES ('d', 4);");
    } catch {
      threw = true;
    }
    const waited = elapsedMs(started);

    // It still fails — `a` never releases — but the point is that it TRIED for
    // the full timeout instead of giving up immediately. In production the
    // holder commits in single-digit milliseconds, so waiting is what turns a
    // failure into a success.
    expect(threw).toBe(true);
    expect(waited).toBeGreaterThanOrEqual(200);

    a.exec("ROLLBACK;");
    a.close();
    b.close();
  });

  it("without busy_timeout the same writer gives up immediately", () => {
    // The control for the test above, and the actual pre-fix behaviour:
    // expo-sqlite installs no busy handler, so the timeout is 0.
    const a = new DatabaseSync(file);
    seed(a);
    applyPragmas(a);

    const b = new DatabaseSync(file); // no busy_timeout
    a.exec("BEGIN IMMEDIATE;");

    const started = process.hrtime.bigint();
    expect(() =>
      b.exec("INSERT OR REPLACE INTO weather_cache VALUES ('e', 5);")
    ).toThrow();
    expect(elapsedMs(started)).toBeLessThan(100);

    a.exec("ROLLBACK;");
    a.close();
    b.close();
  });
});
