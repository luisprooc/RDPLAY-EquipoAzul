import { Component } from '@angular/core';
import { StorageService } from '../core/storage.service';
import { STORAGE_KEYS } from '../core/storage.keys';
import { UserProfileService } from '../core/user-profile.service';

@Component({
  selector: 'app-tab4',
  templateUrl: 'tab4.page.html',
  styleUrls: ['tab4.page.scss'],
  standalone: false,
})
export class Tab4Page {
  displayName = 'Campeón';
  totalPoints = 0;

  constructor(
    private readonly storage: StorageService,
    private readonly userProfile: UserProfileService,
  ) {}

  async ionViewWillEnter(): Promise<void> {
    await this.userProfile.refreshFromStorage();
    this.displayName = this.userProfile.getDisplayName();
    const pts = await this.storage.get(STORAGE_KEYS.TOTAL_POINTS);
    this.totalPoints = pts != null ? Number.parseInt(pts, 10) || 0 : 0;
  }

  async saveName(value: string): Promise<void> {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    await this.userProfile.setDisplayName(trimmed);
    this.displayName = this.userProfile.getDisplayName();
  }
}
