// Ids of posts, answers, categories, tags... are GUIDs (text such as "0f8fad5b-d9cb-469f-a165-70867728950e"), not numbers.
const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const isGuid = (value: string | null | undefined): value is string => !!value && guidPattern.test(value)

// A small number that is always the same for one id. It picks something that must look the same on every visit, such as the
// colour of a card that has no picture.
export const hashId = (id: string): number => {
  let hash = 0
  for (let index = 0; index < id.length; index += 1) hash = (hash * 31 + id.charCodeAt(index)) >>> 0
  return hash
}
