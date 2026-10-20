<!--
Author: Zrajm
Favicon: ../www/baremark.svg
License: <a href="https://gnu.org/licenses/gpl-2.0.html">GNU General Public License, version 2</a>.
Created: 2026-10-15 01:09:58+02:00
Updated: 2026-10-20 11:20:15+02:00
-->

# Baremarknote API

> This API is intentionally kept very simple. Both client and server is meant
> to have a complete copy of the current data, and therefore any search, tags
> etc is the responsibility of the client, and is expected to be implemented on
> client-side only.

<toc class=toc>

This is a REST API for a general JSON storage. Request and response bodies are
always UTF-8 encoded JSON. Responses all have `Content-Type: application/json`.
The server currently ignores any client `Accept` header (since responses are
always JSON).


# API Calls

The API endpoint is `api/notes`, the HTTP method and query string define what
type of action the server will take. The query string is either `id={id}` or
empty (depending on the call). The request body, when used, always contain a
JSON description of the note being modified.

| Does     | Method   | Query     | Body | On Success       | Response           |
|:---------|----------|-----------|------|------------------|--------------------|
| [List]   | `GET`    | –         | –    | `200 OK`         | list, newest first |
| [Get]    | `GET`    | `id={id}` | –    | `200 OK`         | note               |
| [Create] | `POST`   | –         | note | `201 Created`    | note               |
| [Update] | `PUT`    | `id={id}` | note | `200 OK`         | note               |
| [Delete] | `DELETE` | `id={id}` | –    | `204 No Content` | –                  |


[list]: #list
## List

`GET` request, no query string, no request body.---On success, returns status
`200 OK` and a JSON object with a `list` attribute, the value of which is an
array containing note info. The note info objects contain two properties, `id`
and `updated`. The output is sorted by the `updated` timestamps (newest first).

For example:

```
{
  "list": [
    { "id": "fhXt0qjgDMs", "updated": 1792475078800 },
    ...
  ]
}
```

Using `curl`:

```
# curl -iu"$USER:$PASSWORD" \
    -XGET "https://$SERVER/baremarknote/api/notes"
HTTP/2 200
content-type: application/json
accept-ranges: bytes
content-length: 55
date: Tue, 20 Oct 2026 05:44:40 GMT
server: lighttpd/1.4.63

{"list":[{"id":"fhXt0qjgDMs","updated":1792475078800}]}
```

Running the script directly from the server command line:

```
# ./api/notes
Status: 200 OK
Content-Type: application/json

{"list":[{"id":"fhXt0qjgDMs","updated":1792475078800}]}
```

**FUTURE:** Additional fields and a query string may be added in the future to
allow for paginated index listing. The behavior described here, is not expected
to change however. (Just make sure your client doesn't choke if you get a
little more data than expected and you should be good.)


[get]: #get
## Get

`POST` request, query string `id={id}`, no request body.---On success, returns
status `200 OK` and a JSON response containing the requested note object.

<div></div>

Using `curl`:

```
# curl -iu"$USER:$PASSWORD" \
    -XGET "https://$SERVER/baremarknote/api/notes?id=fhXt0qjgDMs"
HTTP/2 200
content-type: application/json
accept-ranges: bytes
content-length: 60
date: Tue, 20 Oct 2026 05:44:39 GMT
server: lighttpd/1.4.63

{"id":"fhXt0qjgDMs","text":"Hello!","updated":1792475078800}
```

Running the script directly from the server command line:

```
QUERY_STRING='id=fhXt0qjgDMs' ./api/notes
Status: 200 OK
Content-Type: application/json

{"id":"fhXt0qjgDMs","text":"Hello!","updated":1792475078800}
```


[create]: #create
## Create

`POST` request, no query string, request body is a JSON with all desired note
properties (except `id`).---On success, returns status `201 Created` and a JSON
response containing all the specified properties, plus the server-generated
`id` property.

<div></div>

Using `curl`:

```
# curl -iu"$USER:$PASSWORD" \
    -XPOST "https://$SERVER/baremarknote/api/notes" \
    --data '{"created":1792475078800,"text":"Hello!","updated":1792475078800}'
HTTP/2 201
content-type: application/json
content-length: 84
date: Tue, 20 Oct 2026 05:44:38 GMT
server: lighttpd/1.4.63

{"created":1792475078800,"id":"fhXt0qjgDMs","text":"Hello!","updated":1792475078800}
```

Running the script directly from the server command line:

```
# REQ='{"created":1792475078800,"text":"Hello!","updated":1792475078800}'
# printf '%s' "$REQ" | CONTENT_LENGTH="${#REQ}" REQUEST_METHOD=POST ../api/notes
Status: 201 Created
Content-Type: application/json

{"created":1792475078800,"id":"fhXt0qjgDMs","text":"Hello!","updated":1792475078800}
```

To make sure no existing notes is ever overwritten, the server is responsible
for note `id` generation. The `id` response of the create call must be to refer
to the note in all future communication. (If the client needs a temporary `id`
before submitting a note for creation, make sure to choose one that does not
collide with the 11 character URL-safe base64 [alphabet `a-zA-Z0-9_-`] strings
used by the server-provided `id` property, and change it to the server-provided
one on creation.)

The `updated` property submitted by the client is stored, and is returned in
future calls. (Just like with all properties.)


[update]: #update
## Update

`PUT` request, query string `id={id}`, request body is JSON with `id`, `text`
and `updated` values.---On success, returns status `200 OK` and a JSON response
containing an object with `id`, `text` and `updated`.

<div></div>

Using `curl`:

```
# curl -iu"$USER:$PASSWORD" \
    -XPUT 'https://dedyn.nomi/baremarknote/api/notes?id=fhXt0qjgDMs' --data \
    '{"created":1792475078800,"id":"fhXt0qjgDMs","text":"Hi!","updated":1792475081414}'
HTTP/2 200
content-type: application/json
content-length: 81
date: Tue, 20 Oct 2026 05:44:41 GMT
server: lighttpd/1.4.63

{"created":1792475078800,"id":"fhXt0qjgDMs","text":"Hi!","updated":1792475081414}
```

Running the script directly from the server command line:

```
REQ='{"created":1792475078800,"id":"fhXt0qjgDMs","text":"Hi!","updated":1792475081414}'
echo "$REQ" | CONTENT_LENGTH="${#REQ}" QUERY_STRING='id=fhXt0qjgDMs' \
    REQUEST_METHOD=PUT ./api/notes
Status: 200 OK
Content-Type: application/json

{"created":1792475078800,"id":"fhXt0qjgDMs","text":"Hi!","updated":1792475081414}
```

The `updated` submitted by the client is stored, and is the value returned by
future calls.


[delete]: #delete
## Delete

`DELETE` request, query string `id={id}`, request body is JSON with `id`,
`text` and `updated` values.---On success, returns status `204 No Content` and
no response body.

<div></div>

Using `curl`:

```
# curl -iu"$USER:$PASSWORD" \
    -XDELETE "https://$SERVER/baremarknote/api/notes?id=fhXt0qjgDMs"
HTTP/2 204
content-type: application/json
date: Tue, 20 Oct 2026 05:44:42 GMT
server: lighttpd/1.4.63


```

Running the script directly from the server command line:

```
# QUERY_STRING='id=fhXt0qjgDMs' \
    REQUEST_METHOD=DELETE ./api/notes
Status: 204 No Content
Content-Type: application/json

```


# Note Properties

A typical note have the properties `created`, `id`, `text` and `updated` set.
All properties are set by the client, except for `id`.


## `id` and `updated`

There are two special properties: `id` and `updated`, these are the only two
properties which are included when [listing][list] notes. Any valid UTF-8
strings are allowed.

- `id` (string): Unique note identifier string---This is an 11 character long,
  URL-safe, base64-encoded string which encodes 66 (sic!) bits of randomness.
  (It can only contain the characters a--z, A--Z, 0--9, '_' and '-'.) The `id`
  is generated by the server when the note is first [created][create], and each
  note has its own unique `id` which persist throughout its lifetime.
- `updated` (integer): Note modification time---This is a Javascript-style
  timestamp (thas is, expressed in *milli*seconds since 1970-01-01 00:00:00
  UTC, just like the output of Javascript's `Date.now()` function). If set, the
  note [listing][list] will include this property (if unset, the note listing
  will instead show which time the server last modified the note, and the note
  itself will not contain the `updated` property).


## Common Properties

Apart from the above, a client may set any property. The following are
common/recommended:

- `created` (integer): Note creation time---This should be provided when first
  creating a note, and then kept unmodified. The format is the same as for
  `updated`.
- `tags` (array of strings): Note tags. Tags should not contain any spaces.
- `text` (string): Note text---This is the main body of a note.


# Converting Timestamps

The shell command `date +%s%3N` can be used to generate the
milliseconds-since-the-epoch timestamps used by `created` and `updated`. To do
the opposite---generate a readable date/time from a millisecond epoch---a
slightly longer command is required:

```
date --rfc-3339=ns -d"@$(echo 'scale=3; 1792483973311 / 1000'|bc -l)"
```

Or, if you don't care about sub-second precision:

```
date --rfc-3339=ns -d"@$((1792483973311 / 1000))"
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
* Some API to allow client to fetch new updates from server. (Currently this
  can only be done by reloading the web page.)

<!--EOF-->
