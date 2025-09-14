import { BlockNode } from '../nodes/block'
import type { Renderer } from './interface'

export class DomRenderer implements Renderer {
  private readonly container: HTMLElement

  constructor(container: HTMLElement) {
    this.container = container
  }

  mount(blockNode: BlockNode) {
    const element = this.createElement(blockNode)
    this.container.appendChild(element)
    return element
  }

  private createElement(blockNode: BlockNode): HTMLElement {
    const element = document.createElement(blockNode.getTagName())

    // Set attributes
    blockNode.getAttributes().forEach((value, name) => {
      element.setAttribute(name, value)
    })

    // Set text content if any
    if (blockNode.getTextContent()) {
      element.textContent = blockNode.getTextContent()
    }

    // Create child elements
    blockNode.getChildren().forEach(child => {
      element.appendChild(this.createElement(child))
    })

    return element
  }

  createNode(blockNode: BlockNode, parentSelector: string, siblingSelector?: string): HTMLElement {
    const parent = document.querySelector(parentSelector)
    if (!parent) {
      throw new Error(`Parent element not found with selector: ${parentSelector}`)
    }

    const element = this.createElement(blockNode)

    if (siblingSelector) {
      const sibling = document.querySelector(siblingSelector)
      if (sibling) {
        sibling.insertAdjacentElement('afterend', element)
      } else {
        throw new Error(`Sibling element not found with selector: ${siblingSelector}`)
      }
    } else {
      // If no sibling selector, insert at the beginning
      parent.insertBefore(element, parent.firstChild)
    }

    return element
  }

  updateNode(blockNode: BlockNode) {
    const element = document.querySelector(`[data-editrix-id="${blockNode.getId()}"]`)
    if (!element) return

    // Update text content
    if (blockNode.getTextContent() !== element.textContent) {
      element.textContent = blockNode.getTextContent()
    }

    // Update attributes
    blockNode.getAttributes().forEach((value, name) => {
      if (element.getAttribute(name) !== value) {
        element.setAttribute(name, value)
      }
    })
  }

  deleteNode(blockNodeId: string) {
    const element = document.querySelector(`[data-editrix-id="${blockNodeId}"]`)
    if (element) {
      element.remove()
    }
  }
}