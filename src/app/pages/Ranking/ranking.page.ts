import { Component, OnInit } from '@angular/core';
import { LeaderboardEntry, RankingService } from '../../core/ranking.service';
import { StorageService } from '../../core/storage.service';
import { STORAGE_KEYS } from '../../core/storage.keys';

@Component({
  selector: 'app-ranking',
  templateUrl: './ranking.page.html',
  styleUrls: ['./ranking.page.scss'],
  standalone: false,
})
export class RankingPage implements OnInit {
  entries: LeaderboardEntry[] = [];
  isLoading = true;
  myDisplayName = '';
  myTotalPoints = 0;

  constructor(
    private rankingService: RankingService,
    private storage: StorageService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadLocalSummary();
    await this.load();
  }

  private async loadLocalSummary(): Promise<void> {
    this.myDisplayName = (await this.storage.get(STORAGE_KEYS.DISPLAY_NAME))?.trim() || 'Jugador';
    const raw = await this.storage.get(STORAGE_KEYS.TOTAL_POINTS);
    this.myTotalPoints = raw != null ? Number.parseInt(raw, 10) || 0 : 0;
  }

  async load(): Promise<void> {
    this.isLoading = true;
    await this.rankingService.syncMyEntry();
    await this.loadLocalSummary();
    this.entries = await this.rankingService.getGlobalLeaderboard(50);
    this.isLoading = false;
  }

  getMedal(index: number): string {
    return ['🥇', '🥈', '🥉'][index] ?? `${index + 1}.`;
  }

  /** Fecha amigable bajo el nombre en la lista. */
  updatedLabel(entry: LeaderboardEntry): string {
    const u = entry.updatedAt as { toDate?: () => Date } | undefined;
    if (u && typeof u.toDate === 'function') {
      const d = u.toDate();
      return `Última vez: ${d.toLocaleString('es-DO', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    }
    return '';
  }
}
