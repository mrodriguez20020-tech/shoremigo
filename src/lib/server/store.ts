import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { AuditEvent, Booking, Disruption, RescueProposal } from "@/lib/domain/types";

/**
 * Persistence boundary. The default adapter is a JSON file (local dev / single
 * instance demo). `supabase/schema.sql` mirrors this shape for the Postgres
 * adapter; swap by implementing `Store` against Supabase.
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
  const dir = process.env.SHOREMIGO_DATA_DIR || (process.env.VERCEL ? "/tmp/shoremigo" : path.join(process.cwd(), ".data"));
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

/** Serialized read-modify-write so concurrent requests can't oversell inventory. */
export function tx<T>(fn: (db: DbShape) => T | Promise<T>): Promise<T> {
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
  await queue;
  return fn(await load());
}

/** Test helper. */
export function __resetStoreForTests(db?: DbShape) {
  cache = db ? { ...empty(), ...db } : empty();
  queue = Promise.resolve();
}
