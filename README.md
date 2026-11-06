# PostPlace

Applicazione Angular per consultare e creare post tramite [JSONPlaceholder](https://jsonplaceholder.typicode.com/).

## Avvio

```bash
npm install
npm start
```

Aprire `http://localhost:4200/`. La pagina `/posts` mostra l'elenco filtrabile; `/posts/:id` mostra il dettaglio con navigazione al post precedente o successivo.

## Requisiti coperti

- `PostsService` usa `HttpClient` per le richieste GET elenco, GET dettaglio e POST.
- I dati sono mantenuti in un signal privato ed esposti con `asReadonly()`.
- Il conteggio e il filtro dell'elenco sono calcolati con `computed`.
- Sono presenti indicatori di caricamento e messaggi distinti per errore di rete (`status 0`) e post inesistente (`404`).

## Build

```bash
npm run build
```
