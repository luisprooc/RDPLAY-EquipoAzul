import { Component } from '@angular/core';
import { StorageService } from '../core/storage.service';
import { STORAGE_KEYS } from '../core/storage.keys';

@Component({
  selector: 'app-tab4',
  templateUrl: 'tab4.page.html',
  styleUrls: ['tab4.page.scss'],
  standalone: false,
})
export class Tab4Page {
  displayName = 'Campeón';
  totalPoints = 0;

  constructor(private readonly storage: StorageService) {}

  async ionViewWillEnter(): Promise<void> {
    const name = await this.storage.get(STORAGE_KEYS.DISPLAY_NAME);
    if (name) {
      this.displayName = name;
    }
    const pts = await this.storage.get(STORAGE_KEYS.TOTAL_POINTS);
    this.totalPoints = pts != null ? Number.parseInt(pts, 10) || 0 : 0;
  }

  async saveName(value: string): Promise<void> {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    this.displayName = trimmed;
    await this.storage.set(STORAGE_KEYS.DISPLAY_NAME, trimmed);
  }
}
