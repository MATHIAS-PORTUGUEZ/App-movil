import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  runTransaction,
  where,
  type DocumentReference,
} from 'firebase/firestore';
import type { RequestRepository } from '../../domain/repositories/RequestRepository';
import { SlotAlreadyBookedError } from '../../domain/errors/SlotAlreadyBookedError';
import { getLocalDateKey, type RequestForm, type SubmittedRequest } from '../../domain/models';
import { getFirebaseAuth, getFirebaseFirestore } from '../firebase';

function slotId(date: string, time: string) {
  return `${date.replaceAll('-', '')}_${time.replace(':', '')}`;
}

export class FirestoreRequestRepository implements RequestRepository {
  private db() { return getFirebaseFirestore(); }

  private currentUser() {
    const user = getFirebaseAuth().currentUser;
    if (!user) throw new Error('Inicia sesión para consultar o guardar tus citas.');
    return user;
  }

  private appointments(userId: string) {
    return collection(this.db(), 'users', userId, 'appointments');
  }

  private slotReference(date: string, time: string) {
    return doc(this.db(), 'appointmentSlots', slotId(date, time));
  }

  async pruneExpiredRequests() {
    const user = this.currentUser();
    const appointments = await this.getAppointmentDocuments(user.uid);
    const expired = appointments.filter((item) => item.data.appointmentDate < getLocalDateKey());
    for (const item of expired) {
      await runTransaction(this.db(), async (transaction) => {
        const appointment = await transaction.get(item.reference);
        if (!appointment.exists() || appointment.data().ownerUid !== user.uid) return;
        const current = appointment.data() as SubmittedRequest & { slotId?: string };
        const slotRef = current.slotId
          ? doc(this.db(), 'appointmentSlots', current.slotId)
          : this.slotReference(current.appointmentDate, current.appointmentTime);
        const slot = await transaction.get(slotRef);
        if (slot.exists() && slot.data().ownerUid === user.uid) transaction.delete(slotRef);
        transaction.delete(item.reference);
      });
    }
  }

  async getBookedTimes(date: string) {
    this.currentUser();
    const slots = await getDocs(query(
      collection(this.db(), 'appointmentSlots'),
      where('appointmentDate', '==', date),
    ));
    return slots.docs.map((slot) => String(slot.data().appointmentTime));
  }

  async getCancelableTimes(date: string, username: string) {
    const requests = await this.getUserRequests(username);
    return requests.filter((request) => request.appointmentDate === date).map((request) => request.appointmentTime);
  }

  async getUserRequests(_username: string) {
    const user = this.currentUser();
    const documents = await this.getAppointmentDocuments(user.uid);
    return documents.map(({ data }) => ({
      ...data,
      ownerUid: user.uid,
      ownerUsername: typeof data.ownerUsername === 'string' ? data.ownerUsername : user.email ?? '',
    } as SubmittedRequest))
      .sort((left, right) => `${left.appointmentDate} ${left.appointmentTime}`.localeCompare(`${right.appointmentDate} ${right.appointmentTime}`));
  }

  async save(request: SubmittedRequest) {
    const user = this.currentUser();
    const appointmentReference = doc(this.appointments(user.uid));
    const slotReference = this.slotReference(request.appointmentDate, request.appointmentTime);
    const newSlotId = slotId(request.appointmentDate, request.appointmentTime);

    await runTransaction(this.db(), async (transaction) => {
      const slot = await transaction.get(slotReference);
      if (slot.exists()) throw new SlotAlreadyBookedError();
      transaction.set(slotReference, {
        appointmentId: appointmentReference.id,
        appointmentDate: request.appointmentDate,
        appointmentTime: request.appointmentTime,
        ownerUid: user.uid,
      });
      transaction.set(appointmentReference, {
        ...request,
        ownerUid: user.uid,
        ownerUsername: user.email ?? request.ownerUsername ?? '',
        slotId: newSlotId,
      });
    });
  }

  async update(date: string, time: string, _username: string, request: RequestForm) {
    const user = this.currentUser();
    const documents = await this.getAppointmentDocuments(user.uid);
    const current = documents.find((item) =>
      item.data.appointmentDate === date && item.data.appointmentTime === time,
    );
    if (!current) return false;

    const oldSlotId = typeof current.data.slotId === 'string'
      ? current.data.slotId
      : slotId(date, time);
    const newSlotId = slotId(request.appointmentDate, request.appointmentTime);
    const oldSlotReference = doc(this.db(), 'appointmentSlots', oldSlotId);
    const newSlotReference = doc(this.db(), 'appointmentSlots', newSlotId);

    return runTransaction(this.db(), async (transaction) => {
      const appointment = await transaction.get(current.reference);
      if (!appointment.exists() || appointment.data().ownerUid !== user.uid) return false;
      const targetSlot = await transaction.get(newSlotReference);
      const oldSlot = oldSlotId === newSlotId ? targetSlot : await transaction.get(oldSlotReference);
      if (oldSlotId !== newSlotId && targetSlot.exists()) throw new SlotAlreadyBookedError();

      const previous = appointment.data() as SubmittedRequest;
      transaction.set(newSlotReference, {
        appointmentId: current.reference.id,
        appointmentDate: request.appointmentDate,
        appointmentTime: request.appointmentTime,
        ownerUid: user.uid,
      });
      if (oldSlotId !== newSlotId && oldSlot.exists() && oldSlot.data().ownerUid === user.uid) {
        transaction.delete(oldSlotReference);
      }
      transaction.update(current.reference, {
        ...request,
        ownerUid: user.uid,
        ownerUsername: user.email ?? previous.ownerUsername ?? '',
        submittedAt: previous.submittedAt,
        slotId: newSlotId,
      });
      return true;
    });
  }

  async cancel(date: string, time: string, _username: string) {
    const user = this.currentUser();
    const documents = await this.getAppointmentDocuments(user.uid);
    const current = documents.find((item) =>
      item.data.appointmentDate === date && item.data.appointmentTime === time,
    );
    if (!current) return false;

    return runTransaction(this.db(), async (transaction) => {
      const appointment = await transaction.get(current.reference);
      if (!appointment.exists() || appointment.data().ownerUid !== user.uid) return false;
      const currentData = appointment.data() as SubmittedRequest & { slotId?: string };
      const slotReference = currentData.slotId
        ? doc(this.db(), 'appointmentSlots', currentData.slotId)
        : this.slotReference(date, time);
      const slot = await transaction.get(slotReference);
      if (slot.exists() && slot.data().ownerUid === user.uid) transaction.delete(slotReference);
      transaction.delete(current.reference);
      return true;
    });
  }

  private async getAppointmentDocuments(userId: string) {
    const snapshot = await getDocs(this.appointments(userId));
    return snapshot.docs.map((item) => ({
      reference: item.ref as DocumentReference,
      data: item.data() as SubmittedRequest & { slotId?: string },
    }));
  }
}
