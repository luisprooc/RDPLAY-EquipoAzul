import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ActionSheetController, AlertController, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { BtLeService, BleDeviceDisplay } from '../core/bt-le.service';
import { LobbyPlayer, LobbyRoom, LobbyService } from '../core/lobby.service';

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
  bleDevices: BleDeviceDisplay[] = [];
  bleStatusMessage = '';

  private subs: Subscription[] = [];

  constructor(
    private lobby: LobbyService,
    private btLe: BtLeService,
    private actionSheet: ActionSheetController,
    private alertCtrl: AlertController,
    private toast: ToastController,
    private router: Router,
  ) {}

  async ionViewWillEnter(): Promise<void> {
    this.scanning = true;
    this.bleStatusMessage = this.btLe.statusMessage;
    try {
      await this.btLe.initialize();
      this.bleStatusMessage = this.btLe.statusMessage;
      void this.btLe.startScan();
      this.subs.push(
        this.btLe.scanResults$.subscribe((list) => {
          this.bleDevices = list;
        }),
      );

      await this.lobby.registerPlayer();
      this.subs.push(
        this.lobby.watchNearbyPlayers().subscribe((p) => {
          this.players = p;
          this.scanning = false;
        }),
        this.lobby.watchRooms().subscribe((r) => (this.rooms = r)),
      );
    } catch (err) {
      console.error('Lobby error:', err);
      this.scanning = false;
    }
  }

  async ionViewWillLeave(): Promise<void> {
    this.subs.forEach((s) => s.unsubscribe());
    this.subs = [];
    await this.btLe.stopScan();
    /* No unregisterPlayer aquí: al ir a /bt-room el jugador debe seguir en Firestore para unirse a la sala. */
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
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
    if (!data) {
      return;
    }
    try {
      const roomId = await this.lobby.createRoom(data);
      await this.showToast('Sala creada. Comparte el código con tus panas.');
      await this.router.navigate(['/bt-room', roomId]);
    } catch {
      await this.showToast('No se pudo crear la sala. Revisá tu conexión e intentá otra vez.', 'danger');
    }
  }

  async openJoinWithCode(): Promise<void> {
    const code = await this.promptRoomCode({
      header: 'Unirse por código',
      message: 'Pedile al que armó la sala los 6 números del código.',
      confirmText: 'Unirse',
    });
    if (!code) {
      return;
    }
    try {
      const roomId = await this.lobby.joinRoomByJoinCode(code);
      await this.router.navigate(['/bt-room', roomId]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'No se pudo unir';
      await this.showToast(msg, 'danger');
    }
  }

  async joinRoom(room: LobbyRoom): Promise<void> {
    try {
      await this.lobby.joinRoom(room.id);
      await this.router.navigate(['/bt-room', room.id]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al unirse';
      await this.showToast(msg, 'danger');
    }
  }

  async invitePlayer(player: LobbyPlayer): Promise<void> {
    const code = await this.promptRoomCode({
      header: `Invitar a ${player.name}`,
      message:
        'Pegá el código de 6 dígitos de la sala que ya creaste. Tenés que ser el anfitrión de esa sala para agregar a esta persona.',
      confirmText: 'Agregar a la sala',
    });
    if (!code) {
      return;
    }
    try {
      const result = await this.lobby.hostInvitePlayerByJoinCode(code, player.id);
      await this.showToast(
        result === 'already'
          ? `${player.name} ya estaba en la sala`
          : `${player.name} quedó en la sala`,
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'No se pudo invitar';
      await this.showToast(msg, 'danger');
    }
  }

  /** Devuelve el código de 6 dígitos o `null` si cancela o el formato es inválido. */
  private async promptRoomCode(opts: {
    header: string;
    message: string;
    confirmText: string;
  }): Promise<string | null> {
    const alert = await this.alertCtrl.create({
      header: opts.header,
      message: opts.message,
      inputs: [
        {
          name: 'joincode',
          type: 'text',
          placeholder: '000000',
          attributes: { maxlength: 6, inputmode: 'numeric' },
        },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: opts.confirmText, role: 'confirm' },
      ],
    });
    await alert.present();
    const { role, data } = await alert.onDidDismiss<{ values?: { joincode?: string } }>();
    if (role !== 'confirm') {
      return null;
    }
    const raw = data?.values?.joincode ?? '';
    const code = String(raw).replace(/\D/g, '').slice(0, 6);
    if (code.length !== 6) {
      await this.showToast('Ingresá 6 dígitos', 'warning');
      return null;
    }
    return code;
  }

  async onBleDeviceTap(device: BleDeviceDisplay): Promise<void> {
    await this.showToast(
      `Para jugar con ${device.name}, creá una sala y pasales el código por WhatsApp o de viva voz.`,
      'medium',
    );
  }

  async onRefresh(ev: CustomEvent): Promise<void> {
    this.subs.forEach((s) => s.unsubscribe());
    this.subs = [];
    await this.btLe.stopScan();
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
