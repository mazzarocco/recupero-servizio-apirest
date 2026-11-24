// HttpErrorResponse permette di distinguere gli errori HTTP e leggere il relativo status.
import { HttpErrorResponse } from '@angular/common/http';
// OnInit avvia il ciclo di vita ngOnInit, inject recupera le dipendenze e signal conserva lo stato reattivo.
import { Component, OnInit, inject, signal } from '@angular/core';
// ActivatedRoute fornisce i parametri URL, Router esegue le navigazioni e RouterLink crea i collegamenti.
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
// Post descrive la forma dei dati ricevuti dal servizio.
import { Post } from '../../models/post';
// PostsService gestisce letture, eliminazioni e stato condiviso dei post.
import { PostsService } from '../../services/posts.service';

// @Component collega questa classe alla pagina HTML e al foglio di stile della pagina dettaglio.
@Component({
  imports: [RouterLink],
  selector: 'app-post-detail',
  templateUrl: './post-detail.html',
  styleUrl: './post-detail.css',
})
export class PostDetail implements OnInit {
  // Le dipendenze private vengono create da Angular tramite injection all'avvio del componente.
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly postsService = inject(PostsService);

  // Ogni signal rappresenta una parte dello stato mostrata dal template HTML.
  readonly post = signal<Post | null>(null); // Post trovato oppure null durante i cambi di pagina.
  readonly loading = signal(true); // Indica se è in corso il recupero del dettaglio.
  readonly error = signal(''); // Contiene il messaggio generato dal recupero fallito.
  readonly deleting = signal(false); // Impedisce più eliminazioni contemporanee.
  readonly deleteError = signal(''); // Contiene eventuali errori durante la cancellazione.
  readonly currentId = signal(1); // Conserva l'id letto dall'URL per la navigazione precedente/successivo.

  // Questo metodo viene eseguito subito dopo la creazione del componente.
  ngOnInit(): void {
    // Legge l'id dalla rotta; la sottoscrizione reagisce anche se cambia parametro senza ricreare la pagina.
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      this.currentId.set(id);
      this.loadPost(id);
    });
  }

  // Metodo privato dedicato al recupero di un singolo post.
  private loadPost(id: number): void {
    // Reset dello stato: così il template mostra il caricamento e non mostra dati del post precedente.
    this.loading.set(true);
    this.error.set('');
    this.post.set(null);

    // getById restituisce un Observable: subscribe avvia la richiesta HTTP e attende la risposta.
    this.postsService.getById(id).subscribe({
      // next viene chiamato quando il post viene recuperato correttamente dal servizio.
      next: (post) => {
        this.post.set(post);
        this.loading.set(false); // Il caricamento termina e il template può mostrare il dettaglio.
      },
      // error gestisce i tre casi principali: risorsa assente, rete indisponibile o altro errore HTTP.
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(error.status === 404
          ? 'Il post richiesto non esiste (404).'
          : error.status === 0
            ? 'Rete non disponibile: impossibile recuperare il post.'
            : 'Si è verificato un errore nel recupero del post.');
      },
    });
  }

  // Metodo pubblico chiamato dal pulsante (click) presente nel template.
  deletePost(): void {
    const currentPost = this.post();
    // Impedisce richieste duplicate e chiede conferma prima di eliminare.
    if (!currentPost || this.deleting() || !window.confirm('Vuoi eliminare questo post?')) {
      return;
    }

    this.deleteError.set('');
    this.deleting.set(true);
    this.postsService.delete(currentPost.id).subscribe({
      next: () => {
        this.deleting.set(false);
        void this.router.navigate(['/posts']);
      },
      error: (error: HttpErrorResponse) => {
        this.deleting.set(false);
        this.deleteError.set(error.status === 0
          ? 'Rete non disponibile: il post non è stato eliminato.'
          : 'Eliminazione non riuscita. Riprova.');
      },
    });
  }
}
