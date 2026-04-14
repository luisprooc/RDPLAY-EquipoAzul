import { Component } from '@angular/core';
import { Router } from '@angular/router';

export type QuizDifficultyId = 'easy' | 'medium' | 'hard';

@Component({
  selector: 'app-quiz-difficulty',
  templateUrl: './quiz-difficulty.page.html',
  styleUrls: ['./quiz-difficulty.page.scss'],
  standalone: false,
})
export class QuizDifficultyPage {
  constructor(private readonly router: Router) {}

  start(diff: QuizDifficultyId): void {
    void this.router.navigate(['/quiz/play'], { queryParams: { d: diff } });
  }
}
