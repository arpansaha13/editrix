import { Engine, type EngineOptions } from './engine'
import { DomRenderer } from './renderers/dom'
import { CaretManager } from './renderers/caretManager'
import { CommandRegistry } from './bindings/commandBinding'
import { createDefaultKeyBindings } from './engine/defaultKeyBindings'

export class Editrix {
  private readonly engine: Engine

  constructor(selector: string) {
    const container = document.querySelector<HTMLElement>(selector)
    if (!container) {
      throw new Error(`Container not found with selector: ${selector}`)
    }

    // Create dependencies
    const renderer = new DomRenderer(container)
    const caretManager = new CaretManager('') // The ID will be set when the root node is created
    const commandRegistry = new CommandRegistry()
    const keyBindingRegistry = createDefaultKeyBindings()

    // Initialize Engine with dependencies
    const options: EngineOptions = {
      container,
      renderer,
      caretManager,
      commandRegistry,
      keyBindingRegistry,
    }
    this.engine = new Engine(options)
  }

  applyBold() {
    this.engine.applyBold()
  }

  restoreFocus() {
    this.engine.restoreFocus()
  }
}
