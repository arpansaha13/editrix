import { Engine, type EngineOptions } from './engine'
import { DomRenderer } from './renderers/dom'
import { CaretManager } from './renderers/caretManager'
import { CommandRegistry } from './bindings/commandBinding'
import { KeyBindingRegistry, type KeyCombo } from './bindings/keyBinding'
import type { OverridableEditorCommands } from './bindings/commands'

export interface IEditrixOptions {
  overrides?: {
    keyBindings?: Record<OverridableEditorCommands, KeyCombo>
  }
}

export class Editrix {
  private readonly engine: Engine

  constructor(selector: string, options?: IEditrixOptions) {
    const container = document.querySelector<HTMLElement>(selector)
    if (!container) {
      throw new Error(`Container not found with selector: ${selector}`)
    }

    const renderer = new DomRenderer(container)
    const caretManager = new CaretManager('') // The ID will be set when the root node is created
    const commandRegistry = new CommandRegistry()
    const keyBindingRegistry = KeyBindingRegistry.build(
      options?.overrides?.keyBindings,
    )

    const engineOptions: EngineOptions = {
      container,
      renderer,
      caretManager,
      commandRegistry,
      keyBindingRegistry,
    }
    this.engine = new Engine(engineOptions)
  }

  applyBold() {
    this.engine.applyBold()
  }

  restoreFocus() {
    this.engine.restoreFocus()
  }
}
