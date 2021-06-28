import { JSDOM } from 'jsdom';

export interface ChunkingOptions {
  tooLongThreshold?: number;
}

export async function createDomTree(html: string): Promise<JSDOM> {
  const dom = new JSDOM(html);
  return new Promise((resolve) => {
    dom.window.addEventListener('DOMContentLoaded', () => {
      resolve(dom);
    });
  });
}

function createDom(): JSDOM {
  return new JSDOM();
}

function isSeparator(node: ChildNode): boolean {
  const tagName = node.nodeName.toLowerCase();
  if (tagName === 'hr') {
    return true;
  }
  return false;
}

function isHeaderNode(node: Node | null): boolean {
  if (!node) return false;
  return ['h1', 'h2', 'h3'].includes(node.nodeName.toLowerCase());
}

function isNewSection(chunk: JSDOM, node: ChildNode): boolean {
  if (isHeaderNode(node) && !isHeaderNode(chunk.window.document.body.lastChild)) {
    return true;
  }
  return false;
}

function isEmptyTextNode(node: ChildNode): boolean {
  if (node.nodeName === '#text' && (!node.nodeValue || node.nodeValue.replace(/\s*/, '').length === 0)) {
    return true;
  }
  return false;
}

function isChunkTooLong(chunk: JSDOM, threshold: number): boolean {
  if (threshold <= 0) return false;
  return (chunk.window.document.body.textContent?.length || 0) > threshold;
}

function isEmptyChunk(chunk: JSDOM): boolean {
  return !chunk.window.document.body.lastChild;
}

export function chunking(dom: JSDOM, options: ChunkingOptions): Array<JSDOM> {
  const body = dom.window.document.body;

  const results = [];
  let chunk = null;
  const { tooLongThreshold = 1000 } = options;

  while (body.firstChild) {
    if (!chunk) {
      chunk = createDom();
      results.push(chunk);
    }

    const node = body.removeChild(body.firstChild);

    if (isSeparator(node)) {
      if (!isEmptyChunk(chunk)) {
        chunk = null;
      }
      continue;
    }

    if (!isEmptyChunk(chunk) && isNewSection(chunk, node)) {
      // new section header detected
      body.insertBefore(node, body.firstChild);
      chunk = null;
      continue;
    }

    if (!isEmptyTextNode(node)) {
      chunk.window.document.body.appendChild(node);
      if (isChunkTooLong(chunk, tooLongThreshold)) {
        chunk = null;
      }
    }
  }

  return results;
}
