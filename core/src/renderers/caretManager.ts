import { EDITRIX_DATA_ID, ZERO_WIDTH_SPACE } from '../constants';
import type { CursorPosition } from './interface';

export class CaretManager {
  private readonly rootId: string

  constructor(rootId: string) {
    this.rootId = rootId
  }

  setCursorPosition(
    blockNodeId: string,
    offset: number,
    direction?: "left" | "right" | "up" | "down"
  ): CursorPosition | null {
    const element = document.querySelector(`[data-editrix-id="${blockNodeId}"]`);
    if (!element) return null;

    const sel = window.getSelection();
    if (!sel) return null;

    if (direction && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);

      if (direction === "left" || direction === 'right') {
        return this.handleHorizontalMove(sel, range, direction);
      }

      return this.handleVerticalMove(sel, range, element, direction);
    }

    return this.setExplicitCursor(sel, element, offset);
  }

  private handleHorizontalMove(
    sel: Selection,
    range: Range,
    direction: "left" | "right"
  ): CursorPosition | null {
    let node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) return null;

    const textLength = node.textContent?.length ?? 0;
    let newOffset =
      direction === "left" ? range.startOffset - 1 : range.startOffset + 1;

    if (newOffset < 0) {
      const neighbor = this.moveToNeighbor(node, false);
      if (neighbor) {
        node = neighbor.node;
        newOffset = neighbor.offset;
      } else {
        newOffset = 0;
      }
    } else if (newOffset > textLength) {
      const neighbor = this.moveToNeighbor(node, true);
      if (neighbor) {
        node = neighbor.node;
        newOffset = neighbor.offset;
      } else {
        newOffset = textLength;
      }
    }

    this.applyRange(sel, node, newOffset);
    const blockNodeId = this.getBlockNodeIdFromNode(node);
    return blockNodeId ? { blockNodeId, offset: newOffset } : null;
  }

  private handleVerticalMove(
    sel: Selection,
    range: Range,
    element: Element,
    direction: "up" | "down"
  ): CursorPosition | null {
    const rect = range.getBoundingClientRect();
    const lineHeight = parseFloat(getComputedStyle(element).lineHeight || "16");
    const x = rect.left;
    const y = direction === "up" ? rect.top - lineHeight : rect.bottom + lineHeight;

    const newRange = this.getRangeFromPoint(x, y);
    if (!newRange) return null;

    sel.removeAllRanges();
    sel.addRange(newRange);

    const blockNodeId = this.getBlockNodeIdFromNode(newRange.startContainer);
    return blockNodeId ? { blockNodeId, offset: newRange.startOffset } : null;
  }

  private setExplicitCursor(
    sel: Selection,
    element: Element,
    offset: number
  ): CursorPosition | null {
    let textNode: Node | null = null;
    for (const node of element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        textNode = node;
        break;
      }
    }

    if (!textNode) {
      textNode = document.createTextNode(ZERO_WIDTH_SPACE);
      element.appendChild(textNode);
      offset = 0;
    }

    const maxOffset = textNode.textContent?.length ?? 0;
    const safeOffset = Math.max(0, Math.min(offset, maxOffset));

    this.applyRange(sel, textNode, safeOffset);

    const blockNodeId = this.getBlockNodeIdFromNode(textNode);
    return blockNodeId ? { blockNodeId, offset: safeOffset } : null;
  }

  /**
   * Gets a Range object from x,y coordinates
   * @param x The x-coordinate
   * @param y The y-coordinate
   * @returns A Range object or null if unable to create range
   */
  getRangeFromPoint(x: number, y: number): Range | null {
    if (document.caretRangeFromPoint) {
      return document.caretRangeFromPoint(x, y);
    }

    if (document.caretPositionFromPoint) {
      const pos = document.caretPositionFromPoint(x, y);
      if (pos) {
        const range = document.createRange();
        range.setStart(pos.offsetNode, pos.offset);
        range.collapse(true);
        return range;
      }
    }

    return null;
  }

  /**
   * Moves the caret to the nearest neighboring text node in the given direction.
   *
   * - If a sibling text node exists at the same level, returns that node with the
   *   caret placed at the beginning (for forward) or end (for backward).
   * - If no text sibling exists, climbs to the parent element (e.g. a <p>) and
   *   attempts to move to its next/previous sibling. If found, selects the first
   *   (for forward) or last (for backward) text node inside that sibling element.
   *
   * @param node The current text node where the caret is located.
   * @param forward Direction of movement. `true` for right/forward, `false` for left/backward.
   * @returns The target text node and the new caret offset, or `null` if no valid neighbor exists.
   */
  private moveToNeighbor(node: Node, forward: boolean): { node: Node; offset: number } | null {
    const parentSiblingNodeTypes: number[] = [Node.ELEMENT_NODE, Node.TEXT_NODE]

    /** Helper function to find deepest text node in an element */
    const findDeepestTextNode = (element: Node): Node | null => {
      let target: Node | null = forward ? element.firstChild : element.lastChild
      while (target && target.nodeType !== Node.TEXT_NODE) {
        if (target.nodeType === Node.ELEMENT_NODE) {
          target = forward ? target.firstChild : target.lastChild
        } else {
          target = forward ? target.nextSibling : target.previousSibling
        }
      }
      return target
    }

    /** Helper function to check if a node contains the text node we're looking for */
    const findTextNodeInElement = (node: Node): Node | null => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        return findDeepestTextNode(node)
      }
      return null
    }

    /** Helper function to recursively climb up the tree looking for siblings */
    const findSiblingInAncestors = (node: Node): Node | null => {
      const parent = node.parentNode
      if (!parent) return null

      // Check if we've reached the root element
      if (parent instanceof Element && parent.getAttribute(EDITRIX_DATA_ID) === this.rootId) {
        return null
      }

      let parentSibling: Node | null = forward ? parent.nextSibling : parent.previousSibling;
      // Skip non-element nodes (whitespace/newlines, comment nodes, etc.)
      while (parentSibling && !parentSiblingNodeTypes.includes(parentSibling.nodeType)) {
        parentSibling = forward ? parentSibling.nextSibling : parentSibling.previousSibling;
      }
      if (!parentSibling) return null;

      const textNode = findTextNodeInElement(parentSibling)
      if (textNode) return textNode

      return findSiblingInAncestors(parent)
    }

    function findSibling(node: Node): Node | null {
      let sibling = forward ? node.nextSibling : node.previousSibling
      while (sibling) {
        const textNode = findTextNodeInElement(sibling)
        if (textNode) return textNode
        sibling = forward ? sibling.nextSibling : sibling.previousSibling
      }
      return null
    }

    let nextNode = findSibling(node)
    if (!nextNode) {
      nextNode = findSiblingInAncestors(node)
    }
    if (!nextNode) return null

    const textLength = nextNode.textContent?.length ?? 0
    return {
      node: nextNode,
      offset: forward ? 0 : textLength
    }
  }

  private getBlockNodeIdFromNode(node: Node): string | null {
    let el: Node | null = node;
    while (el && el.nodeType === Node.TEXT_NODE) {
      el = el.parentNode;
    }
    if (el instanceof Element) {
      return el.closest("[data-editrix-id]")?.getAttribute("data-editrix-id") ?? null;
    }
    return null;
  }

  private applyRange(sel: Selection, node: Node, offset: number) {
    const newRange = document.createRange();
    newRange.setStart(node, offset);
    newRange.collapse(true);

    sel.removeAllRanges();
    sel.addRange(newRange);
  }
}
