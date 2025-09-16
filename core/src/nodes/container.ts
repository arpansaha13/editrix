import type { BlockNode } from './block'
import { EDITRIX_DATA_ID } from '../constants'

export class ContainerNode {
  private readonly id: string
  private readonly children: BlockNode[]
  private readonly attributes: Map<string, string>
  private readonly parent: ContainerNode | null
  private readonly tagName: string

  constructor(tagName: string, parent: ContainerNode | null) {
    this.id = Math.random().toString(36).substring(2, 9)
    this.children = []
    this.attributes = new Map()
    this.parent = parent
    this.tagName = tagName

    this.setAttribute(EDITRIX_DATA_ID, this.id)
  }

  getId(): string {
    return this.id
  }

  getTagName(): string {
    return this.tagName
  }

  appendChild(child: BlockNode) {
    this.children.push(child)
  }

  insertChildAfter(newNode: BlockNode, referenceNode: BlockNode) {
    const index = this.children.findIndex(
      child => child.getId() === referenceNode.getId(),
    )
    if (index !== -1) {
      this.children.splice(index + 1, 0, newNode)
    }
  }

  removeChild(child: BlockNode) {
    const index = this.children.findIndex(
      node => node.getId() === child.getId(),
    )
    if (index !== -1) {
      this.children.splice(index, 1)
    }
  }

  getParent(): ContainerNode | null {
    return this.parent
  }

  getChildren(): BlockNode[] {
    return this.children
  }

  setAttribute(name: string, value: string) {
    this.attributes.set(name, value)
  }

  getAttribute(name: string): string | undefined {
    return this.attributes.get(name)
  }

  getAttributes(): Map<string, string> {
    return this.attributes
  }
}
