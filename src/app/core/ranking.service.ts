import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp } from '@angular/fire/firestore';

export interface RankingEntry {
  id?: string;
  playerName: string;
  score: number;
  game: string; // 'quiz' | 'memory' | 'sequence'
  createdAt?: any;
}

@Injectable({ providedIn: 'root' })
export class RankingService {

  constructor(private firestore: Firestore) {}

  /** Guarda un puntaje en Firestore */
  async saveScore(entry: Omit<RankingEntry, 'id' | 'createdAt'>): Promise<void> {
    try {
      const col = collection(this.firestore, 'rankings');
      await addDoc(col, { ...entry, createdAt: serverTimestamp() });
    } catch (err) {
      // Si no hay internet, el SDK de Firebase guarda en caché local
      console.warn('Puntaje guardado en caché local (sin conexión)', err);
    }
  }

  /** Obtiene el top 10 global ordenado por puntaje */
  async getTopScores(game?: string): Promise<RankingEntry[]> {
    try {
      const col = collection(this.firestore, 'rankings');
      const q = query(col, orderBy('score', 'desc'), limit(10));
      const snap = await getDocs(q);
      return snap.docs
        .map(d => ({ id: d.id, ...d.data() } as RankingEntry))
        .filter(e => !game || e.game === game);
    } catch {
      return [];
    }
  }
}
