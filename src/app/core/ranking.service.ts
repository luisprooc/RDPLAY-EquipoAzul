import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
} from '@angular/fire/firestore';
import { StorageService } from './storage.service';
import { STORAGE_KEYS } from './storage.keys';

/** Una fila del tablero global (puntos totales del usuario en este dispositivo). */
export interface LeaderboardEntry {
  id: string;
  displayName: string;
  totalPoints: number;
  updatedAt?: unknown;
}

function generatePublicId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

@Injectable({ providedIn: 'root' })
export class RankingService {
  constructor(
    private firestore: Firestore,
    private storage: StorageService,
  ) {}

  private async getOrCreatePublicId(): Promise<string | null> {
    let id = await this.storage.get(STORAGE_KEYS.LEADERBOARD_PUBLIC_ID);
    if (!id?.trim()) {
      id = generatePublicId();
      await this.storage.set(STORAGE_KEYS.LEADERBOARD_PUBLIC_ID, id);
    }
    return id;
  }

  /**
   * Sube el total local de puntos y el nombre visible al ranking global.
   * Sin efecto si Firebase no está disponible.
   */
  async syncMyEntry(): Promise<void> {
    try {
      const pid = await this.getOrCreatePublicId();
      if (!pid) {
        return;
      }
      const nameRaw = await this.storage.get(STORAGE_KEYS.DISPLAY_NAME);
      const displayName = nameRaw?.trim() || 'Jugador';
      const raw = await this.storage.get(STORAGE_KEYS.TOTAL_POINTS);
      const totalPoints = raw != null ? Number.parseInt(raw, 10) || 0 : 0;
      await setDoc(
        doc(this.firestore, 'leaderboard', pid),
        {
          displayName,
          totalPoints,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    } catch {
      /* sin Firebase o sin red */
    }
  }

  /** Top mundial por puntos totales acumulados en la app. */
  async getGlobalLeaderboard(maxEntries = 50): Promise<LeaderboardEntry[]> {
    try {
      const q = query(
        collection(this.firestore, 'leaderboard'),
        orderBy('totalPoints', 'desc'),
        limit(maxEntries),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => {
        const data = d.data() as { displayName?: string; totalPoints?: number; updatedAt?: unknown };
        return {
          id: d.id,
          displayName: data.displayName ?? 'Jugador',
          totalPoints: typeof data.totalPoints === 'number' ? data.totalPoints : 0,
          updatedAt: data.updatedAt,
        };
      });
    } catch {
      return [];
    }
  }
}
