// -*- mode: js; js-indent-level: 2; -*-
// Copyright (c) 2026 by zrajm. License: GPLv2.

import { html, showError, $nav, $view } from './shared.js'
import './resize-menu.js'
import './search.js'
import './new-note.js'
import { updateView } from './view-switcher.js'
import noteCache from './notecache.js'

function dateStr(epochMs) {
  if (epochMs == null) { return null }
  const x = new Intl.DateTimeFormat('en-US', {
    hour12: false, timeZoneName: 'longOffset',
    year: 'numeric',  month: '2-digit',    day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date(epochMs))
    .reduce((a, { type, value }) => (a[type] = value, a), {})

  // timeZoneName is 'GMT+02:00' or 'GMT' for UTC.
  return `${x.year}-${x.month}-${x.day} `
    + `${x.hour}:${x.minute}:${x.second} `
    + x.timeZoneName.replace(/^GMT(.*)$/, (_, x) => x || '+00:00')
}

class HTTPError extends Error {}
function handleErrors(e) {
  if (e instanceof HTTPError) {
    showError(`Server error: ${e.message}`)
  } else if (e instanceof SyntaxError) {
    showError('Server error: Invalid JSON response')
  } else {
    showError(`Network error: ${e.message}`)
  }
}

// Returns promise, resolving in JSON.
function fetchJSON(url) {
  return fetch(url).then(reply => reply.text().then(text => {
    if (text.startsWith('#!')) {
      throw new HTTPError('API call returned source code')
    }
    const body = JSON.parse(text)              // may throw SyntaxError
    // Server responded with a (JSON) error message.
    if (!reply.ok) {
      const err = new HTTPError(body?.message ?? `HTTP ${reply.status}`)
      err.status = reply.status
      err.code = body?.error
      err.body = body
      throw err
    }
    return body
  }))
}

// Fetch the heading from a Markdown document.
function getNoteHeading(noteText = '') {
  const [noteHeading] = (noteText.match(/^\s*(\S.*)/ ?? ['']))
  return noteHeading.trim().replace(/^#+ */, '')
}

// Make sure we have the latest version of each note, and populate the
// left-hand index menu with note data. FIXME: Sync is simplistic, we only
// check if server timestamp is the same as local timestamp, and if it isn't
// local note is overwritten by server note.)
function syncNote(remoteNoteInfo, func) {
  // Insert placeholder for note in index menu.
  const [$menuItem] = html(`<a data-id="${remoteNoteInfo.id}">`)

  $nav.append($menuItem)
  const localNote = noteCache.get(remoteNoteInfo.id)

  // Get note from cache (if exists and is newer or same as note on server).
  if (localNote && localNote.updated >= remoteNoteInfo.updated) {
    updateMenuItem(localNote, $menuItem, func)
    return
  }
  // Get note info from server.
  fetchJSON(`./api/notes?id=${remoteNoteInfo.id}`)
    .then(remoteNote => {
      updateMenuItem(remoteNote, $menuItem, func)
      noteCache.set(remoteNote)
    })
}

function updateMenuItem(note, $menuItem, func) {
  $menuItem.innerText = getNoteHeading(note.text) // update note in index menu
  $menuItem.setAttribute('title',
                         `ID:\t${note.id ?? 'N/A'}\n` +
                         `Created:\t${dateStr(note.created) ?? 'N/A'}\n` +
                         `Updated:\t${dateStr(note.updated) ?? 'N/A'}`)
  if (func) { func(note) }
}

// On load, fetch note index from server.
fetchJSON('./api/notes').then(noteList => {
  noteList.list.forEach((noteInfo, i) => {
    syncNote(noteInfo, i === 0 ? updateView : null)
  })
}).catch(handleErrors)

// When user clicks left-hand index menu.
$nav.addEventListener('click', e => {
  const $a = e.target.closest('a[data-id]')
  if (!$a) { return }

  // If in edit mode, save current note text to cache.
  const $textarea = $view.querySelector('textarea')
  if ($textarea) {
    noteCache.set({
      id     : $view.dataset.id,
      text   : $textarea.value,
      updated: Math.round(Date.now() / 1000),
    })
  }

  // let modified / middle clicks behave normally
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) { return }
  e.preventDefault()

  const noteId = $a.dataset.id
  const localNote = noteCache.get(noteId)
  updateView(localNote)
})

//EOF
