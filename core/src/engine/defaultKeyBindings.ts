import { EditorCommands } from '../bindings/commands'
import { KeyBinding, KeyBindingRegistry, KeyCombo } from '../bindings/keyBinding'

export function createDefaultKeyBindings(): KeyBindingRegistry {
  const registry = new KeyBindingRegistry()

  // Text formatting
  registry.addBinding(new KeyBinding(new KeyCombo('b', true), EditorCommands.BOLD))

  // Navigation and editing
  registry.addBinding(new KeyBinding(new KeyCombo('Enter'), EditorCommands.ENTER))
  registry.addBinding(new KeyBinding(new KeyCombo('Backspace'), EditorCommands.BACKSPACE))

  // Arrow keys for cursor movement
  registry.addBinding(new KeyBinding(new KeyCombo('ArrowLeft'), EditorCommands.MOVE_CURSOR))
  registry.addBinding(new KeyBinding(new KeyCombo('ArrowRight'), EditorCommands.MOVE_CURSOR))
  registry.addBinding(new KeyBinding(new KeyCombo('ArrowUp'), EditorCommands.MOVE_CURSOR))
  registry.addBinding(new KeyBinding(new KeyCombo('ArrowDown'), EditorCommands.MOVE_CURSOR))

  return registry
}
