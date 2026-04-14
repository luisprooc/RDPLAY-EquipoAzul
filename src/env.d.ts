/** Variables cargadas desde `.env` e inyectadas por webpack (DefinePlugin). */
interface FirebaseProcessEnv {
  readonly FIREBASE_API_KEY: string;
  readonly FIREBASE_AUTH_DOMAIN: string;
  readonly FIREBASE_PROJECT_ID: string;
  readonly FIREBASE_STORAGE_BUCKET: string;
  readonly FIREBASE_MESSAGING_SENDER_ID: string;
  readonly FIREBASE_APP_ID: string;
  readonly FIREBASE_MEASUREMENT_ID: string;
}

declare const process: {
  env: FirebaseProcessEnv;
};
