import { translateByDeepl, TranslateOptionsForDeepl } from './translate';

import { convertMdToHtml, convertHtmlToMd, convertDomToHtml } from './converters';

import { createDomTree, chunking, ChunkingOptions } from './chunking';

function joinMds(mds: Result[]): string {
  return mds
    .map((pair: Result): string => {
      const { source, dist } = pair;
      return [source, dist].join('\n\n');
    })
    .join('\n\n--\n\n');
}

export interface Result {
  source: string;
  dist: string;
}

export async function translate(
  md: string,
  options: TranslateOptionsForDeepl,
  chunkingOptions: ChunkingOptions = {}
): Promise<string> {
  const { targetLang, authKey, useFreeApi } = options;

  const srcHtml = convertMdToHtml(md);

  const srcDom = await createDomTree(srcHtml);

  const domChunks = chunking(srcDom, chunkingOptions);

  const promises = domChunks.map(
    async (chunk): Promise<Result> => {
      const srcHtml = convertDomToHtml(chunk);

      const distHtml = await translateByDeepl(srcHtml, { targetLang, authKey, useFreeApi });

      const result: Result = {
        source: convertHtmlToMd(srcHtml),
        dist: convertHtmlToMd(distHtml),
      };

      return result;
    }
  );

  const distMds = await Promise.all(promises);

  return joinMds(distMds);
}
