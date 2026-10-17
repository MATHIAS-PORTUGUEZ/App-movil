export class SlotAlreadyBookedError extends Error {
  constructor() {
    super('Ese horario acaba de ser reservado. Elige otro horario.');
    this.name = 'SlotAlreadyBookedError';
  }
}
