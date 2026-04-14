import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StorageService } from '../../core/storage.service';
import { STORAGE_KEYS } from '../../core/storage.keys';
import { LobbyService } from '../../core/lobby.service';
import { QuizQuestion } from './quiz-question.model';
import { QUIZ_QUESTION_BANK } from './quiz-questions.data';
import { pickRandomQuestions } from './quiz-utils';

const HOME_DELAY_MS = 2800;

const DIFFICULTY_COUNTS: Record<string, number> = {
  easy: 3,
  medium: 8,
  hard: 12,
};

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.page.html',
  styleUrls: ['./quiz.page.scss'],
  standalone: false,
})
export class QuizPage implements OnDestroy {
  questions: QuizQuestion[] = [];

  index = 0;
  score = 0;
  secondsLeft = 12;
  selected: number | null = null;
  revealed = false;
  finished = false;

  private timer: ReturnType<typeof setInterval> | null = null;
  private homeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly storage: StorageService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly lobby: LobbyService,
  ) {}

  ionViewWillEnter(): void {
    const d = this.route.snapshot.queryParamMap.get('d');
    const room = this.route.snapshot.queryParamMap.get('room');
    const total = d ? DIFFICULTY_COUNTS[d] : 0;
    if (!total) {
      void this.router.navigate(['/quiz'], {
        queryParams: room ? { room } : {},
        replaceUrl: true,
      });
      return;
    }

    this.finished = false;
    this.index = 0;
    this.score = 0;
    this.selected = null;
    this.revealed = false;
    this.questions = pickRandomQuestions(QUIZ_QUESTION_BANK, total);
    if (this.questions.length === 0) {
      void this.router.navigate(['/quiz'], {
        queryParams: room ? { room } : {},
        replaceUrl: true,
      });
      return;
    }
    this.startQuestion();
  }

  ionViewWillLeave(): void {
    this.clearTimer();
    this.clearHomeTimer();
  }

  ngOnDestroy(): void {
    this.clearTimer();
    this.clearHomeTimer();
  }

  get progress(): number {
    if (this.questions.length === 0) {
      return 0;
    }
    return (this.index + 1) / this.questions.length;
  }

  get current(): QuizQuestion {
    return this.questions[this.index];
  }

  private async persistRoundState(): Promise<void> {
    await this.storage.setJson(STORAGE_KEYS.QUIZ, { index: this.index, score: this.score });
  }

  private async addToTotal(points: number): Promise<void> {
    if (points <= 0) {
      return;
    }
    const raw = await this.storage.get(STORAGE_KEYS.TOTAL_POINTS);
    const prev = raw != null ? Number.parseInt(raw, 10) || 0 : 0;
    await this.storage.set(STORAGE_KEYS.TOTAL_POINTS, String(prev + points));
  }

  private startQuestion(): void {
    if (this.finished || this.questions.length === 0) {
      return;
    }
    this.clearTimer();
    this.secondsLeft = 12;
    this.selected = null;
    this.revealed = false;
    this.timer = setInterval(() => {
      if (this.finished) {
        this.clearTimer();
        return;
      }
      this.secondsLeft -= 1;
      if (this.secondsLeft <= 0) {
        void this.onPick(null);
      }
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
      void this.afterRoundFinished();
    }, HOME_DELAY_MS);
  }

  private async afterRoundFinished(): Promise<void> {
    const roomId = this.route.snapshot.queryParamMap.get('room');
    if (roomId) {
      try {
        await this.lobby.reportPlayerFinishedRound(roomId);
      } catch {
        /* sin red o sala ya cerrada */
      }
      await this.router.navigate(['/bt-room', roomId], { replaceUrl: true });
      return;
    }
    await this.router.navigateByUrl('/tabs/tab1', { replaceUrl: true });
  }

  async onPick(optionIndex: number | null): Promise<void> {
    if (this.revealed || this.finished || this.questions.length === 0) {
      return;
    }
    this.clearTimer();
    this.revealed = true;
    this.selected = optionIndex;

    const correct = this.current.correctIndex;
    let earned = 0;
    if (optionIndex === correct) {
      const speedBonus = this.secondsLeft >= 7 ? 50 : 0;
      earned = 100 + speedBonus;
      this.score += earned;
    }

    await this.addToTotal(earned);
    await this.persistRoundState();

    const isLast = this.index >= this.questions.length - 1;
    if (isLast) {
      this.finished = true;
      await this.storage.setJson(STORAGE_KEYS.QUIZ, { index: 0, score: 0 });
      this.goHomeAfterDelay();
      return;
    }

    setTimeout(() => {
      this.index += 1;
      this.startQuestion();
    }, 1600);
  }
}
