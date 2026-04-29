export function clearChildren(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

export function createEl(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "dataset") Object.assign(node.dataset, v);
    else if (k.startsWith("aria") || k === "role" || k === "for") node.setAttribute(k, v);
    else node[k] = v;
  }
  for (const c of children) {
    if (c == null) continue;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return node;
}
