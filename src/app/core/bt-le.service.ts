import { Injectable, OnDestroy } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { BleClient, ScanMode } from '@capacitor-community/bluetooth-le';
import { BehaviorSubject } from 'rxjs';

export interface BleDeviceDisplay {
  id: string;
  name: string;
  rssi: number;
}

/**
 * Escaneo Bluetooth Low Energy (dispositivos cercanos).
 * En navegador el soporte es limitado; en Android/iOS requiere permisos y BT encendido.
 */
@Injectable({ providedIn: 'root' })
export class BtLeService implements OnDestroy {
  readonly scanResults$ = new BehaviorSubject<BleDeviceDisplay[]>([]);

  /** true si initialize() tuvo éxito */
  bleReady = false;
  /** Mensaje cuando BLE no está disponible o falló el escaneo */
  statusMessage = '';

  private scanActive = false;

  async initialize(): Promise<void> {
    this.statusMessage = '';
    try {
      await BleClient.initialize({
        androidNeverForLocation: true,
      });
      this.bleReady = true;
    } catch {
      this.bleReady = false;
      this.statusMessage =
        Capacitor.getPlatform() === 'web'
          ? 'En el navegador el Bluetooth no está disponible como en el celular. Instalá la app en Android para buscar gente cerca.'
          : 'No pudimos usar el Bluetooth en este momento. Revisá que esté encendido y que la app tenga permiso.';
    }
  }

  async startScan(): Promise<void> {
    await this.stopScan();
    this.scanResults$.next([]);
    if (!this.bleReady) {
      return;
    }
    try {
      if (Capacitor.getPlatform() === 'android') {
        const on = await BleClient.isEnabled();
        if (!on) {
          await BleClient.requestEnable();
        }
      }
    } catch {
      this.statusMessage = 'Encendé el Bluetooth en Ajustes y volvé a entrar al lobby.';
    }
    try {
      await BleClient.requestLEScan(
        {
          allowDuplicates: false,
          scanMode: ScanMode.SCAN_MODE_BALANCED,
        },
        (result) => {
          const id = result.device.deviceId;
          const name =
            (result.localName || result.device.name || '').trim() || 'Dispositivo cercano';
          const rssi = result.rssi ?? -100;
          const cur = this.scanResults$.value;
          const idx = cur.findIndex((x) => x.id === id);
          const row: BleDeviceDisplay = { id, name, rssi };
          const next =
            idx >= 0
              ? cur.map((x, i) => (i === idx ? row : x))
              : [...cur, row].sort((a, b) => b.rssi - a.rssi);
          this.scanResults$.next(next);
        },
      );
      this.scanActive = true;
    } catch {
      this.scanActive = false;
      this.statusMessage =
        'No pudimos buscar aparatos cerca. Probá de nuevo o seguí jugando con el código de sala.';
    }
  }

  async stopScan(): Promise<void> {
    if (!this.scanActive) {
      return;
    }
    try {
      await BleClient.stopLEScan();
    } catch {
      /* ignore */
    }
    this.scanActive = false;
  }

  ngOnDestroy(): void {
    void this.stopScan();
  }
}
