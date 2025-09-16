import type { EditorCommands } from './commands'

type CommandFn = (e: KeyboardEvent) => void

export class CommandRegistry {
  private readonly commands: Map<EditorCommands, CommandFn> = new Map()

  register(name: EditorCommands, command: CommandFn): void {
    this.commands.set(name, command)
  }

  get(name: EditorCommands): CommandFn | null {
    return this.commands.get(name) ?? null
  }
}
