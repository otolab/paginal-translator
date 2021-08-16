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

export interface ProcessOptions {
  fromHtml: boolean;
}

export interface Result {
  source: string;
  dist: string;
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
