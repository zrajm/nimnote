<!--
Author: Zrajm
Favicon: ../www/baremark.svg
License: <a href="https://gnu.org/licenses/gpl-2.0.html">GNU General Public License, version 2</a>.
Created: 2026-10-15 01:09:58+02:00
Updated: 2026-10-26 15:34:45+01:00
-->

# Nimnote API 2

> This API is intentionally kept very simple. Both client and server are meant
> to have a complete copy of the current data, and therefore any search, tags
> etc is the responsibility of the client, and is expected to be implemented on
> client-side only. **NOTE: *API is still in beta, and might change.***

<toc upto=2 class=toc>

This is a REST API for a general JSON storage. Request and response bodies are
UTF-8 encoded JSON. Responses from server are kept to a minimum. Responses with
a body have `Content-Type: application/json`. The server currently ignores any
client `Accept` header (since responses are always JSON).

**NOTE: *This API is currently in beta, and might still change.***---The basic
architecture is expected to remain the same, however server may enforce
stricter JSON property names and values in the future. Do not expect property
names/values other than those described in this document to work!


# API Calls

The API endpoint is `api2/notes`, the HTTP method and query string define what
type of action the server will take. The query string is either `id={id}` or
empty (depending on the call). The request body, when used, always contains a
JSON description of the (whole) note being modified.

| Does     | Method   | Query     | Body | On Success       | Response       |
|----------|----------|-----------|------|------------------|----------------|
| [List]   | `GET`    | –         | –    | `200 OK`         | list, unsorted |
| [Get]    | `GET`    | `id={id}` | –    | `200 OK`         | note           |
| [Create] | `POST`   | `id={id}` | note | `201 Created`    | –              |
| [Update] | `PUT`    | `id={id}` | note | `204 No Content` | –              |
| [Delete] | `DELETE` | `id={id}` | –    | `204 No Content` | –              |


[list]: #list
## List

`GET` request, no query string, no request body.---On success, returns status
`200 OK` and a JSON object with a `list` property, the value of which is an
array of note info. Each element in this array is an object with two
properties: `id` and `updated`. This array is *unsorted.* (In an earlier
version of this API they were sorted, but not any more.)

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
    { "id": "cfhXt0qjgDMs", "updated": 1792475078800 },
    { "id": "Ss3bPvB7pED3", "updated": 1787335860241 },
    ...
  ]
}
```

Using `curl`:

```
# curl -iu"$USER:$PASSWORD" \
  -XGET 'https://dedyn.nomi/nimnote/api2/notes'
HTTP/2 200
content-type: application/json
accept-ranges: bytes
content-length: 55
date: Tue, 20 Oct 2026 05:44:40 GMT
server: lighttpd/1.4.63

{"list":[{"id":"cfhXt0qjgDMs","updated":1792475078800}]}
```

Running the script directly from the server command line:

```
# REMOTE_USER="$USER" ./api2/notes
Status: 200 OK
Content-Type: application/json

{"list":[{"id":"cfhXt0qjgDMs","updated":1792475078800}]}
```

**FUTURE:** Additional properties may be added to the root level of the JSON
response, and a query string may be added to the request allow for paginated
index listing. The behavior described here is not expected to change however.
(Just make sure your client doesn't choke if you get a little more data than
expected and you should be good.)


[get]: #get
## Get

`GET` request, query string `id={id}`, no request body.---On success, returns
status `200 OK` and a JSON response containing the requested note object. (This
is the only server request that returns note contents).

<div></div>

Using `curl`:

```
# curl -iu"$USER:$PASSWORD" \
  -XGET "https://$SERVER/nimnote/api2/notes?id=cfhXt0qjgDMs"
HTTP/2 200
content-type: application/json
accept-ranges: bytes
content-length: 85
date: Tue, 20 Oct 2026 05:44:39 GMT
server: lighttpd/1.4.63

{"created":1792475078800,"id":"cfhXt0qjgDMs","text":"Hello!","updated":1792475078800}
```

Running the script directly from the server command line:

```
# REMOTE_USER="$USER" QUERY_STRING='id=cfhXt0qjgDMs' ./api2/notes
Status: 200 OK
Content-Type: application/json

{"created":1792475078800,"id":"cfhXt0qjgDMs","text":"Hello!","updated":1792475078800}
```


[create]: #create
## Create

`POST` request, query string `id={id}`, request body is a JSON with desired
note properties. (The `id` property must be the same in both the query string
and the request body.)---On success, returns status `201 Created` and no
response body. If the note already exists, returns `409 Conflict` instead.

The client is expected to provide an `id` value in the form of a random 12
character URL-safe base64 string (of cryptographic quality).---This is
*exceedingly* unlikely to cause a collision. The following Javascript function
can be used for generating an `id` string:

```
// Returns 12 char (URL-safe, unpadded) base64 string (with 72 bit
// randomness). Character set is [a-zA-z0-9_-] (= 6 bits per character).
function randomNoteId() {
  const b64url = { '+': '-', '/': '_' }
  return btoa(String.fromCharCode(
    ...crypto.getRandomValues(new Uint8Array(9))
  )).replace(/[+\/]/g, c => b64url[c])
}
```

Using `curl`:

```
# curl -iu"$USER:$PASSWORD" \
  -XPOST "https://$SERVER/nimnote/api2/notes?id=cfhXt0qjgDMs" --data \
  '{"id":"cfhXt0qjgDMs","created":1792475078800,"text":"Hello!","updated":1792475078800}'
HTTP/2 201
location: ?id=cfhXt0qjgDMs
content-length: 0
date: Tue, 20 Oct 2026 05:44:38 GMT
server: lighttpd/1.4.63
```

Running the script directly from the server command line:

```
# REQ='{"id":"cfhXt0qjgDMs","created":1792475078800,"text":"Hello!","updated":1792475078800}'
# echo "$REQ" | \
  REMOTE_USER="$USER" CONTENT_LENGTH="${#REQ}" QUERY_STRING='id=cfhXt0qjgDMs' \
  REQUEST_METHOD=POST ./api2/notes
Status: 201 Created
Location: ?id=cfhXt0qjgDMs
```


[update]: #update
## Update

`PUT` request, query string `id={id}`, request body is a JSON with desired note
properties. (The `id` property must be the same in both the query string and
the request body.) The request overwrites the version of the note existing on
the server in its entirety, properties that do not exist in the request (but
exists in the stored note) are deleted.---On success, returns status `204 No
Content` and no response body.

The client is responsible for providing and updating all note properties,
including the timestamps for `created` and `updated`. (The `created` property
should remain unchanged, while `updated` should be modified to reflect which
time the user last modified the note.)

<div></div>

Using `curl`:

```
# curl -iu"$USER:$PASSWORD" \
  -XPUT "https://$SERVER/nimnote/api2/notes?id=cfhXt0qjgDMs" --data \
  '{"id":"cfhXt0qjgDMs","created":1792475078800,"text":"Hi!","updated":1792475081414}'
HTTP/2 204
date: Tue, 20 Oct 2026 05:44:41 GMT
server: lighttpd/1.4.63
```

Running the script directly from the server command line:

```
# REQ='{"id":"cfhXt0qjgDMs","created":1792475078800,"text":"Hi!","updated":1792475081414}'
# echo "$REQ" | \
  REMOTE_USER="$USER" CONTENT_LENGTH="${#REQ}" QUERY_STRING='id=cfhXt0qjgDMs' \
  REQUEST_METHOD=PUT ./api2/notes
Status: 204 No Content
```


[delete]: #delete
## Delete

`DELETE` request, query string `id={id}`, no request body.---On success,
returns status `204 No Content` and no response body.

<div></div>

Using `curl`:

```
# curl -iu"$USER:$PASSWORD" \
  -XDELETE "https://$SERVER/nimnote/api2/notes?id=cfhXt0qjgDMs"
HTTP/2 204
date: Tue, 20 Oct 2026 05:44:42 GMT
server: lighttpd/1.4.63
```

Running the script directly from the server command line:

```
# REMOTE_USER="$USER" QUERY_STRING='id=cfhXt0qjgDMs' \
  REQUEST_METHOD=DELETE ./api2/notes
Status: 204 No Content
```


# Note Properties

Each note object has the properties: `created`, `id`, `text` and `updated`.

**NOTE:** The API backend currently stores and returns *all properties*
specified by the client in a server request (even those not described in this
document). This is subject to change. *Do not rely on properties other than
those described in this document.*


## The `id` Property

There is one special property: `id`. This is the only value which may be
provided in the request URL. It is also the only note property given in the
server response when [listing][list] notes.

- `id` (string): Unique note identifier string---This is an 12 character long,
  URL-safe, base64-encoded string which encodes 72 bits of randomness. (It can
  only contain the characters a--z, A--Z, 0--9, _ and -.) The `id` is provided
  by the client when first [creating][create], and each note has its own unique
  `id` which persist throughout its lifetime.


## Common Properties

Apart from the above, a client may set any property. The following are
common/recommended:

- `created` (integer): Note creation time---This should be provided when first
  creating a note, and then kept unmodified. The format is the same as for
  `updated`. The client is expected to provide this value when creating the
  note, and (without modifying it) on each subsequent note update.
- `tags` **(NOT IMPLEMENTED, RESERVED FOR FUTURE USE.)** (optional property;
  array of strings): Note tags. Short strings which should not contain spaces
  (for example, `klingon` or `language-studies`).
- `text` (UTF-8 string): Note text---This is the main body of a note. Content
  is expected to be Markdown formatted.
- `updated` (integer): Note modification time---This is a Javascript-style
  timestamp (that is, expressed in *milli*seconds since 1970-01-01 00:00:00
  UTC, just like the output of Javascript's `Date.now()` function). The client
  is expected to provide this value when creating the note, and a new updated
  value on each subsequent note update.


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
* Some API to allow client to fetch newly updates notes from the server. (This
  can currently only be done through a listing and refetching of all the
  notes, which happens on reloading the client page.)

<!--EOF-->
