import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BtRoomPage } from './bt-room.page';

const routes: Routes = [
  {
    path: '',
    component: BtRoomPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BtRoomPageRoutingModule {}
