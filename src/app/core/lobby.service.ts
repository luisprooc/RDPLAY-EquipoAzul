import { Injectable, OnDestroy } from '@angular/core';
import {
  Firestore,
  collection, doc, setDoc, deleteDoc, addDoc, updateDoc,
  query, orderBy, onSnapshot, serverTimestamp, Timestamp,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { StorageService } from './storage.service';
import { STORAGE_KEYS } from './storage.keys';

export interface LobbyPlayer {
  id: string;
  name: string;
  level: number;
  status: 'available' | 'in-lobby' | 'in-game';
  lastSeen: Timestamp | null;
}

export interface LobbyRoom {
  id: string;
  hostId: string;
  hostName: string;
  game: 'quiz' | 'memory' | 'sequence';
  status: 'waiting' | 'in-progress';
  playerCount: number;
  maxPlayers: number;
  createdAt: Timestamp | null;
}

const TWO_MIN_MS = 2 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class LobbyService implements OnDestroy {
  private heartbeatInterval?: ReturnType<typeof setInterval>;
  currentPlayerId: string | null = null;

  constructor(
    private firestore: Firestore,
    private storage: StorageService,
  ) {}

  async registerPlayer(): Promise<string> {
    const name = (await this.storage.get(STORAGE_KEYS.DISPLAY_NAME)) ?? this.generateUsername();
    const points = Number(await this.storage.get(STORAGE_KEYS.TOTAL_POINTS) ?? 0);
    const level = Math.max(1, Math.floor(points / 100) + 1);

    const ref = doc(collection(this.firestore, 'lobby_players'));
    await setDoc(ref, { name, level, status: 'available', lastSeen: serverTimestamp() });

    this.currentPlayerId = ref.id;
    this.startHeartbeat(ref.id);
    return ref.id;
  }

  private startHeartbeat(playerId: string): void {
    this.heartbeatInterval = setInterval(async () => {
      try {
        await updateDoc(doc(this.firestore, 'lobby_players', playerId), {
          lastSeen: serverTimestamp(),
        });
      } catch { /* offline — skip */ }
    }, 30_000);
  }

  /** Realtime stream of players active in the last 2 minutes (excluding self). */
  watchNearbyPlayers(): Observable<LobbyPlayer[]> {
    return new Observable(subscriber => {
      const q = query(
        collection(this.firestore, 'lobby_players'),
        orderBy('lastSeen', 'desc'),
      );
      const unsub = onSnapshot(q, snap => {
        const cutoff = Date.now() - TWO_MIN_MS;
        const players = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as LobbyPlayer))
          .filter(p => p.id !== this.currentPlayerId)
          .filter(p => p.lastSeen != null && p.lastSeen.toMillis() >= cutoff);
        subscriber.next(players);
      }, err => subscriber.error(err));
      return () => unsub();
    });
  }

  /** Realtime stream of rooms with status === 'waiting'. */
  watchRooms(): Observable<LobbyRoom[]> {
    return new Observable(subscriber => {
      const q = query(
        collection(this.firestore, 'lobby_rooms'),
        orderBy('createdAt', 'desc'),
      );
      const unsub = onSnapshot(q, snap => {
        const rooms = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as LobbyRoom))
          .filter(r => r.status === 'waiting');
        subscriber.next(rooms);
      }, err => subscriber.error(err));
      return () => unsub();
    });
  }

  async createRoom(game: 'quiz' | 'memory' | 'sequence'): Promise<string> {
    const name = (await this.storage.get(STORAGE_KEYS.DISPLAY_NAME)) ?? 'Jugador';
    const ref = await addDoc(collection(this.firestore, 'lobby_rooms'), {
      hostId: this.currentPlayerId,
      hostName: name,
      game,
      status: 'waiting',
      playerCount: 1,
      maxPlayers: 4,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  }

  async unregisterPlayer(): Promise<void> {
    clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = undefined;
    if (this.currentPlayerId) {
      try {
        await deleteDoc(doc(this.firestore, 'lobby_players', this.currentPlayerId));
      } catch { /* offline */ }
      this.currentPlayerId = null;
    }
  }

  ngOnDestroy(): void {
    this.unregisterPlayer();
  }

  private generateUsername(): string {
    const prefixes = ['El', 'La', 'Don', 'Doña'];
    const words = ['Sanky', 'Tigre', 'Duro', 'Mañoso', 'Vivo', 'Capo', 'Bruto'];
    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    const w = words[Math.floor(Math.random() * words.length)];
    return `${p}_${w}_${Math.floor(Math.random() * 999)}`;
  }
}
