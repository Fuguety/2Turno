import { expect, test } from 'vitest';
import { protectTranslatedText } from './translationDom';

class FakeNode {
  static readonly TEXT_NODE = 3;
  static readonly ELEMENT_NODE = 1;
  parentNode: FakeNode | null = null;
  children: FakeNode[] = [];

  constructor(readonly nodeType = FakeNode.ELEMENT_NODE) {}

  contains(node: FakeNode): boolean {
    return this.children.some((child) => child === node || child.contains(node));
  }

  appendChild<T extends FakeNode>(child: T): T {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  removeChild<T extends FakeNode>(child: T): T {
    const index = this.children.indexOf(child);
    if (index < 0) throw new Error('NotFoundError: removeChild');
    this.children.splice(index, 1);
    child.parentNode = null;
    return child;
  }

  insertBefore<T extends FakeNode>(child: T, reference: FakeNode | null): T {
    const index = reference ? this.children.indexOf(reference) : this.children.length;
    if (index < 0) throw new Error('NotFoundError: insertBefore');
    child.parentNode = this;
    this.children.splice(index, 0, child);
    return child;
  }
}

test('React can reconcile text wrapped by browser translation without hiding other DOM errors', () => {
  const originalNode = globalThis.Node;
  globalThis.Node = FakeNode as unknown as typeof Node;
  try {
    const root = new FakeNode();
    const parent = root.appendChild(new FakeNode());
    const translatedWrapper = parent.appendChild(new FakeNode());
    const originalText = translatedWrapper.appendChild(new FakeNode(FakeNode.TEXT_NODE));
    protectTranslatedText(root as unknown as HTMLElement);

    const inserted = new FakeNode();
    expect(parent.insertBefore(inserted, originalText)).toBe(inserted);
    expect(parent.children).toEqual([inserted, translatedWrapper]);
    expect(parent.removeChild(originalText)).toBe(originalText);
    expect(parent.children).toEqual([inserted]);

    const outside = new FakeNode();
    expect(() => outside.removeChild(new FakeNode())).toThrow('NotFoundError');
  } finally {
    globalThis.Node = originalNode;
  }
});
