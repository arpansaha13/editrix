export enum EditorCommands {
  BOLD = 'BOLD',
  ENTER = 'ENTER',
  BACKSPACE = 'BACKSPACE',
  MOVE_CURSOR = 'MOVE_CURSOR',
}

export type OverridableEditorCommands = Extract<
  EditorCommands,
  EditorCommands.BOLD // for example
>
