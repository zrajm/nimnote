// -*- mode: js; js-indent-level: 2; -*-
// Copyright (c) 2026 by zrajm. License: GPLv2.

import { $view } from './shared.js'
import htmlifyMarkdown from './htmlify-markdown.js'
import localNotes from './localnotes.js'

export function updateView(note) {
  if ($view.classList.contains('fancy')) {
    htmlifyMarkdown($view, note.text)
  } else {
    showSource(note.text)
  }
  $view.dataset.id = note.id
}

function showSource(text) {
  const $textarea = document.createElement('textarea')
  $textarea.value = text
  $view.replaceChildren($textarea)
}

// On mousedown, 2nd click, store text cursor position (before word is hilited).
let caret
$view.addEventListener('mousedown', e => {
  caret = e.detail === 2                       // on mousedown 2nd click
    ? e.target.selectionStart
    : null
})
$view.addEventListener('dblclick', ({ target, clientX, clientY }) => {
  const noteId = $view.dataset.id
  // Go into 'fancy' mode, i.e. display rendered HTML.
  // (HTMLifies the current Markdown.)
  if ($view.classList.toggle('fancy')) {
    // Insert backspace character at cursor position. (This survives Markdown
    // conversion, and we late insert an element to scroll to here.)
    const scrollToMouse = caret != null        // non-nullish
    localNotes.set({
      id     : noteId,
      text   : target.value,
      updated: Math.round(Date.now() / 1000),
    }) // FIXME: Handle failure to write note
    const noteText = scrollToMouse
      ? (x => x.slice(0, caret) + '\b' + x.slice(caret))(target.value)
      : target.value
    htmlifyMarkdown($view, noteText)

    // Jump to the position user clicked on in Markdown.
    if (scrollToMouse) {
      const $anchor = $view.querySelector('[caret]')
      const anchorBox = $anchor.getBoundingClientRect()
      $view.scrollTo({
        top:  $view.scrollTop  + anchorBox.top  - clientY,
        left: $view.scrollLeft + anchorBox.left - clientX,
      })
    }
    return
  }

  // Go into non-'fancy' mode, i.e. display Markdown source.
  // (Loads the current note from localStorage and displays it.)
  // FIXME: Can we jump to the position the user clicked on here too?
  localNotes.get(noteId).then(note => {
    showSource(note.text)
  })
})

//EOF
