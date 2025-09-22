import { EDITRIX_DATA_ID, ZERO_WIDTH_SPACE } from '../constants'
import { CaretDirection } from './types'
import type { ICaretPosition } from './interfaces'

export class CaretManager {
  private rootId: string
  private treeWalker: TreeWalker | null = null

  constructor() {
    this.rootId = ''
  }

  setRootId(id: string) {
    this.rootId = id
    this.initTreeWalker()
  }

  private initTreeWalker() {
    const rootElement = document.querySelector(
      `[${EDITRIX_DATA_ID}="${this.rootId}"]`,
    )
    if (!rootElement) return

    this.treeWalker = document.createTreeWalker(
      rootElement,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node: Node) => {
          // Skip empty text nodes
          if (!node.textContent?.trim()) {
            return NodeFilter.FILTER_SKIP
          }
          return NodeFilter.FILTER_ACCEPT
        },
      },
    )
  }

  private getNextTextNode(currentNode: Node, forward: boolean): Node | null {
    if (!this.treeWalker) {
      this.initTreeWalker()
    }
    if (!this.treeWalker) return null

    // Position the TreeWalker at the current node
    this.treeWalker.currentNode = currentNode

    // Move to next/previous node
    const nextNode = forward
      ? this.treeWalker.nextNode()
      : this.treeWalker.previousNode()
    if (!nextNode) {
      // If we hit the end/start, reset position and return null
      this.treeWalker.currentNode = currentNode
      return null
    }

    return nextNode
  }

  setCursorPosition(
    blockNodeId: string,
    offset: number,
    direction?: CaretDirection,
  ): ICaretPosition | null {
    const element = document.querySelector(
      `[${EDITRIX_DATA_ID}="${blockNodeId}"]`,
    )
    if (!element) return null

    const sel = window.getSelection()
    if (!sel) return null

    if (direction && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0)

      if (direction === 'left' || direction === 'right') {
        return this.handleHorizontalMove(sel, range, direction)
      }

      return this.handleVerticalMove(sel, range, element, direction)
    }

    return this.setExplicitCursor(sel, element, offset)
  }

  private handleHorizontalMove(
    sel: Selection,
    range: Range,
    direction: CaretDirection.LEFT | CaretDirection.RIGHT,
  ): ICaretPosition | null {
    let node = range.startContainer
    if (node.nodeType !== Node.TEXT_NODE) return null

    const textLength = node.textContent?.length ?? 0
    let newOffset =
      direction === CaretDirection.LEFT
        ? range.startOffset - 1
        : range.startOffset + 1
    let isMovingToNewNode = false

    // Moving left
    if (newOffset < 0) {
      const previousNode = this.getNextTextNode(node, false)
      if (previousNode) {
        node = previousNode
        newOffset = previousNode.textContent?.length ?? 0
        isMovingToNewNode = true
      } else {
        newOffset = 0
      }
    }
    // Moving right
    else if (newOffset > textLength) {
      const nextNode = this.getNextTextNode(node, true)
      if (nextNode) {
        node = nextNode
        newOffset = 0
        isMovingToNewNode = true
      } else {
        newOffset = textLength
      }
    }

    this.applyRange(sel, node, newOffset)

    // Only get new block node ID if we moved to a new node
    const blockNodeId = isMovingToNewNode
      ? this.getBlockNodeIdFromNode(node)
      : this.getBlockNodeIdFromNode(range.startContainer)

    return blockNodeId ? { blockNodeId, offset: newOffset } : null
  }

  private handleVerticalMove(
    sel: Selection,
    range: Range,
    element: Element,
    direction: CaretDirection.UP | CaretDirection.DOWN,
  ): ICaretPosition | null {
    const rect = range.getBoundingClientRect()
    const lineHeight = parseFloat(getComputedStyle(element).lineHeight || '16')
    const x = rect.left
    const y =
      direction === CaretDirection.UP
        ? rect.top - lineHeight
        : rect.bottom + lineHeight

    const newRange = this.getRangeFromPoint(x, y)
    if (!newRange) return null

    sel.removeAllRanges()
    sel.addRange(newRange)

    const blockNodeId = this.getBlockNodeIdFromNode(newRange.startContainer)
    return blockNodeId ? { blockNodeId, offset: newRange.startOffset } : null
  }

  private setExplicitCursor(
    sel: Selection,
    element: Element,
    offset: number,
  ): ICaretPosition | null {
    let textNode: Node | null = null
    for (const node of element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        textNode = node
        break
      }
    }

    if (!textNode) {
      textNode = document.createTextNode(ZERO_WIDTH_SPACE)
      element.appendChild(textNode)
      offset = 0
    }

    const maxOffset = textNode.textContent?.length ?? 0
    const safeOffset = Math.max(0, Math.min(offset, maxOffset))

    this.applyRange(sel, textNode, safeOffset)

    const blockNodeId = this.getBlockNodeIdFromNode(textNode)
    return blockNodeId ? { blockNodeId, offset: safeOffset } : null
  }

  /**
   * Gets a Range object from x,y coordinates
   * @param x The x-coordinate
   * @param y The y-coordinate
   * @returns A Range object or null if unable to create range
   */
  getRangeFromPoint(x: number, y: number): Range | null {
    if (document.caretRangeFromPoint) {
      return document.caretRangeFromPoint(x, y)
    }

    if (document.caretPositionFromPoint) {
      const pos = document.caretPositionFromPoint(x, y)
      if (pos) {
        const range = document.createRange()
        range.setStart(pos.offsetNode, pos.offset)
        range.collapse(true)
        return range
      }
    }

    return null
  }

  private getBlockNodeIdFromNode(node: Node): string | null {
    let el: Node | null = node
    while (el && el.nodeType === Node.TEXT_NODE) {
      el = el.parentNode
    }
    if (el instanceof Element) {
      return (
        el.closest(`[${EDITRIX_DATA_ID}]`)?.getAttribute(EDITRIX_DATA_ID) ??
        null
      )
    }
    return null
  }

  private applyRange(sel: Selection, node: Node, offset: number) {
    const newRange = document.createRange()
    newRange.setStart(node, offset)
    newRange.collapse(true)

    sel.removeAllRanges()
    sel.addRange(newRange)
  }
}
