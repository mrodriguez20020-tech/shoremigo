import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { AuditEvent, Booking, Disruption, RescueProposal } from "@/lib/domain/types";

/**
 * Persistence boundary, two adapters behind the same tx/read API:
 *  - JSON file (default): local dev and single-instance demos. Serialized in-process.
 *  - Postgres (when DATABASE_URL is set, e.g. Supabase or Neon): required on
 *    Vercel, where routes can run on separate instances with separate disks.
 *    The whole state is one JSONB document; every tx locks that row
 *    (SELECT ... FOR UPDATE), so read-modify-write is serialized across all
 *    instances and rolls back if the callback throws. Fine for a demo-scale
 *    dataset; `supabase/schema.sql` is the normalized schema for production.
 */
export interface DbShape {
  bookings: Booking[];
  disruptions: Disruption[];
  rescues: RescueProposal[];
  audit: AuditEvent[];
  engagement: { at: string; type: string; props: Record<string, string | number | boolean> }[];
  /** Operator-owned overrides on top of the catalog (capacity, sale open/closed). */
  inventory: Record<string, InventoryOverride>;
}

export interface InventoryOverride {
  capacity?: number;
  open?: boolean;
  updatedAt: string;
}

const empty = (): DbShape => ({ bookings: [], disruptions: [], rescues: [], audit: [], engagement: [], inventory: {} });

function dataFile() {
  if (process.env.VERCEL && !process.env.SHOREMIGO_DATA_DIR) {
    // Refuse to silently lose bookings: Vercel instances don't share a disk.
    throw new Error("DATABASE_URL is required on Vercel (the JSON store is per-instance and non-durable there).");
  }
  const dir = process.env.SHOREMIGO_DATA_DIR || path.join(process.cwd(), ".data");
  return path.join(dir, "db.json");
}

let cache: DbShape | null = null;
let queue: Promise<unknown> = Promise.resolve();

async function load(): Promise<DbShape> {
  if (cache) return cache;
  try {
    cache = { ...empty(), ...JSON.parse(await fs.readFile(dataFile(), "utf8")) };
  } catch {
    cache = empty();
  }
  return cache!;
}

async function persist(db: DbShape) {
  const file = dataFile();
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2));
  await fs.rename(tmp, file);
}

// ───────────── Postgres adapter (DATABASE_URL) ─────────────

type Sql = import("postgres").Sql;
let pg: Promise<Sql> | null = null;

// Hosted preview demos use a separate document/row lock. Production retains the historical row1.
// No schema migration or booking/payment behavior change is needed for this environment boundary.
const STATE_ID = process.env.VERCEL_ENV === "preview" ? 2 : 1;

function postgresEnabled() {
  return Boolean(process.env.DATABASE_URL);
}

function sqlClient(): Promise<Sql> {
  pg ??= (async () => {
    const { default: postgres } = await import("postgres");
    const url = process.env.DATABASE_URL!;
    const local = /@(localhost|127.0.0.1)[:/]/.test(url);
    // prepare:false keeps it compatible with transaction-mode poolers (Supabase :6543).
    const sql = postgres(url, { prepare: false, max: 1, idle_timeout: 20, ssl: local ? false : "require" });
    await sql`create table if not exists shoremigo_state (id int primary key, doc jsonb not null, updated_at timestamptz not null default now())`;
    await sql`insert into shoremigo_state (id, doc) values (${STATE_ID}, ${sql.json(empty() as never)}) on conflict (id) do nothing`;
    return sql;
  })();
  pg.catch(() => (pg = null));
  return pg;
}

async function pgTx<T>(fn: (db: DbShape) => T | Promise<T>): Promise<T> {
  const sql = await sqlClient();
  return sql.begin(async (t) => {
    const [row] = await t`select doc from shoremigo_state where id = ${STATE_ID} for update`;
    const db: DbShape = { ...empty(), ...((row?.doc as Partial<DbShape>) ?? {}) };
    const out = await fn(db);
    await t`update shoremigo_state set doc = ${t.json(db as never)}, updated_at = now() where id = ${STATE_ID}`;
    return out;
  }) as Promise<T>;
}

async function pgRead<T>(fn: (db: DbShape) => T): Promise<T> {
  const sql = await sqlClient();
  const [row] = await sql`select doc from shoremigo_state where id = ${STATE_ID}`;
  return fn({ ...empty(), ...((row?.doc as Partial<DbShape>) ?? {}) });
}

/** Serialized read-modify-write so concurrent requests can't oversell inventory. */
export function tx<T>(fn: (db: DbShape) => T | Promise<T>): Promise<T> {
  if (postgresEnabled()) return pgTx(fn);
  const run = queue.then(async () => {
    const db = await load();
    const out = await fn(db);
    await persist(db);
    return out;
  });
  queue = run.catch(() => undefined);
  return run;
}

export async function read<T>(fn: (db: DbShape) => T): Promise<T> {
  if (postgresEnabled()) return pgRead(fn);
  await queue;
  return fn(await load());
}

/** Test helper. */
export function __resetStoreForTests(db?: DbShape) {
  cache = db ? { ...empty(), ...db } : empty();
  queue = Promise.resolve();
}
