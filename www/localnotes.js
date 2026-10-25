// -*- mode: js; js-indent-level: 2; -*-
// Copyright (c) 2026 by zrajm. License: GPLv2.

// IndexedDB local cache of notes. A note is an object with the structure:
//
// {
//   id: ...,            // 11 char URL-safe base64 random string
//   text: ...,          // note Markdown text
//   created: ...,       // created time, milliseconds since epoch
//   updated: ...,       // last updated, milliseconds since epoch
// }
//
// When using set(), the 'id' must be set.

const DB_NAME = 'nimnote'
const STORE   = 'notes'

export default class localNotes {
  static #dbPromise = null

  // Open database (once), and return a promise for the connection.
  static #db() {
    if (localNotes.#dbPromise) { return localNotes.#dbPromise }
    localNotes.#dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1)
      req.onupgradeneeded = () => {
        req.result.createObjectStore(STORE, { keyPath: 'id' })
      }
      req.onblocked = () => {
        console.warn('IndexedDB open blocked by another tab')
      }
      req.onsuccess = () => {
        const db = req.result
        db.onversionchange = () => { // let another tab's upgrade proceed
          db.close()
          localNotes.#dbPromise = null
        }
        resolve(db)
      }
      req.onerror = () => reject(req.error)
    }).catch(e => {
      localNotes.#dbPromise = null // allow retry on next call
      throw e
    })
    return localNotes.#dbPromise
  }

  // Run a request against the object store, resolve with its result.
  static #request(mode, fn) {
    return localNotes.#db().then(db => new Promise((resolve, reject) => {
      const tx  = db.transaction(STORE, mode)
      const req = fn(tx.objectStore(STORE))
      tx.oncomplete = () => resolve(req.result)
      tx.onabort    = () => reject(tx.error)
    }))
  }

  // Resolves to note, or null if not found. Rejects on other IndexedDB errors.
  static get(id) {
    return localNotes.#request('readonly', s => s.get(id))
      .then(note => note === undefined ? null : note)
  }

  // Resolves to note on success. Rejects on failure.
  static set(note) {
    return localNotes.#request('readwrite', s => s.put(note))
      .then(() => note)
  }

  // Resolves to set of matching note id:s.
  static search(regex) {
    return localNotes.#db().then(db => new Promise((resolve, reject) => {
      const ids = new Set()
      const tx  = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).openCursor()
      req.onsuccess = () => {
        const cursor = req.result
        if (!cursor) { return }
        regex.lastIndex = 0 // guard against g/y flag statefulness
        if (regex.test(cursor.value.text ?? '')) { ids.add(cursor.key) }
        cursor.continue()
      }
      tx.oncomplete = () => resolve(ids)
      tx.onabort    = () => reject(tx.error)
    }))
  }
}

//EOF
