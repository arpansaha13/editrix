import { Editrix } from '@editrix/core'
import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <h1>Editrix Demo</h1>
  <div class="container">
    <div>
      <button id="bold">Bold</button>
    </div>
    <div id="editor"></div>
  </div>
`

const editor = new Editrix('#editor')

document
  .querySelector<HTMLButtonElement>('button#bold')!
  .addEventListener('click', editor.applyBold)
