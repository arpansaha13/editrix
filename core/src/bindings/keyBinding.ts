import type { EditorCommands } from './commands'

const KEY_BINDING_DELIMITER = '+'

export class KeyCombo {
  constructor(
    public key: string,
    public ctrl: boolean = false,
    public meta: boolean = false,
    public alt: boolean = false,
    public shift: boolean = false,
  ) {}

  /** Create `KeyCombo` object from a `KeyboardEvent` */
  static fromEvent(e: KeyboardEvent): KeyCombo {
    return new KeyCombo(e.key, e.ctrlKey, e.metaKey, e.altKey, e.shiftKey)
  }

  toString(): string {
    const parts: string[] = []

    if (this.ctrl) parts.push('Ctrl')
    if (this.meta) parts.push('Meta')
    if (this.alt) parts.push('Alt')
    if (this.shift) parts.push('Shift')

    parts.push(this.key)

    return parts.join(KEY_BINDING_DELIMITER)
  }
}

export class KeyBinding {
  constructor(
    public combo: KeyCombo,
    public command: EditorCommands,
  ) {}
}

export class KeyBindingRegistry {
  private readonly bindings: Map<string, EditorCommands> = new Map()

  addBinding(binding: KeyBinding): void {
    this.bindings.set(binding.combo.toString(), binding.command)
  }

  getCommand(e: KeyboardEvent): EditorCommands | undefined {
    const combo = KeyCombo.fromEvent(e).toString()
    return this.bindings.get(combo)
  }
}
