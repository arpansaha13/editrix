import type { EditorCommands } from './commands'

export interface ICommandRegistry {
  register(command: string, handler: (...args: any[]) => void): void
  get(command: string): ((...args: any[]) => void) | null
}

export interface IKeyBindingRegistry {
  getCommand(event: KeyboardEvent): EditorCommands | null
}
