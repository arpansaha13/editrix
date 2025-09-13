import { VNode } from '../vnode/vnode'

export interface Renderer {
  /**
   * Mounts the root VNode to the container
   */
  mount(vnode: VNode): HTMLElement

  /**
   * Creates a new DOM node from a VNode under the specified parent
   * @param vnode The VNode to create a DOM node for
   * @param parentSelector Selector for the parent DOM node
   * @param siblingSelector Optional selector for the sibling after which to insert
   */
  createNode(vnode: VNode, parentSelector: string, siblingSelector?: string): HTMLElement

  /**
   * Updates an existing DOM node with VNode changes
   */
  updateNode(vnode: VNode): void

  /**
   * Removes a DOM node by its corresponding VNode ID
   * @param vnodeId The ID of the VNode whose DOM node should be removed
   */
  deleteNode(vnodeId: string): void
}

export interface CursorPosition {
  vnodeId: string
  offset: number
}