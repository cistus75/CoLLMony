export function seededValue(seed, ...parts) {
  let value = seed >>> 0
  for (const part of parts.join(':')) value = Math.imul(value ^ part.charCodeAt(0), 2654435761) >>> 0
  return value
}
