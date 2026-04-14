import { Component, OnInit } from '@angular/core';
import { RankingService, RankingEntry } from '../../core/ranking.service';
import { StorageService } from '../../core/storage.service';

@Component({
  selector: 'app-ranking',
  templateUrl: './ranking.page.html',
  styleUrls: ['./ranking.page.scss'],
  standalone: false,
})
export class RankingPage implements OnInit {
  scores: RankingEntry[] = [];
  selectedGame: string = 'all';
  isLoading = true;
  playerName = '';

  games = [
    { value: 'all',      label: '🏆 Global'   },
    { value: 'quiz',     label: '❓ Quiz'      },
    { value: 'memory',   label: '🧠 Memoria'   },
    { value: 'sequence', label: '☕ Secuencia'  },
  ];

  constructor(
    private rankingService: RankingService,
    private storage: StorageService
  ) {}

  async ngOnInit() {
    this.playerName = await this.storage.get('playerName') ?? 'Jugador';
    await this.load();
  }

  async load() {
    this.isLoading = true;
    const game = this.selectedGame === 'all' ? undefined : this.selectedGame;
    this.scores = await this.rankingService.getTopScores(game);
    this.isLoading = false;
  }

  onGameChange(event: any) {
    this.selectedGame = event.detail.value;
    this.load();
  }

  getMedal(index: number): string {
    return ['🥇', '🥈', '🥉'][index] ?? `${index + 1}.`;
  }
}
