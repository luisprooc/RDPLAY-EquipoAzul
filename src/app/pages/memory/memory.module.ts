import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { MemoryPageRoutingModule } from './memory-routing.module';

import { MemoryPage } from './memory.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonicModule,
    MemoryPageRoutingModule
  ],
  declarations: [MemoryPage]
})
export class MemoryPageModule {}
