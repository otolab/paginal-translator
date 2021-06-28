const MarkdownIt = require('markdown-it');
import { NodeHtmlMarkdown } from 'node-html-markdown';
import { JSDOM } from 'jsdom';

export function convertMdToHtml(mdStr: string): string {
  const md = MarkdownIt();
  return md.render(mdStr);
}

export function convertDomToHtml(dom: JSDOM): string {
  return dom.serialize();
}

export function convertHtmlToMd(html: string): string {
  return NodeHtmlMarkdown.translate(html);
}
