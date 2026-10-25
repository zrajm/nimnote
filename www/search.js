// -*- mode: js; js-indent-level: 2; -*-
// Copyright (c) 2026 by zrajm. License: GPLv2.
//
// Insert search form into <nav>. On search, hide non-matching menu items by
// adding the 'hidden' attribute.

import { $nav, html } from './shared.js'
import localNotes from './localnotes.js'

const [$form] = html(`<form><input type=search name=q autocomplete=off placeholder=" ">`)

$nav.prepend($form)

$form.addEventListener('submit', e => {
  e.preventDefault();
  const regex = RegExp($form.elements.q.value.trim(), 'i')
  localNotes.search(regex).then(foundIds => {
    for (const $a of $nav.children) {
      const menuItemId = $a.dataset.id
      $a.hidden = menuItemId && !foundIds.has(menuItemId)
    }
  })
})

const searchIcon = new URL('search.svg', import.meta.url).href
document.body.append(...html(
`<style>
  nav > form { padding: 0; display: flex }
  input {
    flex: 1; border: 0;
    padding-left: calc(24px + 1rem); width: 100%;
    background: url('${searchIcon}') no-repeat .5rem center / 24px 24px;
    font: inherit;
    &:not(:placeholder-shown) { background-color: #8883 }
  }
</style>`))

//EOF
