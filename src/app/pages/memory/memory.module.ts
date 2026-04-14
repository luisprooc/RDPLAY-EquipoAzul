import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { MemoryPageRoutingModule } from './memory-routing.module';

import { MemoryDifficultyPage } from './memory-difficulty.page';
import { MemoryPage } from './memory.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonicModule,
    MemoryPageRoutingModule
  ],
  declarations: [MemoryDifficultyPage, MemoryPage]
})
export class MemoryPageModule {}
