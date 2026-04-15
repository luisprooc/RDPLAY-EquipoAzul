import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { BleRoomPage } from './ble-room.page';
import { BleRoomPageRoutingModule } from './ble-room-routing.module';

@NgModule({
  imports: [CommonModule, IonicModule, BleRoomPageRoutingModule],
  declarations: [BleRoomPage],
})
export class BleRoomPageModule {}
