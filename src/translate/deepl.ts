import axios from 'axios';
const FormData = require('form-data');

const FREE_API_URL = 'https://api-free.deepl.com/v2/translate';
const API_URL = 'https://api.deepl.com/v2/translate';

export interface TranslateOptions {
  targetLang: string;
  authKey: string;
  useFreeApi: boolean;
}

export async function translate(html: string, options: TranslateOptions): Promise<string> {
  const { targetLang, authKey, useFreeApi } = options;

  const form = new FormData();
  form.append('auth_key', authKey);
  form.append('text', html);
  form.append('target_lang', targetLang);
  form.append('tag_handling', 'xml');

  const res = await axios
    .post(useFreeApi ? FREE_API_URL : API_URL, form, {
      headers: form.getHeaders(),
      params: {
        auth_key: authKey,
      },
    })
    .catch((err) => {
      console.log(err.response);
      return err.response;
    });

  if (res.status !== 200) {
    console.log(`status: ${res.status}`);
    return '';
  }

  return res.data?.translations[0]?.text;
}
