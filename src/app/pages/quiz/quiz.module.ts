import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { QuizPageRoutingModule } from './quiz-routing.module';

import { QuizDifficultyPage } from './quiz-difficulty.page';
import { QuizPage } from './quiz.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonicModule,
    QuizPageRoutingModule
  ],
  declarations: [QuizDifficultyPage, QuizPage]
})
export class QuizPageModule {}
