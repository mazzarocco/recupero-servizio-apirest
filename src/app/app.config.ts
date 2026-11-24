// ApplicationConfig contiene i provider caricati all'avvio dell'app Angular.
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
// provideHttpClient rende disponibile HttpClient per tutti i servizi che lo richiedono.
import { provideHttpClient } from '@angular/common/http';
// provideRouter collega il sistema di navigazione all'elenco delle rotte.
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

// I provider sono servizi condivisi disponibili in tutta l'app, senza un AppModule.
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    provideRouter(routes),
  ],
};
