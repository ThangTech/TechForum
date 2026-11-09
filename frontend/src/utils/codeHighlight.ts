import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import csharp from 'highlight.js/lib/languages/csharp'
import css from 'highlight.js/lib/languages/css'
import java from 'highlight.js/lib/languages/java'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import python from 'highlight.js/lib/languages/python'
import sql from 'highlight.js/lib/languages/sql'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'

// Only the languages of a technology forum are loaded, so the page does not carry all 190 languages of highlight.js.
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('csharp', csharp)
hljs.registerLanguage('css', css)
hljs.registerLanguage('java', java)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('json', json)
hljs.registerLanguage('python', python)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('xml', xml)
hljs.registerAliases(['js', 'jsx'], { languageName: 'javascript' })
hljs.registerAliases(['ts', 'tsx'], { languageName: 'typescript' })
hljs.registerAliases(['cs', 'c#'], { languageName: 'csharp' })
hljs.registerAliases(['html'], { languageName: 'xml' })
hljs.registerAliases(['sh', 'shell'], { languageName: 'bash' })
hljs.registerAliases(['py'], { languageName: 'python' })

// The language that the author wrote on the block, for example class="language-csharp". Nothing when it is
// missing or is a language that is not loaded.
export const getLanguageFromClass = (className: string): string | null => {
  const match = /(?:^|\s)(?:language|lang)-([\w+#-]+)/.exec(className)
  const name = match?.[1].toLowerCase()
  return name && hljs.getLanguage(name) ? name : null
}

// The editor does not let the author choose a language, so most blocks are detected by highlight.js. Detection guesses
// wrong on short code and on plain text, and CSS and JSON accept almost any text. So only the main programming languages
// are tried, and a block is coloured only when highlight.js is sure enough (measured on sample snippets of each language).
// CSS and JSON are still coloured when the block says its language, for example class="language-json".
const AUTO_DETECT_LANGUAGES = ['javascript', 'typescript', 'csharp', 'sql', 'python', 'java', 'xml', 'bash']
const MIN_AUTO_RELEVANCE = 4

// The code as HTML with <span class="hljs-..."> around the parts, or null when it should stay plain.
// highlight.js escapes the code itself, so the result is safe to put into the page.
export const highlightCode = (code: string, language: string | null): string | null => {
  if (language) return hljs.highlight(code, { language, ignoreIllegals: true }).value
  const result = hljs.highlightAuto(code, AUTO_DETECT_LANGUAGES)
  return result.relevance >= MIN_AUTO_RELEVANCE ? result.value : null
}

// Colours every code block (<pre>) inside an article or an answer. The text of the block does not change,
// so copying the code still gives the same text.
export const highlightCodeBlocks = (root: HTMLElement): void => {
  for (const block of root.querySelectorAll('pre')) {
    if (block.classList.contains('hljs')) continue
    const target = block.querySelector('code') ?? block

    // The editor can write line breaks as <br>; they must stay line breaks in the text that is coloured.
    const copy = target.cloneNode(true) as HTMLElement
    copy.querySelectorAll('br').forEach((lineBreak) => lineBreak.replaceWith('\n'))
    const html = highlightCode(copy.textContent ?? '', getLanguageFromClass(`${block.className} ${target.className}`))
    if (html === null) continue

    target.innerHTML = html
    block.classList.add('hljs')
  }
}
