import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, map, of, tap } from 'rxjs';
import { NewPost, Post } from '../models/post';

@Injectable({ providedIn: 'root' })
export class PostsService {
  private readonly endpoint = 'https://jsonplaceholder.typicode.com/posts';
  private readonly storageKey = 'postplace-created-posts';
  private readonly postsSignal = signal<Post[]>([]);

  readonly posts = this.postsSignal.asReadonly();

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Post[]> {
    return this.http.get<Post[]>(this.endpoint).pipe(
      map((posts) => this.mergeWithCreatedPosts(posts)),
      tap((posts) => this.postsSignal.set(posts)),
    );
  }

  getById(id: number): Observable<Post> {
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

  private mergeWithCreatedPosts(posts: Post[]): Post[] {
    return this.mergePosts(posts, this.readCreatedPosts());
  }

  private mergePosts(posts: Post[], additionalPosts: Post[]): Post[] {
    const merged = new Map(posts.map((post) => [post.id, post]));
    additionalPosts.forEach((post) => merged.set(post.id, post));
    return [...merged.values()].sort((first, second) => first.id - second.id);
  }

  private nextLocalId(): number {
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
      console.error('Impossibile leggere i post creati localmente.', error);
      return [];
    }
  }

  private saveCreatedPosts(posts: Post[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(posts));
  }
}
