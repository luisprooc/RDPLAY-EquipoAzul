import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from '../../core/storage.service';
import { STORAGE_KEYS } from '../../core/storage.keys';
import {
  SEQUENCE_SCENARIOS,
  SequenceScenarioDef,
  SequenceStepDef,
  shuffleSequenceSteps,
} from './sequence-scenarios.data';

const HOME_DELAY_MS = 2800;

@Component({
  selector: 'app-sequence',
  templateUrl: './sequence.page.html',
  styleUrls: ['./sequence.page.scss'],
  standalone: false,
})
export class SequencePage implements OnDestroy {
  scenario: SequenceScenarioDef = SEQUENCE_SCENARIOS[0];
  shuffledBank: SequenceStepDef[] = shuffleSequenceSteps(SEQUENCE_SCENARIOS[0].steps);

  slots: (string | null)[] = Array(SEQUENCE_SCENARIOS[0].correctOrder.length).fill(null);
  placedCount = 0;

  draggingId: string | null = null;
  selectedId: string | null = null;

  verifyState: 'idle' | 'ok' | 'bad' = 'idle';

  bonusPoints = 150;
  completed = false;

  private homeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly storage: StorageService,
    private readonly router: Router,
  ) {
    this.applyScenario(SEQUENCE_SCENARIOS[Math.floor(Math.random() * SEQUENCE_SCENARIOS.length)]);
  }

  get slotCount(): number {
    return this.scenario.correctOrder.length;
  }

  ionViewWillEnter(): void {
    this.completed = false;
    this.verifyState = 'idle';
    this.clearHomeTimer();
    const picked = SEQUENCE_SCENARIOS[Math.floor(Math.random() * SEQUENCE_SCENARIOS.length)];
    this.applyScenario(picked);
    void this.hydrate();
  }

  ionViewWillLeave(): void {
    this.clearHomeTimer();
  }

  ngOnDestroy(): void {
    this.clearHomeTimer();
  }

  private applyScenario(s: SequenceScenarioDef): void {
    this.scenario = s;
    this.bonusPoints = s.bonusPoints;
    this.shuffledBank = shuffleSequenceSteps(s.steps);
    this.slots = Array(s.correctOrder.length).fill(null);
    this.selectedId = null;
    this.draggingId = null;
    this.placedCount = 0;
  }

  private clearHomeTimer(): void {
    if (this.homeTimer) {
      clearTimeout(this.homeTimer);
      this.homeTimer = null;
    }
  }

  private goHomeAfterDelay(): void {
    this.clearHomeTimer();
    this.homeTimer = setTimeout(() => {
      void this.router.navigateByUrl('/tabs/tab1', { replaceUrl: true });
    }, HOME_DELAY_MS);
  }

  private async hydrate(): Promise<void> {
    const saved = await this.storage.getJson<{
      scenarioId?: string;
      slots?: (string | null)[];
    }>(STORAGE_KEYS.SEQUENCE);
    const n = this.slotCount;
    if (
      saved?.scenarioId === this.scenario.id &&
      Array.isArray(saved.slots) &&
      saved.slots.length === n
    ) {
      this.slots = saved.slots;
      this.recount();
    }
  }

  private async persist(): Promise<void> {
    await this.storage.setJson(STORAGE_KEYS.SEQUENCE, {
      scenarioId: this.scenario.id,
      slots: this.slots,
    });
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
    return this.scenario.steps.find((b) => b.id === id)?.title ?? id;
  }

  async verify(): Promise<void> {
    const order = this.scenario.correctOrder;
    const ok = this.slots.every((v, i) => v === order[i]);
    this.verifyState = ok ? 'ok' : 'bad';
    if (ok) {
      this.completed = true;
      const raw = await this.storage.get(STORAGE_KEYS.TOTAL_POINTS);
      const prev = raw != null ? Number.parseInt(raw, 10) || 0 : 0;
      await this.storage.set(STORAGE_KEYS.TOTAL_POINTS, String(prev + this.bonusPoints));
      await this.storage.set(STORAGE_KEYS.ACHIEVEMENTS, '9');
      this.goHomeAfterDelay();
    }
  }
}
