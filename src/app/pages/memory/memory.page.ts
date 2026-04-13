import { Component } from '@angular/core';
import { StorageService } from '../../core/storage.service';
import { STORAGE_KEYS } from '../../core/storage.keys';

type Card = { id: number; key: string; label: string; icon: string; flipped: boolean; matched: boolean };

@Component({
  selector: 'app-memory',
  templateUrl: './memory.page.html',
  styleUrls: ['./memory.page.scss'],
  standalone: false,
})
export class MemoryPage {
  pairsFound = 0;
  readonly pairTotal = 8;
  points = 2450;
  timeLabel = '01:45';
  paused = false;

  cards: Card[] = [];
  private first: Card | null = null;
  private lock = false;
  private timer: ReturnType<typeof setInterval> | null = null;
  private seconds = 105;

  constructor(private readonly storage: StorageService) {}

  ionViewWillEnter(): void {
    void this.bootstrap();
  }

  ionViewWillLeave(): void {
    this.clearTimer();
  }

  private async bootstrap(): Promise<void> {
    const raw = await this.storage.get(STORAGE_KEYS.TOTAL_POINTS);
    if (raw != null) {
      const n = Number.parseInt(raw, 10);
      if (!Number.isNaN(n)) {
        this.points = Math.max(this.points, n);
      }
    }
    this.resetBoard();
    this.startTimer();
  }

  private startTimer(): void {
    this.clearTimer();
    this.seconds = 105;
    this.updateTimeLabel();
    this.timer = setInterval(() => {
      if (this.paused) {
        return;
      }
      this.seconds -= 1;
      if (this.seconds <= 0) {
        this.seconds = 0;
        this.clearTimer();
      }
      this.updateTimeLabel();
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private updateTimeLabel(): void {
    const m = Math.floor(this.seconds / 60);
    const s = this.seconds % 60;
    this.timeLabel = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  private resetBoard(): void {
    const pairDefs = [
      { key: 'mangu', label: 'MANGÚ', icon: '🍽️' },
      { key: 'guira', label: 'GÜIRA', icon: '🎵' },
      { key: 'palma', label: 'PALMA', icon: '🌴' },
      { key: 'tambora', label: 'TAMBORA', icon: '🥁' },
      { key: 'playa', label: 'PLAYA', icon: '🏖️' },
      { key: 'flor', label: 'FLOR', icon: '🌺' },
      { key: 'chimi', label: 'CHIMI', icon: '🍔' },
      { key: 'merengue', label: 'MERENGUE', icon: '💃' },
    ];

    const deck: Card[] = [];
    let id = 0;
    for (const p of pairDefs) {
      deck.push({ id: id++, ...p, flipped: false, matched: false });
      deck.push({ id: id++, ...p, flipped: false, matched: false });
    }
    this.shuffle(deck);
    this.cards = deck;
    this.pairsFound = 0;
    this.first = null;
    this.lock = false;
  }

  private shuffle<T>(arr: T[]): void {
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  togglePause(): void {
    this.paused = !this.paused;
  }

  async restart(): Promise<void> {
    this.resetBoard();
    this.startTimer();
    await this.storage.setJson(STORAGE_KEYS.MEMORY, { pairs: this.pairsFound });
  }

  async onCardTap(card: Card): Promise<void> {
    if (this.lock || this.paused || card.matched || card.flipped) {
      return;
    }
    card.flipped = true;
    if (!this.first) {
      this.first = card;
      return;
    }
    if (this.first.id === card.id) {
      return;
    }
    this.lock = true;
    const a = this.first;
    const b = card;
    this.first = null;
    if (a.key === b.key) {
      a.matched = true;
      b.matched = true;
      this.pairsFound += 1;
      this.points += 120;
      await this.persistPoints();
      this.lock = false;
      return;
    }
    setTimeout(() => {
      a.flipped = false;
      b.flipped = false;
      this.lock = false;
    }, 900);
  }

  private async persistPoints(): Promise<void> {
    await this.storage.set(STORAGE_KEYS.TOTAL_POINTS, String(this.points));
    await this.storage.setJson(STORAGE_KEYS.MEMORY, { pairs: this.pairsFound, at: Date.now() });
  }
}
