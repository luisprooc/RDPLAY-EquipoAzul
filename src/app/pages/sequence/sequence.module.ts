import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { SequencePageRoutingModule } from './sequence-routing.module';

import { SequencePage } from './sequence.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonicModule,
    SequencePageRoutingModule
  ],
  declarations: [SequencePage]
})
export class SequencePageModule {}
