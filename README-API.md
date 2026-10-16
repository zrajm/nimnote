<!--
Author: Zrajm
Favicon: ../www/baremark.svg
License: <a href="https://gnu.org/licenses/gpl-2.0.html">GNU General Public License, version 2</a>.
Created: 2026-10-15 01:09:58+02:00
Updated: 2026-10-16 19:12:05+02:00
-->

# Baremarknote API

> This API is intentionally kept very simple. Both client and server is meant
> to have a complete copy of the current data, and therefore any search, tags
> etc is the responsibility of the client, and is expected to be implemented on
> client-side only.

This is a REST API. Request and response bodies are always UTF-8 encoded JSON.
Responses all have `Content-Type: application/json`. The server currently
ignores any client `Accept` header.

<toc class=toc>


# Note Properties

Each note contains:

- `id`: Note ID---11 character string, using only `[a-zA-Z0-9_-]`. It is an
  URL-safe base64 string which encode 66 bits (sic!) of randomness.
- `text` (string): The note text in UTF-8 format.
- `updated` (integer): Update time. A Javascript-style timestamp (expressed in
  milliseconds since 1970-01-01 00:00:00 UTC), the same format as returned by
  `Date.now()`.

Client must provide all of these, except for the `create` call in which no `id`
is expected (an `id` will be created and returned by the server).


## Identifier generation


# API Calls

The API endpoint is `api/notes`, the HTTP method and query string what type of
action the server will take. The query string is either `id={id}` or empty
(depending on the call).

| Does     | Method   | Query     | Body | On Success       | Response           |
|:---------|----------|-----------|------|------------------|--------------------|
| [List]   | `GET`    | –         | –    | `200 OK`         | list, newest first |
| [Get]    | `GET`    | `id={id}` | –    | `200 OK`         | note               |
| [Create] | `POST`   | –         | note | `201 Created`    | note               |
| [Update] | `PUT`    | `id={id}` | note | `200 OK`         | note               |
| [Delete] | `DELETE` | `id={id}` | –    | `204 No Content` | –                  |


[list]: #list
## List

`GET` request, no query string, no request body.

On success, returns status `200 OK` and a JSON response containing an object
with an `list` attribute, the value of which is an array of note info objects.
Each info object contains `id` and `updated` (but not `text`). For example:

```
{
  "list": [
    {"id":"ZyVDElNejO4","updated":1792147494094},
    {"id":"3mUkJ5b-vQT","updated":1791896471237},
    ...
  ]
}
```

```
# ./api/notes
Status: 200 OK
Content-Type: application/json

{"list":[{"id":"3PRtqtHch-t","updated":1792147494094}]}
```

Or, using curl:

```
curl -i -u "$USER:..." 'https://<server>/baremarknote/api/notes'
```

**FUTURE:** Additional fields and a query string may be added in the future to
allow for paginated index listing. The behavior described here, is not expected
to change however. (Just make sure your client doesn't choke if you get a
little more data than expected and you should be good.)


[get]: #get
## Get

`POST` request, query string `id={id}`, no request body.

On success, returns status `200 OK` and a JSON response containing an object
with `id`, `text` and `updated`.

```
QUERY_STRING='id=3PRtqtHch-t' ./api/notes
Status: 200 OK
Content-Type: application/json

{"id":"3PRtqtHch-t","text":"Hi!","updated":1792145961958}
```


[create]: #create
## Create

`POST` request, no query string, request body is JSON with `text` and `updated`
values (but no `id`).

On success, returns status `201 Created` and a JSON response containing an
object with `id`, `text` and `updated`.

```
# echo '{"text":"Hi!"}' | REQUEST_METHOD=POST CONTENT_LENGTH=15 ./api/notes
Status: 201 Created
Content-Type: application/json

{"id":"3PRtqtHch-t","text":"Hi!","updated":1792147208878}
```

To make sure no existing notes is ever overwritten, the server is responsible
for note `id` generation. The `id` response of the create call must be to refer
to the note in all future communication. (If the client needs a temporary `id`
before submitting a note for creation, make sure to choose one that does not
collide with the 11 character URL-safe base64 [alphabet `a-zA-Z0-9_-`] strings
used by the server-provided `id` values, and change it to the server-provided
one on creation.)

The `updated` submitted by the client is stored, and is the value returned by
future calls.


[update]: #update
## Update

`PUT` request, query string `id={id}`, request body is JSON with `id`, `text`
and `updated` values.

On success, returns status `200 OK` and a JSON response containing an object
with `id`, `text` and `updated`.

```
echo '{"text":"Helloes!"}' | REQUEST_METHOD=PUT CONTENT_LENGTH=20 \
    QUERY_STRING='id=ZyVDElNejO4' ./api/notes
Status: 200 OK
Content-Type: application/json

{"id":"ZyVDElNejO4","text":"Helloes!","updated":1792147494094}
```

The `updated` submitted by the client is stored, and is the value returned by
future calls.


[delete]: #delete
## Delete

`DELETE` request, query string `id={id}`, request body is JSON with `id`,
`text` and `updated` values.

On success, returns status `204 No Content` and no response body.

```
# REQUEST_METHOD=DELETE QUERY_STRING='id=3PRtqtHch-t' ./api/notes
Status: 204 No Content
Content-Type: application/json

```


# FUTURE

A few things are likely to happen.

* Login currently uses Basic Auth---this will most likely change to a
  token-based separate login API (using `api/login` endpoint). This would allow
  loading of the web app, even for a user that hasn't logged in.
* An additional API call(s) for partial updating of notes will probably be
  added at some point. This would allow updates to be sent by sending parts of
  a note, rather than the whole thing, and would allow for continuous saving.
  (This might use the request method `PATCH` and/or possibly its own API
  endpoint.)
* Pagination will probably be added to the note listing. This would mean the
  addition of a query string and new fields in the server response. This would
  allow the client to chunk the loading of notes, if so desired.
* Some API to allow client to fetch new updates from server. (Currently
  achieved by reloading the web page.)

<!--EOF-->
