import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { RankingPage } from './ranking.page';

const routes: Routes = [
  { path: '', component: RankingPage }
];

@NgModule({
  declarations: [RankingPage],
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild(routes)
  ]
})
export class RankingPageModule {}
