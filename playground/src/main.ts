import { Editrix } from '@editrix/core'
import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="container">
    <h1>Editrix Demo</h1>
    <div id="editor"></div>
  </div>
`

const editor = new Editrix('#editor')
