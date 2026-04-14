import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { StorageService } from './storage.service';
import { STORAGE_KEYS } from './storage.keys';

/** Nombre por defecto hasta que el usuario lo cambie en Perfil. */
const DEFAULT_GREETING_NAME = 'Campeón';

/**
 * Nombre guardado en el dispositivo para saludar al usuario en toda la app.
 */
@Injectable({ providedIn: 'root' })
export class UserProfileService {
  private readonly displayName$ = new BehaviorSubject<string>(DEFAULT_GREETING_NAME);

  constructor(private readonly storage: StorageService) {}

  /** Carga el nombre desde almacenamiento local y notifica a quien esté suscrito. */
  async refreshFromStorage(): Promise<void> {
    const raw = await this.storage.get(STORAGE_KEYS.DISPLAY_NAME);
    const trimmed = raw?.trim();
    this.displayName$.next(trimmed && trimmed.length > 0 ? trimmed : DEFAULT_GREETING_NAME);
  }

  /** Stream del nombre para plantillas con async pipe o suscripciones. */
  getDisplayNameStream(): Observable<string> {
    return this.displayName$.asObservable();
  }

  /** Valor actual (sincrónico). */
  getDisplayName(): string {
    return this.displayName$.value;
  }

  /** Guarda y propaga el nombre a toda la app. */
  async setDisplayName(name: string): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    await this.storage.set(STORAGE_KEYS.DISPLAY_NAME, trimmed);
    this.displayName$.next(trimmed);
  }
}
