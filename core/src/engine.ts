import { VNode } from './vnode/vnode'
import { DomRenderer } from './renderers/renderer'
import { EDITRIX_DATA_ID, ZERO_WIDTH_SPACE } from './constants'
import { isArrowKey, isTypeableCharacter } from './utils'
import { CaretManager } from './renderers/caretManager'

export class Editrix {
  private readonly container: HTMLElement | null = null
  private readonly renderer: DomRenderer = null!
  private readonly caretManager: CaretManager = null!
  private readonly root: VNode
  private currentNode: VNode | null = null
  private cursorOffset = 0

  constructor(selector: string) {
    this.container = document.querySelector<HTMLElement>(selector)
    if (!this.container) {
      throw new Error(`Container not found with selector: ${selector}`)
    }

    this.root = new VNode('article', null)
    const initialParagraph = new VNode('p', this.root)
    this.root.appendChild(initialParagraph)

    this.renderer = new DomRenderer(this.container)
    this.renderer.mount(this.root)

    this.caretManager = new CaretManager()

    this.setupEventListeners()

    this.currentNode = initialParagraph
  }

  private readonly eventHandlers = {
    click: (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const editrixId = target.getAttribute(EDITRIX_DATA_ID)
      if (editrixId) {
        this.findNodeAndUpdateCursor(editrixId, e)
      }
    },

    keydown: (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        this.handleEnterKey()
      }
      else if (e.key === "Backspace") {
        e.preventDefault()
        this.handleBackspace()
      }
      else if (isTypeableCharacter(e)) {
        e.preventDefault()
        this.updateTextContent(e)
      }
      else if (isArrowKey(e.key)) {
        e.preventDefault()
        this.updateCursorOffset(e)
      }
    }
  }

  private setupEventListeners() {
    if (this.container) {
      this.container.addEventListener('click', this.eventHandlers.click)
      this.container.addEventListener('keydown', this.eventHandlers.keydown)
    }
  }

  private findVNode(vnodeId: string, node: VNode): VNode | null {
    if (node.getId() === vnodeId) return node
    for (const child of node.getChildren()) {
      const found = this.findVNode(vnodeId, child)
      if (found) return found
    }
    return null
  }

  private findNodeAndUpdateCursor(vnodeId: string, event: MouseEvent) {
    const node = this.findVNode(vnodeId, this.root)
    if (node) {
      this.currentNode = node
      // Get cursor position relative to the node
      const range = document.caretRangeFromPoint(event.clientX, event.clientY)
      if (range) {
        this.cursorOffset = range.startOffset
      }
    }
  }

  private updateTextContent(e: KeyboardEvent) {
    if (!this.currentNode) return

    const currentText = this.currentNode.getTextContent()
    const beforeText = currentText.slice(0, this.cursorOffset)
    const afterText = currentText.slice(this.cursorOffset)

    // Insert character at cursorOffset
    this.currentNode.setTextContent(beforeText + e.key + afterText)
    this.renderer.updateNode(this.currentNode)

    // Because of ZERO_WIDTH_SPACE the initial cursorOffset will be 1 when the node is empty
    if (!beforeText.startsWith(ZERO_WIDTH_SPACE)) {
      this.cursorOffset++
      this.caretManager.setCursorPosition(this.currentNode.getId(), this.cursorOffset)
    }
  }

  private updateCursorOffset(e: KeyboardEvent) {
    if (!this.currentNode) return

    let newPosition: ReturnType<CaretManager['setCursorPosition']> = null

    if (e.key === 'ArrowLeft') {
      newPosition = this.caretManager.setCursorPosition(this.currentNode.getId(), this.cursorOffset, 'left')
    }
    else if (e.key === 'ArrowRight') {
      newPosition = this.caretManager.setCursorPosition(this.currentNode.getId(), this.cursorOffset, 'right')
    }
    else if (e.key === 'ArrowUp') {
      newPosition = this.caretManager.setCursorPosition(this.currentNode.getId(), this.cursorOffset, 'up')
    }
    else if (e.key === 'ArrowDown') {
      newPosition = this.caretManager.setCursorPosition(this.currentNode.getId(), this.cursorOffset, 'down')
    }

    if (newPosition) {
      this.cursorOffset = newPosition.offset
      const vnode = this.findVNode(newPosition.vnodeId, this.root)
      if (vnode) {
        this.currentNode = vnode
      }
    }
  }

  private handleEnterKey() {
    if (!this.currentNode) return

    const currentText = this.currentNode.getTextContent()
    const beforeText = currentText.slice(0, this.cursorOffset)
    const afterText = currentText.slice(this.cursorOffset)

    // Update original node with text before cursor
    this.currentNode.setTextContent(beforeText)
    this.renderer.updateNode(this.currentNode)

    const parent = this.currentNode.getParent()

    if (parent) {
      const newNode = new VNode(this.currentNode.getTagName(), parent)
      newNode.setTextContent(afterText)

      parent.insertChildAfter(newNode, this.currentNode)

      this.renderer.createNode(
        newNode,
        `[data-editrix-id="${parent.getId()}"]`,
        `[data-editrix-id="${this.currentNode.getId()}"]`
      )

      // Update current node and cursor
      this.currentNode = newNode
      this.cursorOffset = 0

      // Set cursor to beginning of new node
      const newElement = document.querySelector(`[data-editrix-id="${newNode.getId()}"]`)
      if (newElement) {
        const range = document.createRange()
        const selection = window.getSelection()
        range.setStart(newElement, 0)
        range.collapse(true)
        selection?.removeAllRanges()
        selection?.addRange(range)
      }
    }
  }

  private handleBackspace() {
    if (!this.currentNode) return

    // If at the beginning of current node, try to merge with previous sibling
    if (this.cursorOffset === 0) {
      const parent = this.currentNode.getParent()
      if (!parent) return

      // Store current node info as it will be reassigned
      const nodeToDelete = this.currentNode
      const currentText = nodeToDelete.getTextContent()

      const siblings = parent.getChildren()
      const currentIndex = siblings.findIndex(child => child.getId() === nodeToDelete.getId())
      if (currentIndex <= 0) return // No previous sibling

      const prevSibling = siblings[currentIndex - 1]
      const prevText = prevSibling.getTextContent()

      // Move cursor to end of previous sibling's content
      this.cursorOffset = prevText.length
      this.currentNode = prevSibling

      // Merge texts
      prevSibling.setTextContent(prevText + currentText)
      this.renderer.updateNode(prevSibling)

      // Remove current node from virtual and real DOM
      siblings.splice(currentIndex, 1)
      this.renderer.deleteNode(nodeToDelete.getId())

      // Update cursor position
      this.caretManager.setCursorPosition(prevSibling.getId(), this.cursorOffset)

      return
    }

    // Normal backspace within the current node
    const currentText = this.currentNode.getTextContent()
    const beforeText = currentText.slice(0, this.cursorOffset - 1) // exclude last character
    const afterText = currentText.slice(this.cursorOffset)

    // Update original node with text before caret
    this.currentNode.setTextContent(beforeText + afterText)
    this.renderer.updateNode(this.currentNode)

    this.cursorOffset--
    this.caretManager.setCursorPosition(this.currentNode.getId(), this.cursorOffset)
  }
}
