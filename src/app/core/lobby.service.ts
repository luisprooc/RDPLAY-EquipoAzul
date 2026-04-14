import { Injectable, OnDestroy } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  addDoc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  where,
  limit,
  getDocs,
  getDoc,
  runTransaction,
  increment,
  arrayUnion,
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
  /** Código corto para unirse (ej. compartir verbalmente o por mensaje). */
  joinCode?: string;
  memberIds?: string[];
  memberNames?: string[];
  /** Cuando el anfitrión lanza la partida. */
  startedGame?: 'quiz' | 'memory' | 'sequence' | null;
  /** Jugadores que ya terminaron la ronda actual (multijugador). */
  finishedPlayingIds?: string[];
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
    const points = Number((await this.storage.get(STORAGE_KEYS.TOTAL_POINTS)) ?? 0);
    const level = Math.max(1, Math.floor(points / 100) + 1);

    if (this.currentPlayerId) {
      try {
        await updateDoc(doc(this.firestore, 'lobby_players', this.currentPlayerId), {
          name,
          level,
          status: 'available',
          lastSeen: serverTimestamp(),
        });
        if (!this.heartbeatInterval) {
          this.startHeartbeat(this.currentPlayerId);
        }
        return this.currentPlayerId;
      } catch {
        this.currentPlayerId = null;
      }
    }

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
      } catch {
        /* offline */
      }
    }, 30_000);
  }

  watchNearbyPlayers(): Observable<LobbyPlayer[]> {
    return new Observable((subscriber) => {
      const q = query(collection(this.firestore, 'lobby_players'), orderBy('lastSeen', 'desc'));
      const unsub = onSnapshot(
        q,
        (snap) => {
          const cutoff = Date.now() - TWO_MIN_MS;
          const players = snap.docs
            .map((d) => ({ id: d.id, ...d.data() } as LobbyPlayer))
            .filter((p) => p.id !== this.currentPlayerId)
            .filter((p) => p.lastSeen != null && p.lastSeen.toMillis() >= cutoff);
          subscriber.next(players);
        },
        (err) => subscriber.error(err),
      );
      return () => unsub();
    });
  }

  watchRooms(): Observable<LobbyRoom[]> {
    return new Observable((subscriber) => {
      const q = query(collection(this.firestore, 'lobby_rooms'), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(
        q,
        (snap) => {
          const pid = this.currentPlayerId;
          const rooms = snap.docs
            .map((d) => ({ id: d.id, ...d.data() } as LobbyRoom))
            .filter((r) => {
              if (r.status === 'waiting') {
                return true;
              }
              // Partida en curso: seguir mostrando la sala a quien ya es miembro (puede volver al lobby y reentrar).
              if (r.status === 'in-progress' && pid && (r.memberIds ?? []).includes(pid)) {
                return true;
              }
              return false;
            });
          subscriber.next(rooms);
        },
        (err) => subscriber.error(err),
      );
      return () => unsub();
    });
  }

  watchRoom(roomId: string): Observable<LobbyRoom | null> {
    return new Observable((subscriber) => {
      const ref = doc(this.firestore, 'lobby_rooms', roomId);
      const unsub = onSnapshot(
        ref,
        (snap) => {
          if (!snap.exists()) {
            subscriber.next(null);
            return;
          }
          subscriber.next({ id: snap.id, ...snap.data() } as LobbyRoom);
        },
        (err) => subscriber.error(err),
      );
      return () => unsub();
    });
  }

  private async generateUniqueJoinCode(): Promise<string> {
    for (let attempt = 0; attempt < 12; attempt++) {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const q = query(collection(this.firestore, 'lobby_rooms'), where('joinCode', '==', code), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) {
        return code;
      }
    }
    throw new Error('No se pudo generar código de sala');
  }

  async createRoom(game: 'quiz' | 'memory' | 'sequence'): Promise<string> {
    const name = (await this.storage.get(STORAGE_KEYS.DISPLAY_NAME)) ?? 'Jugador';
    if (!this.currentPlayerId) {
      throw new Error('No registrado en lobby');
    }
    const joinCode = await this.generateUniqueJoinCode();
    const ref = await addDoc(collection(this.firestore, 'lobby_rooms'), {
      hostId: this.currentPlayerId,
      hostName: name,
      game,
      status: 'waiting',
      playerCount: 1,
      maxPlayers: 4,
      createdAt: serverTimestamp(),
      joinCode,
      memberIds: [this.currentPlayerId],
      memberNames: [name],
      startedGame: null,
      finishedPlayingIds: [],
    });
    return ref.id;
  }

  /** Une al jugador actual a una sala por id de documento. */
  async joinRoom(roomId: string): Promise<void> {
    if (!this.currentPlayerId) {
      throw new Error('No registrado en lobby');
    }
    const playerName = (await this.storage.get(STORAGE_KEYS.DISPLAY_NAME)) ?? 'Jugador';
    const ref = doc(this.firestore, 'lobby_rooms', roomId);
    await runTransaction(this.firestore, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) {
        throw new Error('Sala no encontrada');
      }
      const data = snap.data() as LobbyRoom;
      const members = data.memberIds ?? [];
      if (members.includes(this.currentPlayerId!)) {
        return;
      }
      if (data.status !== 'waiting') {
        throw new Error('La sala ya no acepta jugadores nuevos mientras la partida sigue');
      }
      if (data.playerCount >= data.maxPlayers) {
        throw new Error('Sala llena');
      }
      tx.update(ref, {
        playerCount: increment(1),
        memberIds: arrayUnion(this.currentPlayerId),
        memberNames: arrayUnion(playerName),
      });
    });
  }

  /** Busca sala en espera por código de 6 dígitos y une al jugador actual. Devuelve el id de la sala. */
  async joinRoomByJoinCode(code: string): Promise<string> {
    const trimmed = code.replace(/\D/g, '').slice(0, 6);
    if (trimmed.length !== 6) {
      throw new Error('El código debe tener 6 dígitos');
    }
    const q = query(collection(this.firestore, 'lobby_rooms'), where('joinCode', '==', trimmed), limit(5));
    const snap = await getDocs(q);
    const docSnap = snap.docs.find((d) => {
      const r = d.data() as LobbyRoom;
      return r.status === 'waiting' || r.status === 'in-progress';
    });
    if (!docSnap) {
      throw new Error('No hay sala activa con ese código');
    }
    await this.joinRoom(docSnap.id);
    return docSnap.id;
  }

  /**
   * El anfitrión pega el código de su sala y agrega a un jugador que está en el lobby (lista “conectados”).
   * No requiere que el invitado introduzca el código en su dispositivo.
   */
  async hostInvitePlayerByJoinCode(
    joinCode: string,
    inviteePlayerId: string,
  ): Promise<'added' | 'already'> {
    if (!this.currentPlayerId) {
      throw new Error('No registrado en lobby');
    }
    if (inviteePlayerId === this.currentPlayerId) {
      throw new Error('Elegí a otro jugador');
    }
    const trimmed = joinCode.replace(/\D/g, '').slice(0, 6);
    if (trimmed.length !== 6) {
      throw new Error('El código debe tener 6 dígitos');
    }

    const inviteeRef = doc(this.firestore, 'lobby_players', inviteePlayerId);
    const inviteeSnap = await getDoc(inviteeRef);
    if (!inviteeSnap.exists()) {
      throw new Error('Ese jugador no aparece conectado; pedile que abra el lobby');
    }
    const inviteeData = inviteeSnap.data() as LobbyPlayer;
    const inviteeName = inviteeData.name ?? 'Jugador';

    const q = query(collection(this.firestore, 'lobby_rooms'), where('joinCode', '==', trimmed), limit(5));
    const snap = await getDocs(q);
    const docSnap = snap.docs.find((d) => {
      const r = d.data() as LobbyRoom;
      return r.status === 'waiting' || r.status === 'in-progress';
    });
    if (!docSnap) {
      throw new Error('No hay sala activa con ese código');
    }

    const roomRef = docSnap.ref;
    let alreadyMember = false;
    await runTransaction(this.firestore, async (tx) => {
      const s = await tx.get(roomRef);
      if (!s.exists()) {
        throw new Error('Sala no encontrada');
      }
      const data = s.data() as LobbyRoom;
      if (data.hostId !== this.currentPlayerId) {
        throw new Error('Solo el anfitrión puede invitar con el código de la sala');
      }
      if (data.status !== 'waiting' && data.status !== 'in-progress') {
        throw new Error('La sala no está disponible');
      }
      const members = data.memberIds ?? [];
      if (members.includes(inviteePlayerId)) {
        alreadyMember = true;
        return;
      }
      if (data.playerCount >= data.maxPlayers) {
        throw new Error('Sala llena');
      }
      tx.update(roomRef, {
        playerCount: increment(1),
        memberIds: arrayUnion(inviteePlayerId),
        memberNames: arrayUnion(inviteeName),
      });
    });
    return alreadyMember ? 'already' : 'added';
  }

  async startRoomGame(roomId: string, game: 'quiz' | 'memory' | 'sequence'): Promise<void> {
    if (!this.currentPlayerId) {
      throw new Error('No registrado');
    }
    const ref = doc(this.firestore, 'lobby_rooms', roomId);
    const s = await getDoc(ref);
    if (!s.exists()) {
      throw new Error('Sala no existe');
    }
    const data = s.data() as LobbyRoom;
    if (data.hostId !== this.currentPlayerId) {
      throw new Error('Solo el anfitrión puede iniciar la partida');
    }
    await updateDoc(ref, {
      status: 'in-progress',
      startedGame: game,
      finishedPlayingIds: [],
    });
  }

  /** Solo el anfitrión puede eliminar el documento de la sala en Firestore. */
  async closeRoomByHost(roomId: string): Promise<void> {
    if (!this.currentPlayerId) {
      throw new Error('No registrado');
    }
    const ref = doc(this.firestore, 'lobby_rooms', roomId);
    const s = await getDoc(ref);
    if (!s.exists()) {
      throw new Error('Sala no existe');
    }
    const data = s.data() as LobbyRoom;
    if (data.hostId !== this.currentPlayerId) {
      throw new Error('Solo el anfitrión puede cerrar la sala');
    }
    await deleteDoc(ref);
  }

  /**
   * Marca al jugador actual como que terminó la partida en curso.
   * La sala sigue en `in-progress` hasta que todos los `memberIds` reporten;
   * entonces vuelve a `waiting` para poder lanzar otra ronda.
   */
  async reportPlayerFinishedRound(roomId: string): Promise<void> {
    if (!this.currentPlayerId) {
      return;
    }
    const ref = doc(this.firestore, 'lobby_rooms', roomId);
    const pid = this.currentPlayerId;
    await runTransaction(this.firestore, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) {
        return;
      }
      const data = snap.data() as LobbyRoom;
      if (data.status !== 'in-progress') {
        return;
      }
      const members = data.memberIds ?? [];
      if (members.length === 0 || !members.includes(pid)) {
        return;
      }
      const prev = new Set(data.finishedPlayingIds ?? []);
      prev.add(pid);
      const allDone = members.every((m) => prev.has(m));
      if (allDone) {
        tx.update(ref, {
          status: 'waiting',
          startedGame: null,
          finishedPlayingIds: [],
        });
      } else {
        tx.update(ref, {
          finishedPlayingIds: arrayUnion(pid),
        });
      }
    });
  }

  async unregisterPlayer(): Promise<void> {
    clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = undefined;
    if (this.currentPlayerId) {
      try {
        await deleteDoc(doc(this.firestore, 'lobby_players', this.currentPlayerId));
      } catch {
        /* offline */
      }
      this.currentPlayerId = null;
    }
  }

  ngOnDestroy(): void {
    void this.unregisterPlayer();
  }

  private generateUsername(): string {
    const prefixes = ['El', 'La', 'Don', 'Doña'];
    const words = ['Sanky', 'Tigre', 'Duro', 'Mañoso', 'Vivo', 'Capo', 'Bruto'];
    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    const w = words[Math.floor(Math.random() * words.length)];
    return `${p}_${w}_${Math.floor(Math.random() * 999)}`;
  }
}
