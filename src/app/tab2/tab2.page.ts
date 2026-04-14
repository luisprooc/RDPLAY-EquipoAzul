import { Component, OnDestroy } from '@angular/core';
import { ActionSheetController, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { LobbyService, LobbyPlayer, LobbyRoom } from '../core/lobby.service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})
export class Tab2Page implements OnDestroy {
  scanning = false;
  players: LobbyPlayer[] = [];
  rooms: LobbyRoom[] = [];

  private subs: Subscription[] = [];

  constructor(
    private lobby: LobbyService,
    private actionSheet: ActionSheetController,
    private toast: ToastController,
  ) {}

  async ionViewWillEnter(): Promise<void> {
    this.scanning = true;
    try {
      await this.lobby.registerPlayer();
      this.subs.push(
        this.lobby.watchNearbyPlayers().subscribe(p => {
          this.players = p;
          this.scanning = false;
        }),
        this.lobby.watchRooms().subscribe(r => (this.rooms = r)),
      );
    } catch (err) {
      console.error('Lobby error:', err);
      this.scanning = false;
    }
  }

  async ionViewWillLeave(): Promise<void> {
    this.subs.forEach(s => s.unsubscribe());
    this.subs = [];
    await this.lobby.unregisterPlayer();
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  async openCreateRoom(): Promise<void> {
    const sheet = await this.actionSheet.create({
      header: '¿Qué van a jugar?',
      buttons: [
        { text: 'Trivia Quiz', icon: 'help-circle', data: 'quiz' },
        { text: 'Memoria', icon: 'grid', data: 'memory' },
        { text: 'Secuencia', icon: 'list', data: 'sequence' },
        { text: 'Cancelar', role: 'cancel' },
      ],
    });
    await sheet.present();
    const { data } = await sheet.onDidDismiss<'quiz' | 'memory' | 'sequence'>();
    if (!data) return;
    try {
      await this.lobby.createRoom(data);
      await this.showToast('Sala creada. ¡Esperando jugadores…');
    } catch {
      await this.showToast('Error al crear sala. Intenta de nuevo.', 'danger');
    }
  }

  async joinRoom(room: LobbyRoom): Promise<void> {
    // TODO: navigate to game page with roomId once game screens exist
    await this.showToast(`Uniéndote a sala de ${room.hostName}…`);
  }

  async invitePlayer(player: LobbyPlayer): Promise<void> {
    // TODO: send invite notification via Firestore
    await this.showToast(`Invitación enviada a ${player.name}`);
  }

  async onRefresh(ev: CustomEvent): Promise<void> {
    this.subs.forEach(s => s.unsubscribe());
    this.subs = [];
    await this.lobby.unregisterPlayer();
    await this.ionViewWillEnter();
    (ev.target as HTMLIonRefresherElement).complete();
  }

  avatarGradient(id: string): string {
    const palettes = [
      ['#7fb3ff', '#4a6cf7'],
      ['#ffb3c1', '#ff6b8a'],
      ['#a8f0c0', '#34c767'],
      ['#ffd580', '#ff9f43'],
      ['#c6aaff', '#8b5cf6'],
    ];
    const idx = id.charCodeAt(0) % palettes.length;
    return `linear-gradient(135deg, ${palettes[idx][0]}, ${palettes[idx][1]})`;
  }

  gameLabel(game: string): string {
    const labels: Record<string, string> = { quiz: 'Trivia Quiz', memory: 'Memoria', sequence: 'Secuencia' };
    return labels[game] ?? game;
  }

  gameIcon(game: string): string {
    const icons: Record<string, string> = { quiz: 'help-circle', memory: 'grid', sequence: 'list' };
    return icons[game] ?? 'game-controller';
  }

  private async showToast(message: string, color = 'success'): Promise<void> {
    const t = await this.toast.create({ message, duration: 2500, color, position: 'bottom' });
    await t.present();
  }
}
