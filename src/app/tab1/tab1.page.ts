import { Component } from '@angular/core';
import { StorageService } from '../core/storage.service';
import { STORAGE_KEYS } from '../core/storage.keys';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page {
  totalPoints = 0;
  achievementsUnlocked = 8;
  achievementsTotal = 12;

  constructor(private readonly storage: StorageService) {}

  async ionViewWillEnter(): Promise<void> {
    const raw = await this.storage.get(STORAGE_KEYS.TOTAL_POINTS);
    this.totalPoints = raw != null ? Number.parseInt(raw, 10) || 0 : 0;
    const ach = await this.storage.get(STORAGE_KEYS.ACHIEVEMENTS);
    if (ach != null) {
      const n = Number.parseInt(ach, 10);
      if (!Number.isNaN(n)) {
        this.achievementsUnlocked = n;
      }
    }
  }
}
