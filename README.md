paginal-translator
====================

github形式のMarkdownを自動分割して、翻訳文と原文を並べた対訳状態のMarkdownを生成する。

`--` を使った手動分割の他、見出しや文字数を使った自動分割もサポートする。




Example
===========

```md
# header1

## header2

test [paginal-translator](https://github.com/otolab/paginal-translator).

test2.

---

test3.
```

↓

```md
# ヘッダー1 _(header1)_
## ヘッダー2 _(header2)_


テスト[paginal-translator](https://github.com/otolab/paginal-translator).

をテストします。


> _原文:_
>
> test[paginal-translator](https://github.com/otolab/paginal-translator).
>
> test2.


----

test3です。


> _原文:_
>
> test3.
```


Usage
===============


```
  Usage
    $ paginal-translator [options] [<file> ...]

  Options
    --deepl-auth-key <key>  deepl api auth key
    --from-html             html source mode (default: false; md source mode)
    --help                  help

  Environments
    DEEPL_AUTH_KEY          deepl api auth key

  Examples
    $ export DEEPL_AUTH_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    $ paginal-translator test.md > dist.md
```


### options

現状はDeepL ProのAPIのみ対応。
翻訳はen => jaのみ。

#### `--deepl-auth-key <key>`

DeepL ProのAuth keyを指定する。
環境変数DEEPL_AUTH_KEYで設定してあれば省略可


#### `--from-html`

HTML => MDの変換を最初に行う。HTML => md => HTML => HTML(ja) => md(ja)となる。

HTML全文ではなく、`<p>`が並んでいる状態のものを使うこと。分割処理がうまく行われないので。


仕組み
============

DeepLのHTML翻訳機能を使い、md => html => DOM => html(chunked) => html(ja) => md(ja)と変換を行います。あとは対訳状態に並べて完成。

chunkingの処理は改善の余地あり。一応headerも考慮される。
