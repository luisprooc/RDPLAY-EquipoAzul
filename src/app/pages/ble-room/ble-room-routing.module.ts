import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BleRoomPage } from './ble-room.page';

const routes: Routes = [
  {
    path: '',
    component: BleRoomPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BleRoomPageRoutingModule {}
