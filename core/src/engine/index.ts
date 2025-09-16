import { TextRun } from '../nodes/textRun'
import { BlockNode } from '../nodes/block'
import { ContainerNode } from '../nodes/container'
import { EditorCommands } from '../bindings/commands'
import { isTypeableCharacter } from '../utils'
import { CaretDirection } from '../renderers/types'
import { EDITRIX_DATA_ID, ZERO_WIDTH_SPACE } from '../constants'
import type { IRenderer, ICaretManager } from '../renderers/interfaces'
import type { ICommandRegistry, IKeyBindingRegistry } from '../bindings/interfaces'

export interface EngineOptions {
  container: HTMLElement
  renderer: IRenderer
  caretManager: ICaretManager
  commandRegistry: ICommandRegistry
  keyBindingRegistry: IKeyBindingRegistry
}

export class Engine {
  private readonly container: HTMLElement
  private readonly root: ContainerNode
  private readonly renderer: IRenderer
  private readonly caretManager: ICaretManager
  private readonly commandRegistry: ICommandRegistry
  private readonly keyBindingRegistry: IKeyBindingRegistry
  private currentNode: BlockNode | null = null
  private cursorOffset = 0

  constructor(options: EngineOptions) {
    this.container = options.container
    this.renderer = options.renderer
    this.caretManager = options.caretManager
    this.commandRegistry = options.commandRegistry
    this.keyBindingRegistry = options.keyBindingRegistry

    this.root = new ContainerNode('article', null)
    const initialParagraph = new BlockNode('p', this.root)
    this.root.appendChild(initialParagraph)

    this.renderer.mount(this.root)

    this.setupEventListeners()
    this.setupCommands()

    this.currentNode = initialParagraph
  }

  private setupCommands() {
    // Text formatting
    this.commandRegistry.register(EditorCommands.BOLD, this.applyBold.bind(this))

    // Navigation and editing
    this.commandRegistry.register(EditorCommands.ENTER, this.handleEnterKey.bind(this))
    this.commandRegistry.register(EditorCommands.BACKSPACE, this.handleBackspace.bind(this))
    this.commandRegistry.register(EditorCommands.MOVE_CURSOR, this.updateCursorOffset.bind(this))
  }

  private readonly eventHandlers = {
    click: (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const blockNodeId = target.getAttribute(EDITRIX_DATA_ID)
      if (blockNodeId) {
        const node = this.findBlockNode(blockNodeId, this.root)
        if (!node) return

        this.currentNode = node
        // Get cursor position relative to the node
        const range = this.caretManager.getRangeFromPoint(e.clientX, e.clientY)
        if (range) {
          this.cursorOffset = range.startOffset
          this.caretManager.setCursorPosition(blockNodeId, this.cursorOffset)
        }
      }
    },

    keydown: (e: KeyboardEvent) => {
      const command = this.keyBindingRegistry.getCommand(e)
      if (command) {
        e.preventDefault()
        const commandFn = this.commandRegistry.get(command)
        if (commandFn) commandFn(e)
        return
      }

      if (isTypeableCharacter(e)) {
        e.preventDefault()
        this.updateTextContent(e)
      }
    },
  }

  private setupEventListeners() {
    if (this.container) {
      this.container.addEventListener('click', this.eventHandlers.click)
      this.container.addEventListener('keydown', this.eventHandlers.keydown)
    }
  }

  private findBlockNode(blockNodeId: string, container: ContainerNode): BlockNode | null {
    // First check immediate children of this container
    const directChild = container.getChildren().find(child => child.getId() === blockNodeId)
    if (directChild) return directChild

    // If not found in immediate children, check nested containers (if we add those later)
    return null
  }

  private updateTextContent(e: KeyboardEvent) {
    if (!this.currentNode) return

    const runs = this.currentNode.getRuns()
    let totalOffset = 0
    let currentRun: TextRun | null = null

    // Find which run contains the cursor
    for (const element of runs) {
      const run = element
      const runLength = run.getText().length
      if (totalOffset + runLength >= this.cursorOffset) {
        currentRun = run
        break
      }
      totalOffset += runLength
    }

    if (!currentRun) return

    // Calculate offset within the current run
    const runOffset = this.cursorOffset - totalOffset
    const text = currentRun.getText()
    const beforeText = text.slice(0, runOffset)
    const afterText = text.slice(runOffset)

    // Insert character at current run offset
    currentRun.setText(beforeText + e.key + afterText)
    this.renderer.updateNode(this.currentNode)

    // Because of ZERO_WIDTH_SPACE the initial cursorOffset will be 1 when the run is empty
    if (!beforeText.startsWith(ZERO_WIDTH_SPACE)) {
      this.cursorOffset++
      this.caretManager.setCursorPosition(this.currentNode.getId(), this.cursorOffset)
    }
  }

  private updateCursorOffset(e: KeyboardEvent) {
    if (!this.currentNode) return

    let newPosition: ReturnType<ICaretManager['setCursorPosition']> = null

    if (e.key === 'ArrowLeft') {
      newPosition = this.caretManager.setCursorPosition(
        this.currentNode.getId(),
        this.cursorOffset,
        CaretDirection.LEFT,
      )
    } else if (e.key === 'ArrowRight') {
      newPosition = this.caretManager.setCursorPosition(
        this.currentNode.getId(),
        this.cursorOffset,
        CaretDirection.RIGHT,
      )
    } else if (e.key === 'ArrowUp') {
      newPosition = this.caretManager.setCursorPosition(this.currentNode.getId(), this.cursorOffset, CaretDirection.UP)
    } else if (e.key === 'ArrowDown') {
      newPosition = this.caretManager.setCursorPosition(
        this.currentNode.getId(),
        this.cursorOffset,
        CaretDirection.DOWN,
      )
    }

    if (newPosition) {
      this.cursorOffset = newPosition.offset
      const blockNode = this.findBlockNode(newPosition.blockNodeId, this.root)
      if (blockNode) {
        this.currentNode = blockNode
      }
    }
  }

  private handleEnterKey() {
    if (!this.currentNode) return

    const runs = this.currentNode.getRuns()
    let totalOffset = 0
    let currentRunIndex = 0
    let currentRun = runs[0]

    // Find which run contains the cursor
    for (let i = 0; i < runs.length; i++) {
      const run = runs[i]
      const runLength = run.getText().length
      if (totalOffset + runLength >= this.cursorOffset) {
        currentRunIndex = i
        currentRun = run
        break
      }
      totalOffset += runLength
    }

    if (!currentRun) return

    // Calculate offset within the current run
    const runOffset = this.cursorOffset - totalOffset
    const splitRun = this.currentNode.splitRunAtOffset(currentRunIndex, runOffset) ?? new TextRun('')

    const parent = this.currentNode.getParent()
    if (!parent) return

    const newNode = new BlockNode(this.currentNode.getTagName(), parent)

    // Handle split run - preserve bold formatting
    if (currentRun.isBold()) {
      splitRun.setBold(true)
    }

    // Move remaining runs to new node
    const remainingRuns = this.currentNode.removeRunsFrom(currentRunIndex + 1)
    remainingRuns.unshift(splitRun)

    newNode.insertRunsAt(remainingRuns, 0)

    parent.insertChildAfter(newNode, this.currentNode)

    this.renderer.createNode(
      newNode,
      `[${EDITRIX_DATA_ID}="${parent.getId()}"]`,
      `[${EDITRIX_DATA_ID}="${this.currentNode.getId()}"]`,
    )

    this.renderer.updateNode(this.currentNode)

    // Update current node and cursor
    this.currentNode = newNode
    this.cursorOffset = 0
    this.caretManager.setCursorPosition(newNode.getId(), this.cursorOffset)

    // Set cursor to beginning of new node
    const newElement = document.querySelector(`[${EDITRIX_DATA_ID}="${newNode.getId()}"]`)
    if (newElement) {
      const range = document.createRange()
      const selection = window.getSelection()
      range.setStart(newElement, 0)
      range.collapse(true)
      selection?.removeAllRanges()
      selection?.addRange(range)
    }
  }

  /**
   * Restore cursor position to the current node and offset
   */
  restoreFocus() {
    if (!this.currentNode) return
    this.caretManager.setCursorPosition(this.currentNode.getId(), this.cursorOffset)
  }

  /**
   * Create an empty bold text run at current cursor position
   */
  applyBold() {
    if (!this.currentNode) return

    const runs = this.currentNode.getRuns()
    let totalOffset = 0
    let currentRunIndex = 0
    let currentRun = runs[0]

    // Find which run contains the cursor
    for (let i = 0; i < runs.length; i++) {
      const run = runs[i]
      const runLength = run.getText().length
      if (totalOffset + runLength >= this.cursorOffset) {
        currentRunIndex = i
        currentRun = run
        break
      }
      totalOffset += runLength
    }

    if (!currentRun) return

    // Create a new empty bold run
    const runOffset = this.cursorOffset - totalOffset
    const emptyRun = new TextRun('')
    emptyRun.setBold(true)

    if (runOffset === currentRun.getText().length) {
      // Insert after current run
      this.currentNode.insertTextRun(emptyRun, currentRunIndex + 1)
      currentRunIndex++
    } else {
      // Split current run and insert between
      const splitRun = this.currentNode.splitRunAtOffset(currentRunIndex, runOffset)
      this.currentNode.insertTextRun(emptyRun, currentRunIndex + 1)
      if (splitRun) {
        this.currentNode.insertTextRun(splitRun, currentRunIndex + 2)
      }
      currentRunIndex++
    }

    // Update cursor to empty run
    this.cursorOffset = totalOffset + runOffset + 1
    this.renderer.updateNode(this.currentNode)
    this.restoreFocus()
  }

  private handleBackspace() {
    if (!this.currentNode) return

    // If at the beginning of current node, try to merge with previous sibling
    if (this.cursorOffset === 0) {
      const parent = this.currentNode.getParent()
      if (!parent) return

      // Store current node info as it will be reassigned
      const nodeToDelete = this.currentNode
      const siblings = parent.getChildren()
      const currentIndex = siblings.findIndex((child: BlockNode) => {
        const id = child.getId()
        const nodeId = nodeToDelete.getId()
        return id !== undefined && nodeId !== undefined && id === nodeId
      })
      if (currentIndex <= 0) return // No previous sibling

      const prevSibling = siblings[currentIndex - 1]
      if (!prevSibling) return

      const prevRuns = prevSibling.getRuns()
      const lastPrevRun = prevRuns[prevRuns.length - 1]
      const firstCurrentRun = nodeToDelete.getRuns()[0]

      // Set cursor position to end of previous sibling's last run
      const prevText = prevSibling.getTextContent()
      this.cursorOffset = prevText.length
      this.currentNode = prevSibling

      // Merge the last run of previous sibling with first run of current node
      if (lastPrevRun && firstCurrentRun) {
        const insertAtIndex = prevRuns.length
        prevSibling.insertTextRun(firstCurrentRun, insertAtIndex)
        prevSibling.mergeRuns(insertAtIndex - 1, insertAtIndex)
      }

      // Move remaining runs to previous sibling
      const remainingRuns = nodeToDelete.removeRunsFrom(1)
      prevSibling.insertRunsAt(remainingRuns, prevSibling.getRuns().length)

      // Remove current node from virtual and real DOM
      siblings.splice(currentIndex, 1)
      const id = nodeToDelete.getId()
      if (id) {
        this.renderer.deleteNode(id)
      }

      // Update renderer and cursor position
      this.renderer.updateNode(prevSibling)
      const prevId = prevSibling.getId()
      if (prevId) {
        this.caretManager.setCursorPosition(prevId, this.cursorOffset)
      }
      return
    }

    // Normal backspace within the current node
    const runs = this.currentNode.getRuns()
    let totalOffset = 0
    let currentRunIndex = 0
    let currentRun = runs[0]

    // Find which run contains the cursor
    for (let i = 0; i < runs.length; i++) {
      const run = runs[i]
      const runLength = run.getText().length
      if (totalOffset + runLength >= this.cursorOffset) {
        currentRunIndex = i
        currentRun = run
        break
      }
      totalOffset += runLength
    }

    if (!currentRun) return

    // Calculate offset within the current run
    const runOffset = this.cursorOffset - totalOffset

    if (runOffset === 0 && currentRunIndex > 0) {
      // We're at the beginning of a run that's not the first run
      // Merge with previous run
      const prevRunIndex = currentRunIndex - 1
      this.currentNode.mergeRuns(prevRunIndex, currentRunIndex)
      this.cursorOffset--
    } else {
      // Normal backspace within a run
      const text = currentRun.getText()
      const newText = text.slice(0, runOffset - 1) + text.slice(runOffset)
      currentRun.setText(newText)
      this.cursorOffset--
    }

    this.renderer.updateNode(this.currentNode)
    const id = this.currentNode.getId()
    if (id) {
      this.caretManager.setCursorPosition(id, this.cursorOffset)
    }
  }
}
