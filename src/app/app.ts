// Component definisce un componente Angular standalone.
import { Component } from '@angular/core';
// RouterLink crea collegamenti, RouterLinkActive evidenzia la voce attiva
// e RouterOutlet mostra il componente associato alla rotta corrente.
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  // Il componente radice fornisce la navigazione e il contenitore in cui il router mostra le pagine.
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
// Questa classe vuota contiene solo il layout radice perché tutta la vista vive in app.html.
export class App {}
