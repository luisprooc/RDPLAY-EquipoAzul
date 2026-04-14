import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { StorageService } from '../core/storage.service';
import { STORAGE_KEYS } from '../core/storage.keys';
import { UserProfileService } from '../core/user-profile.service';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page implements OnDestroy {
  totalPoints = 0;
  achievementsUnlocked = 8;
  achievementsTotal = 12;
  greetingName = 'Campeón';

  private nameSub?: Subscription;

  constructor(
    private readonly storage: StorageService,
    private readonly userProfile: UserProfileService,
  ) {
    this.nameSub = this.userProfile.getDisplayNameStream().subscribe((n) => {
      this.greetingName = n;
    });
  }

  ngOnDestroy(): void {
    this.nameSub?.unsubscribe();
  }

  async ionViewWillEnter(): Promise<void> {
    await this.userProfile.refreshFromStorage();
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
