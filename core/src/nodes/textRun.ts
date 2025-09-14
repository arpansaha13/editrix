import { ZERO_WIDTH_SPACE } from '../constants';

export class TextRun {
  private readonly id: string
  private text: string;

  constructor(text: string) {
    this.id = Math.random().toString(36).substring(2, 9)

    if (text === '') {
      this.text = ZERO_WIDTH_SPACE
    } else if (text.startsWith(ZERO_WIDTH_SPACE)) {
      this.text = text.slice(1)
    } else if (text.endsWith(ZERO_WIDTH_SPACE)) {
      this.text = text.slice(0, text.length - 1)
    } else {
      this.text = text
    }
  }

  getId(): string {
    return this.id
  }

  getText(): string {
    return this.text;
  }

  setText(newText: string): void {
    this.text = newText;
  }
}
