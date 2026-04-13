import { Component } from '@angular/core';
import { StorageService } from '../../core/storage.service';
import { STORAGE_KEYS } from '../../core/storage.keys';

type Step = { id: string; title: string; hint: string };

@Component({
  selector: 'app-sequence',
  templateUrl: './sequence.page.html',
  styleUrls: ['./sequence.page.scss'],
  standalone: false,
})
export class SequencePage {
  readonly bank: Step[] = [
    { id: 'molido', title: 'Molido', hint: 'Líneas marrones' },
    { id: 'grano', title: 'Grano', hint: 'En la mata' },
    { id: 'taza', title: 'Taza', hint: 'Listo para beber' },
    { id: 'tostado', title: 'Tostado', hint: 'Fuego y aroma' },
  ];

  /** Orden correcto: grano → tostado → molido → taza */
  readonly correctOrder = ['grano', 'tostado', 'molido', 'taza'];

  slots: (string | null)[] = [null, null, null, null];
  placedCount = 0;

  draggingId: string | null = null;
  selectedId: string | null = null;

  verifyState: 'idle' | 'ok' | 'bad' = 'idle';

  bonusPoints = 150;

  constructor(private readonly storage: StorageService) {}

  ionViewWillEnter(): void {
    void this.hydrate();
  }

  private async hydrate(): Promise<void> {
    const saved = await this.storage.getJson<{ slots: (string | null)[] }>(STORAGE_KEYS.SEQUENCE);
    if (saved?.slots?.length === 4) {
      this.slots = saved.slots;
      this.recount();
    }
  }

  private async persist(): Promise<void> {
    await this.storage.setJson(STORAGE_KEYS.SEQUENCE, { slots: this.slots });
  }

  private recount(): void {
    this.placedCount = this.slots.filter(Boolean).length;
  }

  isInBank(id: string): boolean {
    return !this.slots.includes(id);
  }

  pickFromBank(id: string): void {
    if (!this.isInBank(id)) {
      return;
    }
    this.selectedId = this.selectedId === id ? null : id;
    this.verifyState = 'idle';
  }

  tapSlot(index: number): void {
    if (this.selectedId) {
      if (this.slots[index] === null) {
        this.slots[index] = this.selectedId;
        this.selectedId = null;
        this.recount();
        void this.persist();
      }
      return;
    }
    if (this.slots[index]) {
      this.slots[index] = null;
      this.recount();
      void this.persist();
    }
  }

  onDragStart(id: string): void {
    this.draggingId = id;
    this.verifyState = 'idle';
  }

  onDragEnd(): void {
    this.draggingId = null;
  }

  onDragStartEvent(ev: DragEvent, id: string): void {
    this.onDragStart(id);
    ev.dataTransfer?.setData('text/plain', id);
  }

  onDragOver(ev: DragEvent): void {
    ev.preventDefault();
  }

  async onDrop(index: number, ev: DragEvent): Promise<void> {
    ev.preventDefault();
    const id = this.draggingId ?? (ev.dataTransfer?.getData('text/plain') || null);
    if (!id || !this.isInBank(id)) {
      return;
    }
    if (this.slots[index] !== null) {
      return;
    }
    this.slots[index] = id;
    this.recount();
    await this.persist();
  }

  labelFor(id: string | null): string {
    if (!id) {
      return '';
    }
    return this.bank.find((b) => b.id === id)?.title ?? id;
  }

  async verify(): Promise<void> {
    const ok = this.slots.every((v, i) => v === this.correctOrder[i]);
    this.verifyState = ok ? 'ok' : 'bad';
    if (ok) {
      const raw = await this.storage.get(STORAGE_KEYS.TOTAL_POINTS);
      const prev = raw != null ? Number.parseInt(raw, 10) || 0 : 0;
      await this.storage.set(STORAGE_KEYS.TOTAL_POINTS, String(prev + this.bonusPoints));
      await this.storage.set(STORAGE_KEYS.ACHIEVEMENTS, '9');
    }
  }
}
