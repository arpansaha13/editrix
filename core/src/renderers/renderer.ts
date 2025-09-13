import { VNode } from '../vnode/vnode'
import type { Renderer } from './interface'

export class DomRenderer implements Renderer {
  private readonly container: HTMLElement

  constructor(container: HTMLElement) {
    this.container = container
  }

  mount(vnode: VNode) {
    const element = this.createElement(vnode)
    this.container.appendChild(element)
    return element
  }

  private createElement(vnode: VNode): HTMLElement {
    const element = document.createElement(vnode.getTagName())

    // Set attributes
    vnode.getAttributes().forEach((value, name) => {
      element.setAttribute(name, value)
    })

    // Set text content if any
    if (vnode.getTextContent()) {
      element.textContent = vnode.getTextContent()
    }

    // Create child elements
    vnode.getChildren().forEach(child => {
      element.appendChild(this.createElement(child))
    })

    return element
  }

  createNode(vnode: VNode, parentSelector: string, siblingSelector?: string): HTMLElement {
    const parent = document.querySelector(parentSelector)
    if (!parent) {
      throw new Error(`Parent element not found with selector: ${parentSelector}`)
    }

    const element = this.createElement(vnode)

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

  updateNode(vnode: VNode) {
    const element = document.querySelector(`[data-editrix-id="${vnode.getId()}"]`)
    if (!element) return

    // Update text content
    if (vnode.getTextContent() !== element.textContent) {
      element.textContent = vnode.getTextContent()
    }

    // Update attributes
    vnode.getAttributes().forEach((value, name) => {
      if (element.getAttribute(name) !== value) {
        element.setAttribute(name, value)
      }
    })
  }

  deleteNode(vnodeId: string) {
    const element = document.querySelector(`[data-editrix-id="${vnodeId}"]`)
    if (element) {
      element.remove()
    }
  }
}