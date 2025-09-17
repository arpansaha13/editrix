import { EditorCommands, type OverridableEditorCommands } from './commands'

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

  static build(
    overrides?: Record<OverridableEditorCommands, KeyCombo>,
  ): KeyBindingRegistry {
    const registry = new KeyBindingRegistry()

    // Text formatting
    registry.addBinding(
      new KeyBinding(
        overrides?.BOLD ?? new KeyCombo('b', true),
        EditorCommands.BOLD,
      ),
    )

    // Navigation and editing
    registry.addBinding(
      new KeyBinding(new KeyCombo('Enter'), EditorCommands.ENTER),
    )
    registry.addBinding(
      new KeyBinding(new KeyCombo('Backspace'), EditorCommands.BACKSPACE),
    )

    // Arrow keys for cursor movement
    registry.addBinding(
      new KeyBinding(new KeyCombo('ArrowLeft'), EditorCommands.MOVE_CURSOR),
    )
    registry.addBinding(
      new KeyBinding(new KeyCombo('ArrowRight'), EditorCommands.MOVE_CURSOR),
    )
    registry.addBinding(
      new KeyBinding(new KeyCombo('ArrowUp'), EditorCommands.MOVE_CURSOR),
    )
    registry.addBinding(
      new KeyBinding(new KeyCombo('ArrowDown'), EditorCommands.MOVE_CURSOR),
    )

    return registry
  }

  addBinding(binding: KeyBinding): void {
    this.bindings.set(binding.combo.toString(), binding.command)
  }

  getCommand(e: KeyboardEvent): EditorCommands | null {
    const combo = KeyCombo.fromEvent(e).toString()
    return this.bindings.get(combo) ?? null
  }
}
