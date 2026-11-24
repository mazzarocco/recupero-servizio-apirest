// HttpErrorResponse permette di leggere lo stato HTTP restituito in caso di errore.
import { HttpErrorResponse } from '@angular/common/http';
// OnInit contiene ngOnInit, mentre computed e signal gestiscono lo stato reattivo.
// inject permette di ottenere il servizio senza usare l'iniezione nel costruttore.
import { Component, OnInit, computed, inject, signal } from '@angular/core';
// FormsModule è necessario per usare due-way binding come [(ngModel)].
import { FormsModule } from '@angular/forms';
// RouterLink permette di creare i collegamenti verso la pagina di dettaglio.
import { RouterLink } from '@angular/router';
// NewPost rappresenta i dati inviati per creare un post; Post quelli ricevuti dall'API.
import { NewPost, Post } from '../../models/post';
// Il servizio centralizza le chiamate HTTP e lo stato condiviso dei post.
import { PostsService } from '../../services/posts.service';

// @Component collega classe, template HTML e foglio di stile di questo componente.
@Component({
  imports: [FormsModule, RouterLink],
  selector: 'app-post-list',
  templateUrl: './post-list.html',
  styleUrl: './post-list.css',
})
export class PostList implements OnInit {
  // inject recupera il servizio singleton dal dependency injection container di Angular.
  private readonly postsService = inject(PostsService);

  // Questo signal espone i post salvati nel servizio e viene letto direttamente dal template.
  readonly posts = this.postsService.posts;
  // Gli altri signal contengono lo stato reattivo mostrato dalla pagina.
  readonly search = signal(''); // Testo inserito dall'utente nella barra di ricerca.
  readonly loading = signal(false); // Indica il caricamento iniziale dell'elenco.
  readonly submitting = signal(false); // Disabilita il pulsante durante la creazione.
  readonly error = signal(''); // Contiene eventuali errori nella lettura dei post.
  readonly submitError = signal(''); // Contiene gli errori del modulo di creazione.
  // Il filtro è derivato da ricerca e post: Angular lo ricalcola quando uno dei due cambia.
  readonly filteredPosts = computed(() => {
    // trim elimina gli spazi esterni e toLowerCase rende la ricerca senza distinzione maiuscole/minuscole.
    const term = this.search().trim().toLowerCase();
    // filter crea un nuovo array contenente solo i post che soddisfano il criterio.
    // Il controllo vuoto serve a mostrare tutti i post quando il campo di ricerca è vuoto.
    return this.posts().filter((post) =>
      !term || post.title.toLowerCase().includes(term) || post.body.toLowerCase().includes(term),
    );
  });

  // Questo oggetto viene modificato dai campi del modulo tramite [(ngModel)].
  // userId resta fisso perché JSONPlaceholder richiede un identificatore numerico.
  newPost: NewPost = { userId: 1, title: '', body: '' };

  ngOnInit(): void {
    // ngOnInit viene chiamato una volta dopo la creazione del componente.
    // Qui si avvia il caricamento iniziale dei post dall'API remota.
    this.loading.set(true);
    this.postsService.getAll().subscribe({
      next: () => this.loading.set(false),
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(error.status === 0
          ? 'Rete non disponibile: controlla la connessione e riprova.'
          : 'Impossibile caricare i post. Riprova più tardi.');
      },
    });
  }

  createPost(): void {
    // subscribe resta attivo solo per questa chiamata e gestisce i tre momenti principali:
    // inizio richiesta, risposta riuscita ed eventuale errore.

    // La validazione lato client evita di inviare campi vuoti o composti solo da spazi.
    if (!this.newPost.title.trim() || !this.newPost.body.trim()) {
      this.submitError.set('Titolo e testo sono obbligatori.');
      return;
    }

    // Prima di inviare si cancella il vecchio errore e si mostra lo stato "Invio".
    this.submitError.set('');
    this.submitting.set(true);

    // spread copia newPost, poi trim elimina gli spazi iniziali e finali da titolo e testo.
    this.postsService.create({ ...this.newPost, title: this.newPost.title.trim(), body: this.newPost.body.trim() }).subscribe({
      next: () => {
        // Al successo si torna allo stato normale e si svuota il modulo per una nuova creazione.
        this.submitting.set(false);
        this.newPost = { userId: 1, title: '', body: '' };
      },
      error: (error: HttpErrorResponse) => {
        // Lo stato di invio termina anche in caso di errore, così il pulsante torna utilizzabile.
        this.submitting.set(false);
        this.submitError.set(error.status === 0 ? 'Rete non disponibile: il post non è stato creato.' : 'Creazione non riuscita.');
      },
    });
  }
}
