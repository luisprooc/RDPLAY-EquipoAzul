import { Component, OnDestroy } from '@angular/core';
import { StorageService } from '../../core/storage.service';
import { STORAGE_KEYS } from '../../core/storage.keys';

type QuizQuestion = {
  prompt: string;
  options: string[];
  correctIndex: number;
  fact: string;
};

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.page.html',
  styleUrls: ['./quiz.page.scss'],
  standalone: false,
})
export class QuizPage implements OnDestroy {
  readonly questions: QuizQuestion[] = [
    {
      prompt: '¿Cuál es el baile nacional de RD?',
      options: ['Bachata', 'Merengue', 'Salsa', 'Son'],
      correctIndex: 1,
      fact: 'El Merengue fue declarado Patrimonio Cultural de la Humanidad por la UNESCO en 2016.',
    },
    {
      prompt: '¿Cuál es la flor nacional?',
      options: ['Rosa', 'Flor de Bayahibe', 'Caoba', 'Orquídea'],
      correctIndex: 1,
      fact: 'La Rosa de Bayahibe es endémica de la región este.',
    },
    {
      prompt: '¿En qué año llegó el café a la isla (aprox.)?',
      options: ['1492', '1735', '1821', '1844'],
      correctIndex: 1,
      fact: 'El café se cultivó en Santo Domingo desde el siglo XVIII.',
    },
  ];

  index = 0;
  score = 0;
  secondsLeft = 12;
  selected: number | null = null;
  revealed = false;

  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly storage: StorageService) {}

  ionViewWillEnter(): void {
    void this.hydrate();
    this.startQuestion();
  }

  ionViewWillLeave(): void {
    this.clearTimer();
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  get progress(): number {
    return (this.index + 1) / this.questions.length;
  }

  get current(): QuizQuestion {
    return this.questions[this.index];
  }

  private async hydrate(): Promise<void> {
    const saved = await this.storage.getJson<{ index: number; score: number }>(STORAGE_KEYS.QUIZ);
    if (saved) {
      this.index = Math.min(Math.max(saved.index, 0), this.questions.length - 1);
      this.score = saved.score;
    }
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
    this.clearTimer();
    this.secondsLeft = 12;
    this.selected = null;
    this.revealed = false;
    this.timer = setInterval(() => {
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

  async onPick(optionIndex: number | null): Promise<void> {
    if (this.revealed) {
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

    setTimeout(async () => {
      if (this.index >= this.questions.length - 1) {
        await this.storage.setJson(STORAGE_KEYS.QUIZ, { index: 0, score: 0 });
        this.index = 0;
        this.score = 0;
      } else {
        this.index += 1;
      }
      this.startQuestion();
    }, 1600);
  }
}
