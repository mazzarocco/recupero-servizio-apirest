// HttpClient esegue richieste API e HttpErrorResponse rappresenta una risposta HTTP fallita.
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
// Injectable registra la classe nel sistema di dependency injection; signal gestisce lo stato reattivo.
import { Injectable, signal } from '@angular/core';
// Observable rappresenta il risultato asincrono; gli operatori RxJS trasformano o osservano i dati.
import { Observable, map, of, tap, throwError } from 'rxjs';
import { NewPost, Post } from '../models/post';

@Injectable({ providedIn: 'root' })
export class PostsService {
  private readonly endpoint = 'https://jsonplaceholder.typicode.com/posts';
  private readonly storageKey = 'postplace-created-posts';
  private readonly deletedStorageKey = 'postplace-deleted-post-ids';
  // Un signal privato mantiene lo stato; i componenti ricevono solo la vista in sola lettura.
  private readonly postsSignal = signal<Post[]>([]);

  readonly posts = this.postsSignal.asReadonly();

  constructor(private readonly http: HttpClient) {}

  // Scarica i post, integra quelli creati nel browser e aggiorna lo stato condiviso.
  getAll(): Observable<Post[]> {
    return this.http.get<Post[]>(this.endpoint).pipe(
      map((posts) => this.mergeWithCreatedPosts(posts)),
      tap((posts) => this.postsSignal.set(posts)),
    );
  }

  getById(id: number): Observable<Post> {
    // I post eliminati localmente non devono poter essere recuperati di nuovo dall'API.
    if (this.readDeletedPostIds().includes(id)) {
      return throwError(() => new HttpErrorResponse({
        status: 404,
        statusText: 'Not Found',
        url: `${this.endpoint}/${id}`,
      }));
    }

    const localPost = this.readCreatedPosts().find((post) => post.id === id);
    if (localPost) {
      this.postsSignal.update((posts) => this.mergePosts(posts, [localPost]));
      return of(localPost);
    }

    return this.http.get<Post>(`${this.endpoint}/${id}`).pipe(
      tap((post) => {
        this.postsSignal.update((posts) => {
          const index = posts.findIndex((item) => item.id === post.id);
          if (index === -1) {
            return [...posts, post];
          }
          const updated = [...posts];
          updated[index] = post;
          return updated;
        });
      }),
    );
  }

  create(post: NewPost): Observable<Post> {
    return this.http.post<Post>(this.endpoint, post).pipe(
      // JSONPlaceholder risponde ai POST ma non conserva i dati: si assegna un id locale e si salva il post.
      map((createdPost) => ({
        ...createdPost,
        id: this.nextLocalId(),
      })),
      tap((createdPost) => {
        const createdPosts = [...this.readCreatedPosts(), createdPost];
        this.saveCreatedPosts(createdPosts);
        this.postsSignal.update((posts) => this.mergePosts(posts, [createdPost]));
      }),
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`).pipe(
      // La cancellazione dell'API demo non è persistente: si memorizza l'id per nasconderlo ai ricaricamenti.
      tap(() => {
        const deletedIds = new Set(this.readDeletedPostIds());
        deletedIds.add(id);
        this.saveDeletedPostIds([...deletedIds]);
        this.postsSignal.update((posts) => posts.filter((post) => post.id !== id));
      }),
    );
  }

  private mergeWithCreatedPosts(posts: Post[]): Post[] {
    const deletedIds = new Set(this.readDeletedPostIds());
    return this.mergePosts(posts, this.readCreatedPosts())
      .filter((post) => !deletedIds.has(post.id));
  }

  private mergePosts(posts: Post[], additionalPosts: Post[]): Post[] {
    // La Map evita duplicati per id; l'ordinamento mantiene l'elenco prevedibile.
    const merged = new Map(posts.map((post) => [post.id, post]));
    additionalPosts.forEach((post) => merged.set(post.id, post));
    return [...merged.values()].sort((first, second) => first.id - second.id);
  }

  private nextLocalId(): number {
    // Gli id locali iniziano oltre quelli standard di JSONPlaceholder (1-100).
    const highestId = Math.max(
      100,
      ...this.postsSignal().map((post) => post.id),
      ...this.readCreatedPosts().map((post) => post.id),
    );
    return highestId + 1;
  }

  private readCreatedPosts(): Post[] {
    const storedPosts = localStorage.getItem(this.storageKey);
    if (!storedPosts) {
      return [];
    }

    try {
      const posts = JSON.parse(storedPosts) as unknown;
      return Array.isArray(posts) ? posts as Post[] : [];
    } catch (error) {
      // Dati salvati non validi non bloccano l'app: si segnala il problema e si parte senza post locali.
      console.error('Impossibile leggere i post creati localmente.', error);
      return [];
    }
  }

  private saveCreatedPosts(posts: Post[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(posts));
  }

  private readDeletedPostIds(): number[] {
    const storedIds = localStorage.getItem(this.deletedStorageKey);
    if (!storedIds) {
      return [];
    }

    try {
      const ids = JSON.parse(storedIds) as unknown;
      // Si accettano solo numeri interi sicuri, scartando eventuali valori corrotti.
      return Array.isArray(ids)
        ? ids.filter((id): id is number => Number.isSafeInteger(id))
        : [];
    } catch (error) {
      console.error('Impossibile leggere gli ID dei post eliminati.', error);
      return [];
    }
  }

  private saveDeletedPostIds(ids: number[]): void {
    localStorage.setItem(this.deletedStorageKey, JSON.stringify(ids));
  }
}
