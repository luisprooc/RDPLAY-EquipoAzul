import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { QuizDifficultyPage } from './quiz-difficulty.page';
import { QuizPage } from './quiz.page';

const routes: Routes = [
  {
    path: '',
    component: QuizDifficultyPage,
  },
  {
    path: 'play',
    component: QuizPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class QuizPageRoutingModule {}
