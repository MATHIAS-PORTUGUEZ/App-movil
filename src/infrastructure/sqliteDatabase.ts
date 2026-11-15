import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import type { CatalogItem, SubmittedRequest, UserProfile } from '../domain/models';

const DATABASE_NAME = 'barberia-local.db';
const LEGACY_REQUESTS_KEY = 'barber-shop.requests.v1';
const LEGACY_PROFILES_KEY = 'barber-shop.profiles.v1';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseLegacyArray<T>(value: string | null, label: string): T[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed as T[];
  } catch {
    // Keep the original legacy value so that a future app version can recover it.
  }
  throw new Error(`No se pudieron migrar los datos locales de ${label}.`);
}

async function initializeDatabase() {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS requests (
      appointment_date TEXT NOT NULL,
      appointment_time TEXT NOT NULL,
      owner_username TEXT NOT NULL DEFAULT '',
      payload TEXT NOT NULL,
      PRIMARY KEY (appointment_date, appointment_time)
    );
    CREATE INDEX IF NOT EXISTS requests_owner_idx ON requests(owner_username);
    CREATE TABLE IF NOT EXISTS profiles (
      username TEXT PRIMARY KEY NOT NULL,
      payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS catalog_items (
      kind TEXT NOT NULL,
      id TEXT NOT NULL,
      name TEXT NOT NULL,
      payload TEXT NOT NULL,
      PRIMARY KEY (kind, id)
    );
    CREATE TABLE IF NOT EXISTS local_migrations (
      id TEXT PRIMARY KEY NOT NULL
    );
  `);

  const migration = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM local_migrations WHERE id = ?',
    'async-storage-v1',
  );
  if (!migration) {
    const [legacyRequests, legacyProfiles] = await Promise.all([
      AsyncStorage.getItem(LEGACY_REQUESTS_KEY),
      AsyncStorage.getItem(LEGACY_PROFILES_KEY),
    ]);
    const requests = parseLegacyArray<SubmittedRequest>(legacyRequests, 'las reservas');
    const profiles = parseLegacyArray<UserProfile>(legacyProfiles, 'los perfiles');

    await db.withExclusiveTransactionAsync(async (transaction) => {
      for (const request of requests) {
        if (!isObject(request) || typeof request.appointmentDate !== 'string' ||
            typeof request.appointmentTime !== 'string') continue;
        await transaction.runAsync(
          `INSERT OR IGNORE INTO requests (appointment_date, appointment_time, owner_username, payload)
           VALUES (?, ?, ?, ?)`,
          request.appointmentDate,
          request.appointmentTime,
          typeof request.ownerUsername === 'string' ? request.ownerUsername.toLocaleLowerCase() : '',
          JSON.stringify(request),
        );
      }
      for (const profile of profiles) {
        if (!isObject(profile) || typeof profile.username !== 'string') continue;
        await transaction.runAsync(
          'INSERT OR REPLACE INTO profiles (username, payload) VALUES (?, ?)',
          profile.username.toLocaleLowerCase(),
          JSON.stringify(profile),
        );
      }
      await transaction.runAsync('INSERT INTO local_migrations (id) VALUES (?)', 'async-storage-v1');
    });
    await Promise.all([
      AsyncStorage.removeItem(LEGACY_REQUESTS_KEY),
      AsyncStorage.removeItem(LEGACY_PROFILES_KEY),
    ]);
  }
  return db;
}

export function getLocalDatabase() {
  if (!databasePromise) databasePromise = initializeDatabase().catch((error: unknown) => {
    databasePromise = null;
    throw error;
  });
  return databasePromise;
}

export async function readCatalogCache(kind: string): Promise<CatalogItem[]> {
  const db = await getLocalDatabase();
  const rows = await db.getAllAsync<{ payload: string }>(
    'SELECT payload FROM catalog_items WHERE kind = ? ORDER BY name COLLATE NOCASE',
    kind,
  );
  return rows.map((row) => JSON.parse(row.payload) as CatalogItem);
}

export async function replaceCatalogCache(kind: string, items: CatalogItem[]) {
  const db = await getLocalDatabase();
  await db.withExclusiveTransactionAsync(async (transaction) => {
    await transaction.runAsync('DELETE FROM catalog_items WHERE kind = ?', kind);
    for (const item of items) {
      await transaction.runAsync(
        'INSERT INTO catalog_items (kind, id, name, payload) VALUES (?, ?, ?, ?)',
        kind,
        item.id,
        item.name,
        JSON.stringify(item),
      );
    }
  });
}
