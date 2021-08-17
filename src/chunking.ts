import { JSDOM } from 'jsdom';

export interface ChunkingOptions {
  tooLongThreshold?: number;
  useHeadersChunk?: boolean;
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

function isNewSection(dom: JSDOM, node: ChildNode): boolean {
  if (isHeaderNode(node) && !isHeaderNode(dom.window.document.body.lastChild)) {
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

function isDomTooLong(dom: JSDOM, threshold: number): boolean {
  if (threshold <= 0) return false;
  return (dom.window.document.body.textContent?.length || 0) > threshold;
}

function isEmptyDom(dom: JSDOM): boolean {
  return !dom.window.document.body.lastChild;
}

interface Chunk {
  dom: JSDOM;
  mode: 'default' | 'headers';
}

export function chunking(dom: JSDOM, options: ChunkingOptions): Chunk[] {
  const body = dom.window.document.body;

  const results: Chunk[] = [];
  let chunk: Chunk | null = null;
  const { tooLongThreshold = 1000, useHeadersChunk = true } = options;

  while (body.firstChild) {
    if (!chunk) {
      chunk = {
        dom: createDom(),
        mode: 'default',
      };
      results.push(chunk);
    }

    const node = body.removeChild(body.firstChild);

    if (isSeparator(node)) {
      // console.log('separator');
      if (!isEmptyDom(chunk.dom)) {
        chunk = null;
      }
      continue;
    }

    if (isEmptyTextNode(node)) continue;

    if (
      isHeaderNode(node) &&
      chunk.dom.window.document.body.lastChild &&
      !isHeaderNode(chunk.dom.window.document.body.lastChild)
    ) {
      // console.log('split before header');
      // split before header
      body.insertBefore(node, body.firstChild);
      if (!isEmptyDom(chunk.dom)) {
        chunk = null;
      }
      continue;
    }

    if (useHeadersChunk && isHeaderNode(chunk.dom.window.document.body.lastChild) && !isHeaderNode(node)) {
      // console.log('headers chunk was end');
      // headers chunk was end
      chunk.mode = 'headers';
      chunk = null;
      body.insertBefore(node, body.firstChild);
      continue;
    }

    if (!isEmptyDom(chunk.dom) && isNewSection(chunk.dom, node)) {
      // console.log('new section header detected');
      // new section header detected
      body.insertBefore(node, body.firstChild);
      chunk = null;
      continue;
    }

    chunk.dom.window.document.body.appendChild(node);

    if (isDomTooLong(chunk.dom, tooLongThreshold)) {
      chunk = null;
    }
  }

  return results;
}
