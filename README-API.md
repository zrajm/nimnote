<!--
Author: Zrajm
Favicon: ../www/baremark.svg
License: <a href="https://gnu.org/licenses/gpl-2.0.html">GNU General Public License, version 2</a>.
Created: 2026-10-15 01:09:58+02:00
Updated: 2026-10-26 15:34:45+01:00
-->

# Nimnote API

> This API is intentionally kept very simple. Both client and server are meant
> to have a complete copy of the current data, and therefore any search, tags
> etc is the responsibility of the client, and is expected to be implemented on
> client-side only. **NOTE: *API is still in beta, and might change.***

<toc upto=2 class=toc>

This is a REST API for a general JSON storage. Request and response bodies are
UTF-8 encoded JSON. Responses all have `Content-Type: application/json`. The
server currently ignores any client `Accept` header (since responses are always
JSON).

**NOTE: *This API is currently in beta, and might still change.***---The basic
architecture is expected to remain the same, however server may enforce
stricter JSON property names and values in the future. Do not expect property
names/values other than those described in this document to work!


# API Calls

The API endpoint is `api/notes`, the HTTP method and query string define what
type of action the server will take. The query string is either `id={id}` or
empty (depending on the call). The request body, when used, always contains a
JSON description of the (whole) note being modified (the only exception to this
is that an `id` property may not be present in the request body when
[creating][create] a note).

| Does     | Method   | Query     | Body | On Success       | Response           |
|----------|----------|-----------|------|------------------|--------------------|
| [List]   | `GET`    | –         | –    | `200 OK`         | list, newest first |
| [Get]    | `GET`    | `id={id}` | –    | `200 OK`         | note               |
| [Create] | `POST`   | –         | note | `201 Created`    | note               |
| [Update] | `PUT`    | `id={id}` | note | `200 OK`         | note               |
| [Delete] | `DELETE` | `id={id}` | –    | `204 No Content` | –                  |


[list]: #list
## List

`GET` request, no query string, no request body.---On success, returns status
`200 OK` and a JSON object with a `list` property, the value of which is an
array of note info. Each element in this array is an object with two
properties: `id` and `updated`. The array values are sorted by the `updated`
value, in descending order (newest first).

The value of the `updated` property reflect the corresponding note, unless the
note *does not have* an `updated` property, in which case reflects the time
when the note was last modified on the server.

<div></div>

**Client should sync notes by:** Fetching the list of notes on the server, and
then compare the `updated` timestamp for the local and remote version of each
note, and do:

- If local & remote have same timestamp → do nothing
- If local note doesn't exist on server → push to server
- If local note is newer → push to server
- If remote note doesn't exist locally → fetch from server
- If remote note is newer:
  <ul style="margin-top:0">
    <li>and local note is unedited → fetch from server</li>
    <li>but local note is modified → conflict</li>
  </ul>

<div></div>

Prettified example listing:

```
{
  "list": [
    { "id": "fhXt0qjgDMs", "updated": 1792475078800 },
    { "id": "s3bPvB7pED3", "updated": 1787335860241 },
    ...
  ]
}
```

Using `curl`:

```
# curl -iu"$USER:$PASSWORD" \
  -XGET "https://$SERVER/nimnote/api/notes"
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
# REMOTE_USER="$USER" ./api/notes
Status: 200 OK
Content-Type: application/json

{"list":[{"id":"fhXt0qjgDMs","updated":1792475078800}]}
```

**FUTURE:** Additional properties may be added to the root level of the JSON
response, and a query string may be added to the request allow for paginated
index listing. The behavior described here is not expected to change however.
(Just make sure your client doesn't choke if you get a little more data than
expected and you should be good.)


[get]: #get
## Get

`GET` request, query string `id={id}`, no request body.---On success, returns
status `200 OK` and a JSON response containing the requested note object.

<div></div>

Using `curl`:

```
# curl -iu"$USER:$PASSWORD" \
  -XGET "https://$SERVER/nimnote/api/notes?id=fhXt0qjgDMs"
HTTP/2 200
content-type: application/json
accept-ranges: bytes
content-length: 84
date: Tue, 20 Oct 2026 05:44:39 GMT
server: lighttpd/1.4.63

{"created":1792475078800,"id":"fhXt0qjgDMs","text":"Hello!","updated":1792475078800}
```

Running the script directly from the server command line:

```
# REMOTE_USER="$USER" QUERY_STRING='id=fhXt0qjgDMs' ./api/notes
Status: 200 OK
Content-Type: application/json

{"created":1792475078800,"id":"fhXt0qjgDMs","text":"Hello!","updated":1792475078800}
```


[create]: #create
## Create

`POST` request, no query string, request body is a JSON with desired note
properties, except `id`.---On success, returns status `201 Created` and a JSON
response containing the newly created note object. The response includes a
(random) server-generated `id` property which is used to refer to the note in
future communication.

<div></div>

Using `curl`:

```
# curl -iu"$USER:$PASSWORD" \
  -XPOST "https://$SERVER/nimnote/api/notes" \
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
# echo "$REQ" | \
  REMOTE_USER="$USER" CONTENT_LENGTH="${#REQ}" REQUEST_METHOD=POST ./api/notes
Status: 201 Created
Content-Type: application/json

{"created":1792475078800,"id":"fhXt0qjgDMs","text":"Hello!","updated":1792475078800}
```


[update]: #update
## Update

`PUT` request, query string `id={id}`, request body is a JSON with desired note
properties. (The `id` property must be the same in both the query string, and
the request body.) The request overwrites the version of the note existing on
the server in its entirety, properties that do not exist in the request (but
exists in the stored note) are deleted.---On success, returns status `200 OK`
and a JSON response containing the new note object, that is, the response
returned is identical to the request.

<div></div>

Using `curl`:

```
# curl -iu"$USER:$PASSWORD" \
  -XPUT "https://$SERVER/nimnote/api/notes?id=fhXt0qjgDMs" --data \
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
# REQ='{"created":1792475078800,"id":"fhXt0qjgDMs","text":"Hi!","updated":1792475081414}'
# echo "$REQ" | \
  REMOTE_USER="$USER" CONTENT_LENGTH="${#REQ}" QUERY_STRING='id=fhXt0qjgDMs' \
  REQUEST_METHOD=PUT ./api/notes
Status: 200 OK
Content-Type: application/json

{"created":1792475078800,"id":"fhXt0qjgDMs","text":"Hi!","updated":1792475081414}
```

The `updated` submitted by the client is stored, and is the value returned by
future calls.


[delete]: #delete
## Delete

`DELETE` request, query string `id={id}`, no request body.---On success,
returns status `204 No Content` and no response body.

<div></div>

Using `curl`:

```
# curl -iu"$USER:$PASSWORD" \
  -XDELETE "https://$SERVER/nimnote/api/notes?id=fhXt0qjgDMs"
HTTP/2 204
content-type: application/json
date: Tue, 20 Oct 2026 05:44:42 GMT
server: lighttpd/1.4.63
```

Running the script directly from the server command line:

```
# REMOTE_USER="$USER" QUERY_STRING='id=fhXt0qjgDMs' \
  REQUEST_METHOD=DELETE ./api/notes
Status: 204 No Content
Content-Type: application/json
```


# Note Properties

Each note object has the properties: `created`, `id`, `text` and `updated`.
(The `id` property is generated by the server when [creating][create] a note,
all other properties are set by the client.)

**NOTE:** The API backend currently stores and returns *all properties*
specified by the client in a server request (even those not described in this
document). This is subject to change. *Do not rely on properties other than
those described in this document.*


## `id` and `updated`

There are two special properties: `id` and `updated`, these are the only two
properties which are included when [listing][list] notes.

- `id` (string): Unique note identifier string---This is an 11 character long,
  URL-safe, base64-encoded string which encodes 66 (sic!) bits of randomness.
  (It can only contain the characters a--z, A--Z, 0--9, _ and -.) The `id` is
  generated by the server when the note is first [created][create], and each
  note has its own unique `id` which persist throughout its lifetime.---If a
  client needs a temporary `id` to refer to a note locally before the note is
  pushed to the server, make sure to choose an id which does not collide with
  the server-assigned `id` values.)
- `updated` (integer): Note modification time---This is a Javascript-style
  timestamp (that is, expressed in *milli*seconds since 1970-01-01 00:00:00
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
- `tags` **(NOT IMPLEMENTED, RESERVED FOR FUTURE USE.)** (optional property;
  array of strings): Note tags. Short strings which should not contain spaces
  (for example, `klingon` or `language-studies`).
- `text` (UTF-8 string): Note text---This is the main body of a note. Content
  is expected to be Markdown formatted.


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
