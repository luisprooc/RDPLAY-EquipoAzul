import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy, RouterModule } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { environment } from '../environments/environment';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';

const firebaseProviders =
  environment.firebase.apiKey && environment.firebase.apiKey !== 'REPLACE_ME'
    ? [provideFirebaseApp(() => initializeApp(environment.firebase))]
    : [];

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, IonicModule.forRoot(), RouterModule, AppRoutingModule],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    ...firebaseProviders,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
