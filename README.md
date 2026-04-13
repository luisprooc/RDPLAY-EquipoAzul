# RD Play

RD play es una aplicación móvil multiplataforma (Android / iOS) desarrollada con Ionic Framework +
Angular + Firebase. Ofrece una colección de minijuegos interactivos cortos e intuitivos, 100% inspirados
en la cultura, historia y tradiciones de la República Dominicana.

Cada partida dura entre 1 y 3 minutos, lo que permite sesiones de juego casual en cualquier momento
del día. La app funciona tanto en modo offline como online, con sincronización automática de puntajes y
logros cuando hay conexión disponible.

El nombre RDPlay combina la identidad nacional (RD) con la acción de jugar (Play), reflejando el espíritu
de la app: entretenimiento dominicano accesible para todos.

## Hito 2 (stack técnico)

- **Ionic + Angular + Capacitor** en este repositorio.
- **Firebase**: configuración base con `initializeApp` en `AppModule` (sustituye los valores `REPLACE_ME` en `src/environments/environment.ts` y `environment.prod.ts` con tu proyecto en la consola de Firebase).
- **Navegación**: pestañas Inicio / Lobby / Retos / Perfil; rutas de juego `/quiz`, `/memory`, `/sequence`; menú lateral (`ion-menu`) y `ion-back-button` en minijuegos.
- **Gestos**: `ion-refresher` (Lobby), arrastrar y soltar + toque para colocar fichas (secuencia del café), volteo de tarjetas en memoria (tap), temporizador en el quiz.
- **Almacenamiento local**: `@capacitor/preferences` vía `StorageService` (`src/app/core/storage.service.ts`) para puntos, nombre y estado de juegos.

### APK (Android 8.0+)

`minSdkVersion` está en **26** (Android 8.0). Necesitas **JDK 17+** (Android Studio lo incluye).

**APK debug con nombre `hito2-app-debug.apk` (raíz del repo):**

```bash
npm install
npm run apk:debug
```

El script compila la web, sincroniza Capacitor, ejecuta `./gradlew assembleDebug` y copia el APK a `./hito2-app-debug.apk`.

Alternativa manual: `npm run build`, `npx cap sync android`, abrir `android/` en Android Studio → Build → Build APK(s).

Desarrollo web: `npm start`.