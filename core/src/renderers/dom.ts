import { BlockNode } from '../nodes/block'
import { ContainerNode } from '../nodes/container'
import type { Renderer } from './interface'

export class DomRenderer implements Renderer {
  private readonly container: HTMLElement

  constructor(container: HTMLElement) {
    this.container = container
  }

  mount(node: ContainerNode) {
    const element = this.createContainerElement(node)
    this.container.appendChild(element)
    return element
  }

  private createContainerElement(node: ContainerNode): HTMLElement {
    const element = document.createElement(node.getTagName())

    node.getAttributes().forEach((value, name) => {
      element.setAttribute(name, value)
    })

    node.getChildren().forEach(child => {
      element.appendChild(this.createBlockElement(child))
    })

    return element
  }

  private createBlockElement(node: BlockNode): HTMLElement {
    const element = document.createElement(node.getTagName())

    node.getAttributes().forEach((value, name) => {
      element.setAttribute(name, value)
    })

    // Create text nodes for each run
    node.getRuns().forEach(run => {
      const text = document.createTextNode(run.getText())
      if (run.isBold()) {
        const strong = document.createElement('strong')
        strong.appendChild(text)
        element.appendChild(strong)
      } else {
        element.appendChild(text)
      }
    })

    return element
  }

  createNode(node: BlockNode, parentSelector: string, siblingSelector?: string): HTMLElement {
    const parent = document.querySelector(parentSelector)
    if (!parent) {
      throw new Error(`Parent element not found with selector: ${parentSelector}`)
    }

    const element = this.createBlockElement(node)

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

  updateNode(node: BlockNode) {
    const element = document.querySelector(`[data-editrix-id="${node.getId()}"]`)
    if (!element) return

    // Clear existing text nodes
    while (element.firstChild) {
      element.removeChild(element.firstChild)
    }

    // Create new text nodes for each run
    node.getRuns().forEach(run => {
      const text = document.createTextNode(run.getText())
      if (run.isBold()) {
        const strong = document.createElement('strong')
        strong.appendChild(text)
        element.appendChild(strong)
      } else {
        element.appendChild(text)
      }
    })

    // Update attributes
    node.getAttributes().forEach((value, name) => {
      if (element.getAttribute(name) !== value) {
        element.setAttribute(name, value)
      }
    })
  }

  deleteNode(nodeId: string) {
    const element = document.querySelector(`[data-editrix-id="${nodeId}"]`)
    if (element) {
      element.remove()
    }
  }
}