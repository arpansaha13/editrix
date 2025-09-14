import { EDITRIX_DATA_ID, ZERO_WIDTH_SPACE } from '../constants'
import { isContentTag } from '../utils'
import type { HtmlTagName } from '../types'

export class BlockNode {
  private readonly id: string
  private readonly children: BlockNode[]
  private readonly attributes: Map<string, string>
  private tagName: HtmlTagName
  private textContent: string
  private parent: BlockNode | null

  constructor(tagName: HtmlTagName, parent: BlockNode | null) {
    this.id = Math.random().toString(36).substring(2, 9)
    this.children = []
    this.attributes = new Map()
    this.parent = parent
    this.tagName = tagName
    this.textContent = isContentTag(tagName) ? ZERO_WIDTH_SPACE : ''

    this.setAttribute(EDITRIX_DATA_ID, this.id)
    this.setAttribute('contenteditable', 'true')
  }

  getId(): string {
    return this.id
  }

  getTagName(): HtmlTagName {
    return this.tagName
  }

  setTagName(tagName: HtmlTagName) {
    this.tagName = tagName
  }

  getTextContent(): string {
    return this.textContent
  }

  setTextContent(text: string) {
    if (text === '') {
      this.textContent = ZERO_WIDTH_SPACE
    } else if (text.startsWith(ZERO_WIDTH_SPACE)) {
      this.textContent = text.slice(1)
    } else if (text.endsWith(ZERO_WIDTH_SPACE)) {
      this.textContent = text.slice(0, text.length - 1)
    } else {
      this.textContent = text
    }
  }

  appendChild(child: BlockNode) {
    child.parent = this
    this.children.push(child)
  }

  /**
   * Insert new node after the reference node
   * @param newNode The node to insert
   * @param referenceNode The node after which the new node will be inserted
   */
  insertChildAfter(newNode: BlockNode, referenceNode: BlockNode) {
    const index = this.children.findIndex(child => child.getId() === referenceNode.getId())
    if (index !== -1) {
      this.children.splice(index + 1, 0, newNode)
    }
  }

  remove() {
    if (this.parent) {
      const index = this.parent.children.indexOf(this)
      if (index !== -1) {
        this.parent.children.splice(index, 1)
      }
      this.parent = null
    }
  }

  getParent(): BlockNode | null {
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
