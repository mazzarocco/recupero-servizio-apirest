// bootstrapApplication avvia un'app Angular costruita con componenti standalone.
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Avvia l'app Angular standalone usando la configurazione condivisa dell'applicazione.
// Il componente radice App viene avviato con i provider definiti in appConfig.
// Il catch registra in console eventuali problemi verificatisi durante l'avvio.
bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
