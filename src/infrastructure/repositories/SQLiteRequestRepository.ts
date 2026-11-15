import type { RequestRepository } from '../../domain/repositories/RequestRepository';
import { SlotAlreadyBookedError } from '../../domain/errors/SlotAlreadyBookedError';
import { getLocalDateKey, type RequestForm, type SubmittedRequest } from '../../domain/models';
import { getLocalDatabase } from '../sqliteDatabase';

function normalizeUsername(username: string) {
  return username.trim().toLocaleLowerCase();
}

export class SQLiteRequestRepository implements RequestRepository {
  private writeQueue: Promise<void> = Promise.resolve();

  private runSerialized<T>(operation: () => Promise<T>): Promise<T> {
    const task = this.writeQueue.then(operation);
    this.writeQueue = task.then(() => undefined, () => undefined);
    return task;
  }

  async pruneExpiredRequests() {
    const db = await getLocalDatabase();
    await db.runAsync('DELETE FROM requests WHERE appointment_date < ?', getLocalDateKey());
  }

  async getBookedTimes(date: string) {
    const db = await getLocalDatabase();
    const rows = await db.getAllAsync<{ appointment_time: string }>(
      'SELECT appointment_time FROM requests WHERE appointment_date = ?', date,
    );
    return rows.map((row) => row.appointment_time);
  }

  async getCancelableTimes(date: string, username: string) {
    const db = await getLocalDatabase();
    const rows = await db.getAllAsync<{ appointment_time: string }>(
      'SELECT appointment_time FROM requests WHERE appointment_date = ? AND owner_username = ?',
      date,
      normalizeUsername(username),
    );
    return rows.map((row) => row.appointment_time);
  }

  async getUserRequests(username: string) {
    const db = await getLocalDatabase();
    const rows = await db.getAllAsync<{ payload: string }>(
      'SELECT payload FROM requests WHERE owner_username = ? AND appointment_date >= ? ORDER BY appointment_date, appointment_time',
      normalizeUsername(username),
      getLocalDateKey(),
    );
    return rows.map((row) => JSON.parse(row.payload) as SubmittedRequest);
  }

  async replaceUserRequests(username: string, requests: SubmittedRequest[]) {
    const db = await getLocalDatabase();
    const owner = normalizeUsername(username);
    await db.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.runAsync('DELETE FROM requests WHERE owner_username = ?', owner);
      for (const request of requests) {
        await transaction.runAsync(
          `INSERT OR REPLACE INTO requests (appointment_date, appointment_time, owner_username, payload)
           VALUES (?, ?, ?, ?)`,
          request.appointmentDate,
          request.appointmentTime,
          owner,
          JSON.stringify(request),
        );
      }
    });
  }

  save(request: SubmittedRequest) {
    return this.runSerialized(async () => {
      const db = await getLocalDatabase();
      await db.withExclusiveTransactionAsync(async (transaction) => {
        const existing = await transaction.getFirstAsync<{ appointment_time: string }>(
          'SELECT appointment_time FROM requests WHERE appointment_date = ? AND appointment_time = ?',
          request.appointmentDate,
          request.appointmentTime,
        );
        if (existing) throw new SlotAlreadyBookedError();
        await transaction.runAsync(
          `INSERT INTO requests (appointment_date, appointment_time, owner_username, payload)
           VALUES (?, ?, ?, ?)`,
          request.appointmentDate,
          request.appointmentTime,
          normalizeUsername(request.ownerUsername ?? ''),
          JSON.stringify(request),
        );
      });
    });
  }

  update(date: string, time: string, username: string, request: RequestForm) {
    return this.runSerialized(async () => {
      const db = await getLocalDatabase();
      let updated = false;
      const owner = normalizeUsername(username);
      await db.withExclusiveTransactionAsync(async (transaction) => {
        const row = await transaction.getFirstAsync<{ payload: string }>(
          `SELECT payload FROM requests
           WHERE appointment_date = ? AND appointment_time = ? AND owner_username = ?`,
          date, time, owner,
        );
        if (!row) return;

        const conflict = await transaction.getFirstAsync<{ appointment_time: string }>(
          `SELECT appointment_time FROM requests
           WHERE appointment_date = ? AND appointment_time = ?
             AND NOT (appointment_date = ? AND appointment_time = ?)`,
          request.appointmentDate, request.appointmentTime, date, time,
        );
        if (conflict) throw new SlotAlreadyBookedError();

        const original = JSON.parse(row.payload) as SubmittedRequest;
        const updatedRequest: SubmittedRequest = {
          ...request,
          ownerUsername: original.ownerUsername,
          submittedAt: original.submittedAt,
        };
        await transaction.runAsync(
          `UPDATE requests SET appointment_date = ?, appointment_time = ?, payload = ?
           WHERE appointment_date = ? AND appointment_time = ? AND owner_username = ?`,
          request.appointmentDate,
          request.appointmentTime,
          JSON.stringify(updatedRequest),
          date,
          time,
          owner,
        );
        updated = true;
      });
      return updated;
    });
  }

  cancel(date: string, time: string, username: string) {
    return this.runSerialized(async () => {
      const db = await getLocalDatabase();
      const result = await db.runAsync(
        `DELETE FROM requests
         WHERE appointment_date = ? AND appointment_time = ? AND owner_username = ?`,
        date,
        time,
        normalizeUsername(username),
      );
      return result.changes > 0;
    });
  }
}
