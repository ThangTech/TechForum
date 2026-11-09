// What a topic without a picture shows instead of its cover: a background in the colour of its first tag and a short
// mark of that tag (for example the React atom for #React). A video has no picture to use as a cover, so these
// topics would otherwise all look the same.

export interface TagCoverStyle {
  // The CSS background of the cover.
  background: string
  // The text drawn over it, short enough to fit a card.
  label: string
  // "react" draws the atom of React; the other tags only show their label.
  symbol: 'react' | 'text'
}

interface KnownTag {
  from: string
  to: string
  label: string
}

// Colours that people link with these technologies. The key is the slug of the tag.
const knownTags: Record<string, KnownTag> = {
  react: { from: '#0b3b4d', to: '#1b7a99', label: 'React' },
  typescript: { from: '#1d4f91', to: '#3178c6', label: 'TS' },
  javascript: { from: '#8a6d00', to: '#d4b106', label: 'JS' },
  'aspnet-core': { from: '#3b1d8f', to: '#6c47d6', label: '.NET' },
  'asp-net-core': { from: '#3b1d8f', to: '#6c47d6', label: '.NET' },
  'sql-server': { from: '#7a1514', to: '#cc2927', label: 'SQL' },
  'spring-boot': { from: '#2f5d1a', to: '#6db33f', label: 'Spring' },
  python: { from: '#1f4a75', to: '#3776ab', label: 'Python' },
  java: { from: '#8a4b05', to: '#e08a1e', label: 'Java' },
  docker: { from: '#0b4f86', to: '#2496ed', label: 'Docker' },
  git: { from: '#8a2a0f', to: '#f05133', label: 'Git' },
  nodejs: { from: '#25451a', to: '#5fa04e', label: 'Node' },
  'node-js': { from: '#25451a', to: '#5fa04e', label: 'Node' },
  csharp: { from: '#4a1d6e', to: '#9b4f96', label: 'C#' },
  'c-sharp': { from: '#4a1d6e', to: '#9b4f96', label: 'C#' },
}

// The same text always gives the same number, so a tag keeps its colour on every page and after every reload.
export const hashText = (text: string): number => {
  let hash = 0
  for (const character of text) hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  return hash
}

// Two capital letters from the name, for a tag that is not in the list above ("Machine Learning" gives "ML").
export const getInitials = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '#'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

export const getTagCover = (tag: { slug: string; name: string }): TagCoverStyle => {
  const known = knownTags[tag.slug.toLowerCase()]
  if (known) {
    return {
      background: `linear-gradient(135deg, ${known.from}, ${known.to})`,
      label: known.label,
      symbol: tag.slug.toLowerCase() === 'react' ? 'react' : 'text',
    }
  }

  const hue = hashText(tag.slug || tag.name) % 360
  return {
    background: `linear-gradient(135deg, hsl(${hue} 55% 22%), hsl(${(hue + 40) % 360} 60% 38%))`,
    label: getInitials(tag.name),
    symbol: 'text',
  }
}
