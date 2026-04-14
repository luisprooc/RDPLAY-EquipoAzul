import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MemoryDifficultyPage } from './memory-difficulty.page';
import { MemoryPage } from './memory.page';

const routes: Routes = [
  {
    path: '',
    component: MemoryDifficultyPage,
  },
  {
    path: 'play',
    component: MemoryPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MemoryPageRoutingModule {}
