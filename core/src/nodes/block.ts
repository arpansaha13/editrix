import { TextRun } from './textRun'
import type { ContainerNode } from './container'
import { isBlockNodeTag } from '../utils'
import type { HtmlTagName } from '../types'
import { EDITRIX_DATA_ID, ZERO_WIDTH_SPACE } from '../constants'

export class BlockNode {
  private readonly id: string
  private readonly parent: ContainerNode
  private readonly attributes: Map<string, string>
  private readonly runs: TextRun[]
  private tagName: HtmlTagName

  constructor(tagName: HtmlTagName, parent: ContainerNode) {
    if (!isBlockNodeTag(tagName)) {
      throw new Error(`Invalid tag for block node: ${tagName}`)
    }

    this.id = Math.random().toString(36).substring(2, 9)
    this.parent = parent
    this.attributes = new Map()
    this.tagName = tagName
    this.runs = [new TextRun('')]

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
    return this.runs.map(run => run.getText()).join('')
  }

  getRuns(): TextRun[] {
    return this.runs
  }

  insertTextRun(run: TextRun, index: number) {
    this.runs.splice(index, 0, run)
  }

  removeTextRun(index: number) {
    this.runs.splice(index, 1)
  }

  /**
   * Split the text run at the given index at the given offset
   * @returns The second part of the split run
   */
  splitRunAtOffset(runIndex: number, offset: number): TextRun | null {
    const run = this.runs[runIndex]
    if (!run) return null

    const text = run.getText()
    const beforeText = text.slice(0, offset)
    const afterText = text.slice(offset)

    run.setText(beforeText)
    if (!afterText) return null

    const newRun = new TextRun(afterText)
    return newRun
  }

  /**
   * Merge two text runs
   * @returns The merged text
   */
  mergeRuns(firstIndex: number, secondIndex: number): string {
    const first = this.runs[firstIndex]
    const second = this.runs[secondIndex]
    if (!first || !second) return ''

    const mergedText = first.getText() + second.getText()
    first.setText(mergedText)
    this.removeTextRun(secondIndex)
    return mergedText
  }

  /**
   * Remove and return runs starting from the given index
   * @param fromIndex The index to start removing runs from
   * @returns The removed runs
   */
  removeRunsFrom(fromIndex: number): TextRun[] {
    return this.runs.splice(fromIndex)
  }

  /**
   * Insert runs at the specified index
   * @param runs The runs to insert
   * @param index The index at which to insert the runs
   */
  insertRunsAt(runs: TextRun[], index: number): void {
    if (this.runs[0].getText() === ZERO_WIDTH_SPACE) {
      this.runs.pop()
    }
    this.runs.splice(index, 0, ...runs)
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
