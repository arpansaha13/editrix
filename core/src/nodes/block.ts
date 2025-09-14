import { EDITRIX_DATA_ID, ZERO_WIDTH_SPACE } from '../constants'
import { isBlockNodeTag } from '../utils'
import type { HtmlTagName } from '../types'
import type { ContainerNode } from './container'

export class BlockNode {
  private readonly id: string
  private readonly attributes: Map<string, string>
  private tagName: HtmlTagName
  private textContent: string
  private readonly parent: ContainerNode

  constructor(tagName: HtmlTagName, parent: ContainerNode) {
    if (!isBlockNodeTag(tagName)) {
      throw new Error(`Invalid tag for block node: ${tagName}`)
    }

    this.id = Math.random().toString(36).substring(2, 9)
    this.attributes = new Map()
    this.parent = parent
    this.tagName = tagName
    this.textContent = ZERO_WIDTH_SPACE

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

  remove() {
    this.parent.removeChild(this)
  }

  getParent(): ContainerNode {
    return this.parent
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
