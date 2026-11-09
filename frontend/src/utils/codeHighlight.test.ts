import { describe, expect, it } from 'vitest'
import { getLanguageFromClass, highlightCode } from './codeHighlight'

describe('getLanguageFromClass', () => {
  it('reads the language that the author wrote', () => {
    expect(getLanguageFromClass('language-csharp')).toBe('csharp')
    // A short name such as "js" is kept as it is: highlight.js knows it as a name of JavaScript.
    expect(getLanguageFromClass('fr-view lang-js')).toBe('js')
    expect(getLanguageFromClass('language-TS')).toBe('ts')
  })

  it('gives nothing for a missing or unknown language', () => {
    expect(getLanguageFromClass('')).toBeNull()
    expect(getLanguageFromClass('language-brainfuck')).toBeNull()
    expect(getLanguageFromClass('hljs')).toBeNull()
  })
})

describe('highlightCode', () => {
  it('puts the parts of a known language into spans', () => {
    const html = highlightCode('const total = 1;', 'javascript')
    expect(html).toContain('hljs-keyword')
    expect(html).toContain('hljs-number')
  })

  it('escapes the code, so a tag in it is not a tag of the page', () => {
    const html = highlightCode('const html = "<img src=x onerror=alert(1)>";', 'javascript')
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;img')
  })

  it('finds the language by itself when the code is clearly one', () => {
    const csharp = highlightCode(
      'public class TopicService\n{\n    public async Task<int> CountAsync() => await db.Topics.CountAsync();\n}',
      null,
    )
    expect(csharp).toContain('hljs-keyword')
    const python = highlightCode('def add(a, b):\n    return a + b\nprint(add(1, 2))', null)
    expect(python).toContain('hljs-keyword')
  })

  it('leaves a plain sentence and a one-word command without colours', () => {
    expect(highlightCode('Đây chỉ là một đoạn chữ bình thường.', null)).toBeNull()
    expect(highlightCode('Hello world, this is plain text with a few words.', null)).toBeNull()
    expect(highlightCode('npm run dev', null)).toBeNull()
  })

  it('colours CSS and JSON when the block says its language', () => {
    expect(highlightCode('{"name": "TechForum", "version": 1}', 'json')).toContain('hljs-attr')
  })
})
