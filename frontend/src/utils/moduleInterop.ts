export const resolveModuleDefault = <T>(moduleValue: unknown): T => {
  let resolvedValue = moduleValue

  for (let depth = 0; depth < 2; depth += 1) {
    if (
      typeof resolvedValue !== 'object'
      || resolvedValue === null
      || !('default' in resolvedValue)
    ) {
      break
    }

    resolvedValue = (resolvedValue as { default: unknown }).default
  }

  return resolvedValue as T
}
