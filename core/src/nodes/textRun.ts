import { ZERO_WIDTH_SPACE } from '../constants';

export class TextRun {
  private readonly id: string
  private text: string;
  private empty: boolean;
  private bold: boolean;

  constructor(text: string) {
    this.id = Math.random().toString(36).substring(2, 9)
    this.bold = false
    this.empty = false
    this.text = ZERO_WIDTH_SPACE

    this.setText(text)
  }

  getId(): string {
    return this.id
  }

  isEmpty(): boolean {
    return this.empty
  }

  getText(): string {
    return this.text;
  }

  setText(newText: string): void {
    if (newText.startsWith(ZERO_WIDTH_SPACE)) {
      newText = newText.slice(1)
    }
    if (newText.endsWith(ZERO_WIDTH_SPACE)) {
      newText = newText.slice(0, newText.length - 1)
    }

    if (newText === '') {
      this.empty = true
      newText = ZERO_WIDTH_SPACE
    } else {
      this.empty = false
    }

    this.text = newText;
  }

  isBold(): boolean {
    return this.bold
  }

  setBold(bool: boolean) {
    this.bold = bool
  }

  toggleBold() {
    this.bold = !this.bold
  }
}
