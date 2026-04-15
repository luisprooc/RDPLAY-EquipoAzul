import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { BleSession, BleSessionService } from '../../core/ble-session.service';
import { LobbyService } from '../../core/lobby.service';

@Component({
  selector: 'app-ble-room',
  templateUrl: './ble-room.page.html',
  styleUrls: ['./ble-room.page.scss'],
  standalone: false,
})
export class BleRoomPage implements OnDestroy {
  sessionId = '';
  session: BleSession | null = null;
  loading = true;

  private sub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private lobby: LobbyService,
    private bleSession: BleSessionService,
    private toast: ToastController,
    private alertCtrl: AlertController,
  ) {}

  async ionViewWillEnter(): Promise<void> {
    this.sessionId = this.route.snapshot.paramMap.get('sessionId') ?? '';
    if (!this.sessionId) {
      void this.router.navigateByUrl('/tabs/tab2', { replaceUrl: true });
      return;
    }
    try {
      await this.lobby.registerPlayer();
    } catch {
      /* sin Firebase */
    }
    this.sub = this.bleSession.watchSession(this.sessionId).subscribe({
      next: (s) => {
        this.session = s;
        this.loading = false;
        if (s === null) {
          void this.showToast('La partida ya no existe', 'danger');
          void this.router.navigateByUrl('/tabs/tab2', { replaceUrl: true });
        }
      },
      error: () => {
        this.loading = false;
        void this.showToast('Error al cargar la partida', 'danger');
      },
    });
  }

  ionViewWillLeave(): void {
    this.sub?.unsubscribe();
    this.sub = undefined;
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  get isHost(): boolean {
    return !!this.session && this.lobby.currentPlayerId === this.session.hostId;
  }

  get isGuest(): boolean {
    return !!this.session && this.lobby.currentPlayerId === this.session.guestId;
  }

  get totalMembers(): number {
    return this.session?.playerCount ?? 0;
  }

  get finishedPlayingCount(): number {
    return this.session?.finishedPlayingIds?.length ?? 0;
  }

  async copyCode(): Promise<void> {
    const code = this.session?.inviteCode ?? '';
    if (!code) {
      return;
    }
    try {
      await navigator.clipboard.writeText(code);
      await this.showToast('Código copiado');
    } catch {
      await this.showToast(`Código: ${code}`, 'medium');
    }
  }

  async hostStartGame(): Promise<void> {
    if (!this.session) {
      return;
    }
    const game = this.session.game;
    try {
      await this.bleSession.startRoomGame(this.sessionId, game, this.session.hostId);
      await this.navigateToGame(game);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error';
      await this.showToast(msg, 'danger');
    }
  }

  async enterGameFromLobby(): Promise<void> {
    const g = this.session?.startedGame;
    if (!g) {
      return;
    }
    await this.navigateToGame(g);
  }

  private async navigateToGame(game: 'quiz' | 'memory' | 'sequence'): Promise<void> {
    const room = this.sessionId;
    const ble = '1';
    if (game === 'quiz') {
      await this.router.navigate(['/quiz'], { queryParams: { d: 'easy', room, ble } });
    } else if (game === 'memory') {
      await this.router.navigate(['/memory'], { queryParams: { d: 'easy', room, ble } });
    } else {
      await this.router.navigate(['/sequence'], { queryParams: { room, ble } });
    }
  }

  goLobby(): void {
    void this.router.navigateByUrl('/tabs/tab2');
  }

  async confirmCloseRoom(): Promise<void> {
    if (!this.isHost || !this.session) {
      return;
    }
    const alert = await this.alertCtrl.create({
      header: 'Cerrar partida',
      message: 'Se va a terminar la partida Bluetooth para vos y tu amigo. ¿Seguro?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Cerrar', role: 'confirm' },
      ],
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    if (role === 'confirm') {
      try {
        await this.bleSession.closeSessionByHost(this.sessionId, this.session.hostId);
        await this.showToast('Partida cerrada');
        void this.router.navigateByUrl('/tabs/tab2', { replaceUrl: true });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'No se pudo cerrar';
        await this.showToast(msg, 'danger');
      }
    }
  }

  private async showToast(message: string, color = 'success'): Promise<void> {
    const t = await this.toast.create({ message, duration: 2200, color, position: 'bottom' });
    await t.present();
  }
}
