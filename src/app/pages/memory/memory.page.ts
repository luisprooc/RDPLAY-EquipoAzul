import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
<<<<<<< Updated upstream
import { StorageService } from '../../core/storage.service';
import { STORAGE_KEYS } from '../../core/storage.keys';
import { MEMORY_PAIR_BANK, MemoryPairDef } from './memory-pairs.data';

const HOME_DELAY_MS = 2800;

const DIFFICULTY_PAIRS: Record<string, number> = {
  easy: 6,
  medium: 12,
  hard: 18,
};

/** Segundos de tiempo inicial según dificultad */
const TIMER_SECONDS: Record<string, number> = {
  easy: 120,
  medium: 240,
  hard: 420,
};
=======
import { Subscription } from 'rxjs';
import { StorageService } from '../../core/storage.service';
import { STORAGE_KEYS } from '../../core/storage.keys';
import { LobbyService, LobbyRoom } from '../../core/lobby.service';
>>>>>>> Stashed changes

type Card = { id: number; key: string; label: string; icon: string; flipped: boolean; matched: boolean };

@Component({
  selector: 'app-memory',
  templateUrl: './memory.page.html',
  styleUrls: ['./memory.page.scss'],
  standalone: false,
})
export class MemoryPage implements OnDestroy {
  pairsFound = 0;
  pairTotal = 8;
  points = 2450;
  timeLabel = '00:00';
  paused = false;
  completed = false;

  /** Clases CSS para el tablero (densidad de columnas). */
  boardClass: Record<string, boolean> = { 'board--easy': true };

  cards: Card[] = [];
  private first: Card | null = null;
  private lock = false;
  private timer: ReturnType<typeof setInterval> | null = null;
  private seconds = 120;
  private homeTimer: ReturnType<typeof setTimeout> | null = null;

<<<<<<< Updated upstream
  constructor(
    private readonly storage: StorageService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  ionViewWillEnter(): void {
    const d = this.route.snapshot.queryParamMap.get('d');
    const n = d ? DIFFICULTY_PAIRS[d] : 0;
    if (!n) {
      void this.router.navigate(['/memory'], { replaceUrl: true });
      return;
    }
    if (n > MEMORY_PAIR_BANK.length) {
      void this.router.navigate(['/memory'], { replaceUrl: true });
      return;
    }

    this.pairTotal = n;
    this.seconds = d && TIMER_SECONDS[d] ? TIMER_SECONDS[d] : 120;
    this.boardClass = {
      'board--easy': d === 'easy',
      'board--medium': d === 'medium',
      'board--hard': d === 'hard',
    };

    void this.bootstrap();
=======
  // Multiplayer state
  roomId: string | null = null;
  room: LobbyRoom | null = null;
  isHost = false;
  waitingPhase = false;
  scoreboardVisible = false;
  scoreboard: { name: string; score: number | null }[] = [];

  private roomSub?: Subscription;

  constructor(
    private readonly storage: StorageService,
    private readonly lobby: LobbyService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ionViewWillEnter(): void {
    this.roomId = this.route.snapshot.queryParamMap.get('roomId');
    if (this.roomId) {
      this.waitingPhase = true;
      this.roomSub = this.lobby.watchRoom(this.roomId).subscribe(room => {
        this.room = room;
        this.isHost = room.hostId === this.lobby.currentPlayerId;
        if (room.status === 'in-progress' && this.waitingPhase) {
          this.waitingPhase = false;
          void this.bootstrap();
        }
        if (room.status === 'finished' || this.allDone(room)) {
          this.showScoreboard(room);
        }
      });
    } else {
      void this.bootstrap();
    }
>>>>>>> Stashed changes
  }

  ionViewWillLeave(): void {
    this.clearTimer();
<<<<<<< Updated upstream
    this.clearHomeTimer();
=======
    this.roomSub?.unsubscribe();
    this.roomSub = undefined;
    this.waitingPhase = false;
    this.scoreboardVisible = false;
>>>>>>> Stashed changes
  }

  ngOnDestroy(): void {
    this.clearTimer();
<<<<<<< Updated upstream
    this.clearHomeTimer();
=======
    this.roomSub?.unsubscribe();
  }

  get roomPlayers(): { id: string; name: string; score: number | null; done: boolean }[] {
    if (!this.room?.players) return [];
    return Object.entries(this.room.players).map(([id, p]) => ({ id, ...p }));
  }

  async startGame(): Promise<void> {
    if (this.roomId) await this.lobby.startRoom(this.roomId);
  }

  async backToLobby(): Promise<void> {
    await this.router.navigate(['/tabs/tab2']);
  }

  private allDone(room: LobbyRoom): boolean {
    if (!room.players) return false;
    const players = Object.values(room.players);
    return players.length > 0 && players.every(p => p.done);
  }

  private showScoreboard(room: LobbyRoom): void {
    if (this.scoreboardVisible) return;
    this.clearTimer();
    this.scoreboard = Object.values(room.players ?? {})
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    this.scoreboardVisible = true;
>>>>>>> Stashed changes
  }

  private async bootstrap(): Promise<void> {
    this.completed = false;
    const raw = await this.storage.get(STORAGE_KEYS.TOTAL_POINTS);
    if (raw != null) {
      const n = Number.parseInt(raw, 10);
      if (!Number.isNaN(n)) this.points = Math.max(this.points, n);
    }
    this.resetBoard();
    this.startTimer();
  }

  private startTimer(): void {
    if (this.completed) {
      return;
    }
    this.clearTimer();
    this.updateTimeLabel();
    this.timer = setInterval(() => {
<<<<<<< Updated upstream
      if (this.completed) {
        this.clearTimer();
        return;
      }
      if (this.paused) {
        return;
      }
=======
      if (this.paused) return;
>>>>>>> Stashed changes
      this.seconds -= 1;
      if (this.seconds <= 0) {
        this.seconds = 0;
        this.clearTimer();
        if (this.roomId) void this.lobby.submitScore(this.roomId, this.points);
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

  private updateTimeLabel(): void {
    const m = Math.floor(this.seconds / 60);
    const s = this.seconds % 60;
    this.timeLabel = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  private resetBoard(): void {
    const picked = this.pickRandomPairs(this.pairTotal);
    const deck: Card[] = [];
    let id = 0;
    for (const p of picked) {
      deck.push({ id: id++, ...p, flipped: false, matched: false });
      deck.push({ id: id++, ...p, flipped: false, matched: false });
    }
    this.shuffle(deck);
    this.cards = deck;
    this.pairsFound = 0;
    this.first = null;
    this.lock = false;
  }

  /** Elige `count` pares distintos al azar del banco. */
  private pickRandomPairs(count: number): MemoryPairDef[] {
    const copy = [...MEMORY_PAIR_BANK];
    this.shuffle(copy);
    return copy.slice(0, count);
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
    this.completed = false;
    this.clearHomeTimer();
    const d = this.route.snapshot.queryParamMap.get('d');
    this.seconds = d && TIMER_SECONDS[d] ? TIMER_SECONDS[d] : 120;
    this.resetBoard();
    this.startTimer();
    await this.storage.setJson(STORAGE_KEYS.MEMORY, { pairs: this.pairsFound });
  }

  async onCardTap(card: Card): Promise<void> {
    if (this.lock || this.paused || card.matched || card.flipped) return;
    card.flipped = true;
    if (!this.first) {
      this.first = card;
      return;
    }
    if (this.first.id === card.id) return;
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
<<<<<<< Updated upstream
      if (this.pairsFound >= this.pairTotal) {
        this.completed = true;
        this.clearTimer();
        this.goHomeAfterDelay();
=======
      if (this.pairsFound === this.pairTotal && this.roomId) {
        this.clearTimer();
        await this.lobby.submitScore(this.roomId, this.points);
>>>>>>> Stashed changes
      }
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
