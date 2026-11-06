import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { NewPost, Post } from '../models/post';

@Injectable({ providedIn: 'root' })
export class PostsService {
  private readonly endpoint = 'https://jsonplaceholder.typicode.com/posts';
  private readonly postsSignal = signal<Post[]>([]);

  readonly posts = this.postsSignal.asReadonly();

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Post[]> {
    return this.http.get<Post[]>(this.endpoint).pipe(
      tap((posts) => this.postsSignal.set(posts)),
    );
  }

  getById(id: number): Observable<Post> {
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
      tap((createdPost) => this.postsSignal.update((posts) => [...posts, createdPost])),
    );
  }
}
