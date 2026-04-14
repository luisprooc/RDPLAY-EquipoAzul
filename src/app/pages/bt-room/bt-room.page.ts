import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { LobbyRoom, LobbyService } from '../../core/lobby.service';

@Component({
  selector: 'app-bt-room',
  templateUrl: './bt-room.page.html',
  styleUrls: ['./bt-room.page.scss'],
  standalone: false,
})
export class BtRoomPage implements OnDestroy {
  roomId = '';
  room: LobbyRoom | null = null;
  loading = true;

  private sub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private lobby: LobbyService,
    private toast: ToastController,
    private alertCtrl: AlertController,
  ) {}

  async ionViewWillEnter(): Promise<void> {
    this.roomId = this.route.snapshot.paramMap.get('roomId') ?? '';
    if (!this.roomId) {
      void this.router.navigateByUrl('/tabs/tab2', { replaceUrl: true });
      return;
    }
    try {
      await this.lobby.registerPlayer();
    } catch {
      /* sin Firebase el lobby falla; la pantalla igual muestra el código si hay datos en caché */
    }
    this.sub = this.lobby.watchRoom(this.roomId).subscribe({
      next: (r) => {
        this.room = r;
        this.loading = false;
        if (r === null) {
          void this.showToast('La sala ya no existe', 'danger');
          void this.router.navigateByUrl('/tabs/tab2', { replaceUrl: true });
        }
      },
      error: () => {
        this.loading = false;
        void this.showToast('Error al cargar la sala', 'danger');
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
    return !!this.room && this.lobby.currentPlayerId === this.room.hostId;
  }

  get isMember(): boolean {
    const id = this.lobby.currentPlayerId;
    if (!this.room || !id) {
      return false;
    }
    return (this.room.memberIds ?? []).includes(id);
  }

  get totalMembers(): number {
    return this.room?.memberIds?.length ?? 0;
  }

  /** Cuántos jugadores ya reportaron que terminaron la ronda actual. */
  get finishedPlayingCount(): number {
    return this.room?.finishedPlayingIds?.length ?? 0;
  }

  async joinThisRoom(): Promise<void> {
    try {
      await this.lobby.joinRoom(this.roomId);
      await this.showToast('¡Entraste a la sala!');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'No se pudo unir';
      await this.showToast(msg, 'danger');
    }
  }

  async copyCode(): Promise<void> {
    const code = this.room?.joinCode ?? '';
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

  /** Usa el mismo juego que se eligió al crear la sala (room.game). */
  async hostStartGame(): Promise<void> {
    if (!this.room) {
      return;
    }
    const game = this.room.game;
    try {
      await this.lobby.startRoomGame(this.roomId, game);
      await this.navigateToGame(game);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error';
      await this.showToast(msg, 'danger');
    }
  }

  async enterGameFromLobby(): Promise<void> {
    const g = this.room?.startedGame;
    if (!g) {
      return;
    }
    await this.navigateToGame(g);
  }

  private async navigateToGame(game: 'quiz' | 'memory' | 'sequence'): Promise<void> {
    const room = this.roomId;
    if (game === 'quiz') {
      await this.router.navigate(['/quiz'], { queryParams: { d: 'easy', room } });
    } else if (game === 'memory') {
      await this.router.navigate(['/memory'], { queryParams: { d: 'easy', room } });
    } else {
      await this.router.navigate(['/sequence'], { queryParams: { room } });
    }
  }

  goLobby(): void {
    void this.router.navigateByUrl('/tabs/tab2');
  }

  async confirmCloseRoom(): Promise<void> {
    if (!this.isHost) {
      return;
    }
    const alert = await this.alertCtrl.create({
      header: 'Cerrar sala',
      message:
        'La sala se eliminará para todos: nadie podrá volver con el código. ¿Querés continuar?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Cerrar sala', role: 'confirm' },
      ],
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    if (role === 'confirm') {
      await this.closeRoomAsHost();
    }
  }

  private async closeRoomAsHost(): Promise<void> {
    try {
      await this.lobby.closeRoomByHost(this.roomId);
      await this.showToast('Sala cerrada');
      void this.router.navigateByUrl('/tabs/tab2', { replaceUrl: true });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'No se pudo cerrar la sala';
      await this.showToast(msg, 'danger');
    }
  }

  private async showToast(message: string, color = 'success'): Promise<void> {
    const t = await this.toast.create({ message, duration: 2200, color, position: 'bottom' });
    await t.present();
  }
}
