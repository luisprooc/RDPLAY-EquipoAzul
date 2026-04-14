import { Component } from '@angular/core';
import { Router } from '@angular/router';

export type MemoryDifficultyId = 'easy' | 'medium' | 'hard';

@Component({
  selector: 'app-memory-difficulty',
  templateUrl: './memory-difficulty.page.html',
  styleUrls: ['./memory-difficulty.page.scss'],
  standalone: false,
})
export class MemoryDifficultyPage {
  constructor(private readonly router: Router) {}

  start(diff: MemoryDifficultyId): void {
    void this.router.navigate(['/memory/play'], { queryParams: { d: diff } });
  }
}
