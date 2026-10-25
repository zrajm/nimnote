// -*- mode: js; js-indent-level: 2; -*-
// Copyright (c) 2026 by zrajm. License: GPLv2.
//
// Insert search form into <nav>. On search, hide non-matching menu items by
// adding the 'hidden' attribute.

import { html } from './shared.js'
// import noteCache from './notecache.js'

/* Floating Action Button */
const [$button, $style] = html(
`<button class="fab" aria-label="Create new">
  <svg width="24" height="24" viewBox="0 0 8 8">
    <path stroke="currentColor" d="M4 0v8M0 4h8"/></svg></button>
<style>.fab {
  touch-action: manipulation;
  position: fixed; right: 24px; bottom: 24px;
  width: 56px; height: 56px; border: none; border-radius: 50%;
  color: var(--on-accent); background: var(--accent);
  display: flex; & svg { margin: auto }
  box-shadow: 0 4px 12px #0008;
  &:hover {
    background: var(--accent-hover);
    box-shadow: 0 6px 16px #0008;
  }
  &:active { transform: scale(0.92) }
  &:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px }
}</style>`)

document.body.append($button, $style)

$button.addEventListener('click', e => {
  console.log('Will create new note')
})

//EOF
