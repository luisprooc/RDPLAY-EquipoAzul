import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  limit,
  getDocs,
  serverTimestamp,
  runTransaction,
  arrayUnion,
  increment,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
/**
 * Partida cercana “tipo Bluetooth”: documentos en `ble_sessions`, separados de `lobby_rooms`.
 * No aparecen en “Salas activas” del lobby online. Sincronización vía Firestore (requiere internet).
 */
export interface BleSession {
  id: string;
  hostId: string;
  hostName: string;
  guestId?: string;
  guestName?: string;
  game: 'quiz' | 'memory' | 'sequence';
  /** Código de 6 dígitos para que el invitado se una sin usar salas por WiFi/código global */
  inviteCode: string;
  status: 'waiting_guest' | 'waiting' | 'in-progress';
  startedGame?: 'quiz' | 'memory' | 'sequence' | null;
  finishedPlayingIds?: string[];
  playerCount: number;
  maxPlayers: number;
}

@Injectable({ providedIn: 'root' })
export class BleSessionService {
  constructor(private firestore: Firestore) {}

  private async randomInviteCode(): Promise<string> {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  /** Crea sesión BLE: el anfitrión ya eligió el juego. */
  async createSession(game: 'quiz' | 'memory' | 'sequence', hostId: string, hostName: string): Promise<string> {
    const ref = doc(collection(this.firestore, 'ble_sessions'));
    for (let attempt = 0; attempt < 8; attempt++) {
      const inviteCode = await this.randomInviteCode();
      const q = query(collection(this.firestore, 'ble_sessions'), where('inviteCode', '==', inviteCode), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        continue;
      }
      await setDoc(ref, {
        hostId,
        hostName,
        game,
        inviteCode,
        status: 'waiting_guest',
        playerCount: 1,
        maxPlayers: 2,
        startedGame: null,
        finishedPlayingIds: [],
        createdAt: serverTimestamp(),
      });
      return ref.id;
    }
    throw new Error('No se pudo crear el código de invitación');
  }

  /** Invitado ingresa el código de 6 dígitos que le dictó el anfitrión. */
  async joinSessionByInviteCode(
    code: string,
    guestId: string,
    guestName: string,
  ): Promise<string> {
    const trimmed = code.replace(/\D/g, '').slice(0, 6);
    if (trimmed.length !== 6) {
      throw new Error('El código tiene 6 números');
    }
    const q = query(collection(this.firestore, 'ble_sessions'), where('inviteCode', '==', trimmed), limit(3));
    const snap = await getDocs(q);
    const docSnap = snap.docs.find((d) => {
      const r = d.data() as BleSession;
      return r.status === 'waiting_guest' || r.status === 'waiting';
    });
    if (!docSnap) {
      throw new Error('No hay partida Bluetooth con ese código');
    }
    const ref = doc(this.firestore, 'ble_sessions', docSnap.id);
    await runTransaction(this.firestore, async (tx) => {
      const s = await tx.get(ref);
      if (!s.exists()) {
        throw new Error('La partida ya no existe');
      }
      const data = s.data() as BleSession;
      if (data.hostId === guestId) {
        throw new Error('No podés unirte a tu propia partida');
      }
      if (data.guestId && data.guestId !== guestId) {
        throw new Error('Esa partida ya tiene invitado');
      }
      if (data.playerCount >= data.maxPlayers) {
        throw new Error('La partida está llena');
      }
      tx.update(ref, {
        guestId,
        guestName,
        playerCount: increment(1),
        status: 'waiting',
      });
    });
    return docSnap.id;
  }

  watchSession(sessionId: string): Observable<BleSession | null> {
    return new Observable((subscriber) => {
      const ref = doc(this.firestore, 'ble_sessions', sessionId);
      const unsub = onSnapshot(
        ref,
        (snap) => {
          if (!snap.exists()) {
            subscriber.next(null);
            return;
          }
          subscriber.next({ id: snap.id, ...snap.data() } as BleSession);
        },
        (err) => subscriber.error(err),
      );
      return () => unsub();
    });
  }

  async startRoomGame(sessionId: string, game: 'quiz' | 'memory' | 'sequence', hostId: string): Promise<void> {
    const ref = doc(this.firestore, 'ble_sessions', sessionId);
    const s = await getDoc(ref);
    if (!s.exists()) {
      throw new Error('Partida no existe');
    }
    const data = s.data() as BleSession;
    if (data.hostId !== hostId) {
      throw new Error('Solo quien invitó puede empezar');
    }
    if (!data.guestId) {
      throw new Error('Esperá a que tu amigo se una con el código');
    }
    await updateDoc(ref, {
      status: 'in-progress',
      startedGame: game,
      finishedPlayingIds: [],
    });
  }

  async reportPlayerFinishedRound(sessionId: string, playerId: string): Promise<void> {
    const ref = doc(this.firestore, 'ble_sessions', sessionId);
    await runTransaction(this.firestore, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) {
        return;
      }
      const data = snap.data() as BleSession;
      if (data.status !== 'in-progress') {
        return;
      }
      const members = [data.hostId, data.guestId].filter(Boolean) as string[];
      if (!members.includes(playerId)) {
        return;
      }
      const prev = new Set(data.finishedPlayingIds ?? []);
      prev.add(playerId);
      const allDone = members.every((m) => prev.has(m));
      if (allDone) {
        tx.update(ref, {
          status: 'waiting',
          startedGame: null,
          finishedPlayingIds: [],
        });
      } else {
        tx.update(ref, {
          finishedPlayingIds: arrayUnion(playerId),
        });
      }
    });
  }

  async closeSessionByHost(sessionId: string, hostId: string): Promise<void> {
    const ref = doc(this.firestore, 'ble_sessions', sessionId);
    const s = await getDoc(ref);
    if (!s.exists()) {
      throw new Error('Partida no existe');
    }
    const data = s.data() as BleSession;
    if (data.hostId !== hostId) {
      throw new Error('Solo quien invitó puede cerrar');
    }
    await deleteDoc(ref);
  }
}
