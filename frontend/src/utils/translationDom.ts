// Browser translators may wrap or replace text nodes after React renders them.
// Keep DOM reconciliation from crashing when it later removes or inserts text.
export function protectTranslatedText(root: HTMLElement): void {
  const removeChild = Node.prototype.removeChild;
  const insertBefore = Node.prototype.insertBefore;

  function inApp(parent: Node): boolean {
    return parent === root || root.contains(parent);
  }

  function directChild(parent: Node, descendant: Node): Node | null {
    let node: Node | null = descendant;
    while (node && node.parentNode !== parent) {
      node = node.parentNode;
    }
    return node;
  }

  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode === this || child.nodeType !== Node.TEXT_NODE || !inApp(this)) {
      return removeChild.call(this, child) as T;
    }

    // Translate may have put the original text inside a wrapper. Remove that
    // wrapper so translated text does not remain visible after React unmounts it.
    const wrapper = directChild(this, child);
    if (wrapper && wrapper !== child) {
      removeChild.call(this, wrapper);
    }
    // A translator can also detach the original text altogether. In that case
    // there is no node left for React to remove from this parent.
    return child;
  };

  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (!referenceNode || referenceNode.parentNode === this || referenceNode.nodeType !== Node.TEXT_NODE || !inApp(this)) {
      return insertBefore.call(this, newNode, referenceNode) as T;
    }

    const wrapper = directChild(this, referenceNode);
    return insertBefore.call(this, newNode, wrapper) as T;
  };
}
