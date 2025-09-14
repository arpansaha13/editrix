import type { BlockNode } from '../nodes/block'
import type { ContainerNode } from '../nodes/container'

export interface Renderer {
  /**
   * Mounts the root ContainerNode to the container
   */
  mount(node: ContainerNode): HTMLElement

  /**
   * Creates a new DOM node from a BlockNode under the specified parent
   * @param node The BlockNode to create a DOM node for
   * @param parentSelector Selector for the parent DOM node
   * @param siblingSelector Optional selector for the sibling after which to insert
   */
  createNode(node: BlockNode, parentSelector: string, siblingSelector?: string): HTMLElement

  /**
   * Updates an existing DOM node with BlockNode changes
   */
  updateNode(node: BlockNode): void

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
