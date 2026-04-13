import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MemoryPage } from './memory.page';

const routes: Routes = [
  {
    path: '',
    component: MemoryPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MemoryPageRoutingModule {}
