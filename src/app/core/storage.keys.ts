/** Claves para almacenamiento local en el dispositivo (Capacitor Preferences). */
export const STORAGE_KEYS = {
  TOTAL_POINTS: 'rdplay_total_points',
  /** Id estable para fila única en Firestore `leaderboard/{id}`. */
  LEADERBOARD_PUBLIC_ID: 'rdplay_leaderboard_public_id',
  DISPLAY_NAME: 'rdplay_display_name',
  QUIZ: 'rdplay_quiz_progress',
  MEMORY: 'rdplay_memory_state',
  SEQUENCE: 'rdplay_sequence_state',
  ACHIEVEMENTS: 'rdplay_achievements_count',
} as const;
