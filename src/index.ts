import { translateByDeepl, TranslateOptionsForDeepl } from './translate';

import { convertMdToHtml, convertHtmlToMd, convertDomToHtml } from './converters';

import { createDomTree, chunking, ChunkingOptions } from './chunking';

function mergeHeadersResult(pair: Result): string {
  const { source, dist } = pair;
  const sourceHeaders = source.split('\n').filter((v) => v);
  const distHeaders = dist.split('\n').filter((v) => v);

  let code = '';
  while (sourceHeaders.length > 0 && distHeaders.length > 0) {
    let srcHeader = sourceHeaders.shift()?.replace(/^#+\s*/, '');
    code += `${distHeaders.shift()} _(${srcHeader})_\n`;
  }
  return code;
}

function mergeDefaultResult(pair: Result): string {
  const { source, dist } = pair;

  // TODO: use template
  return [
    dist,
    '\n',
    '> _原文:_',
    source
      .split('\n')
      .map((line) => `> ${line}`)
      .join('\n'),
    '\n',
    '----',
  ].join('\n');
}

function joinMds(mds: Result[], options: { mergeTranslatedHeader: boolean }): string {
  return mds
    .map((pair: Result): string => {
      const { mode } = pair;
      if (options.mergeTranslatedHeader && mode === 'headers') {
        return mergeHeadersResult(pair);
      }
      return mergeDefaultResult(pair);
    })
    .join('\n\n');
}

export interface ProcessOptions {
  fromHtml: boolean;
  mergeTranslatedHeader: boolean;
}

export interface Result {
  source: string;
  dist: string;
  mode?: 'default' | 'headers';
}

export async function translate(
  src: string,
  options: {
    processOptions: ProcessOptions;
    translateOptions: TranslateOptionsForDeepl;
    chunkingOptions: ChunkingOptions;
  }
): Promise<string> {
  const { targetLang, authKey, useFreeApi } = options.translateOptions;

  if (options.processOptions.fromHtml) {
    src = convertHtmlToMd(src);
  }

  const srcHtml = convertMdToHtml(src);

  const srcDom = await createDomTree(srcHtml);

  const domChunks = chunking(srcDom, options.chunkingOptions);

  const promises = domChunks.map(
    async (chunk): Promise<Result> => {
      const { dom, mode } = chunk;

      const srcHtml = convertDomToHtml(dom);

      const distHtml = await translateByDeepl(srcHtml, { targetLang, authKey, useFreeApi });

      const result: Result = {
        source: convertHtmlToMd(srcHtml),
        dist: convertHtmlToMd(distHtml),
        mode,
      };

      return result;
    }
  );

  const distMds = await Promise.all(promises);

  return joinMds(distMds, { mergeTranslatedHeader: options.processOptions.mergeTranslatedHeader });
}
