import type { HtmlTagName } from './types'

const blockNodeTags: HtmlTagName[] = ['p', 'h1', 'h2', 'h3']

export function isBlockNodeTag(tagName: HtmlTagName) {
  return blockNodeTags.includes(tagName)
}

export function isTypeableCharacter(e: KeyboardEvent) {
  return e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey
}
