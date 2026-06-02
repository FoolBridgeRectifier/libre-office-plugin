---
title: ==Detection Engine Test==
date: 2026-05-02
---

- [x] # dd
- [ ] ss
      `ggg` gg `ggg` gg `ff`

> [!info] - [ ] s
> gg

- # hh

kkkk # ff

`<b>s</b><b>s</b>`
`s`

    ss

# <b>gg</b>

# <span style="margin-left:24px"/>\*Heading 1

## Heading 2

### Heading 3

#### Heading 4

##### Heading 5

###### Heading 6

####### Not a heading (7 hashes — no match)

---

**bold text**

_italic text_

~~strikethrough~~

==highlight==

**nested _italic inside bold_ still bold**

_italic with ==highlight inside==_

`inline code`

```js
const fenced = true;
```

    tab-indented code block (preceded by content above)
    second tab-indented line

    four-space indented code block
    second four-space line

---

<b>html bold</b>

<i>html italic</i>

<s>html strikethrough</s>

<b >whitespace-tolerant bold</b >

<u>underlined</u>

H<sub>2</sub>O

x<sup>2</sup>

<span style="color: red">red text</span>

<span style="color: #ff6600">orange text</span>

<span style="font-size: 14px">small</span>

<span style="font-size: 2em">large</span>

<span style="font-family: Arial">Arial</span>

<span style="font-family: 'Times New Roman', serif">serif</span>

<span style="background: yellow">yellow highlight</span>

<span style="background: rgba(255,200,0,0.4)">transparent highlight</span>

<span style="text-align: center; display: block">centered</span>
[]
<span style="```text-align: right">right-aligned</span>

---

> plain blockquote — QUOTE matches

> > nested blockquote depth-2 — QUOTE matches

> > > triple depth — QUOTE matches

> q1
> q2

> [!note] Callout with title — CALLOUT matches, QUOTE does not

> [!warning]
> callout body — CALLOUT continuation, QUOTE does not match this line

> [!info] Title
> gg
>
> > [!tip] Nested callout — CALLOUT matches (continuation arm), QUOTE also matches >> here

> [!note```]
> another body line — CALLOUT continuation only

---

- plain list item — LIST matches

- another list item
  - indented list item (tab prefix) — LIST matches, INDENT also matches
    - double-indented list item — LIST matches

- [ ] unchecked checkbox — CHECKBOX matches

- [x] checked checkbox

- [x] checked checkbox uppercase

- [/] in-progress checkbox

- [-] cancelled checkbox

- [] empty brackets — LIST matches (not checkbox)

- [^] footnote bracket — LIST matches (not checkbox)

- [!] callout bracket — LIST matches (not checkbox)

-[x] no space before bracket — LIST matches (not checkbox)

---

    tab-indented line (preceded by list above) — INDENT matches

    	double tab indent

    four-space indent

    <span style="margin-left: 2em">tab + span indent</span>rest of line

---

[[wikil```ink]] — WIKILINK matches

[[wikilink with spaces]]

[[folder/path/note]] — WIKILINK with path

![[embed-file]] — EMBED matches

![[images/photo.png]] — EMBED with path

![inline svg image](data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='320'%20height='180'%20viewBox='0%200%20320%20180'%3E%3Crect%20width='320'%20height='180'%20rx='16'%20fill='%236f42c1'/%3E%3Ctext%20x='160'%20y='96'%20text-anchor='middle'%20fill='white'%20font-size='22'%20font-family='Segoe%20UI,Arial,sans-serif'%3ELibre%20Embed%20Test%3C/text%3E%3C/svg%3E) — self-contained markdown IMAGE

Self-contained embed target paragraph in this same markdown file. ^libre-note-editor-self-embed

![[#Heading 2]] — same-note HEADING embed

![[#^libre-note-editor-self-embed]] — same-note BLOCK embed

- [[list wikilink]] — lookbehind blocks WIKILINK (preceded by dash)

[markdown link](https://example.com) — EXTERNAL_LINK matches

https://example.com/path?q=1 — EXTERNAL_LINK bare URL

http://insecure.exa```mple.com

www.example.com

example.io/path

api.example.dev/v2

---

#todo inline todo — INLINE_TODO matches

text before #todo mid-sentence

#todos should NOT match (word boundary blocks plural)

#todoitem should NOT match

---

[^footnote] inline reference — FOOTNOTE_REF matches

[^footnote]: footnote definition

[^multi-word]: another definition

---

\*\*unclosed bold — no close delimiter in this line

\*unclosed italic

==unclosed highlight

~~unclosed strikethrough
