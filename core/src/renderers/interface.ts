import type { BlockNode } from '../nodes/block'

export interface Renderer {
  /**
   * Mounts the root BlockNode to the container
   */
  mount(blockNode: BlockNode): HTMLElement

  /**
   * Creates a new DOM node from a BlockNode under the specified parent
   * @param blockNode The BlockNode to create a DOM node for
   * @param parentSelector Selector for the parent DOM node
   * @param siblingSelector Optional selector for the sibling after which to insert
   */
  createNode(blockNode: BlockNode, parentSelector: string, siblingSelector?: string): HTMLElement

  /**
   * Updates an existing DOM node with BlockNode changes
   */
  updateNode(blockNode: BlockNode): void

  /**
   * Removes a DOM node by its corresponding BlockNode ID
   * @param blockNodeId The ID of the BlockNode whose DOM node should be removed
   */
  deleteNode(blockNodeId: string): void
}

export interface CursorPosition {
  blockNodeId: string
  offset: number
}