import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { BtRoomPage } from './bt-room.page';
import { BtRoomPageRoutingModule } from './bt-room-routing.module';

@NgModule({
  imports: [CommonModule, IonicModule, BtRoomPageRoutingModule],
  declarations: [BtRoomPage],
})
export class BtRoomPageModule {}
