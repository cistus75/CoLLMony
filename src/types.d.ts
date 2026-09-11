import 'react'

declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined
  }
}

declare module '*.css' {
  const stylesheet: string
  export default stylesheet
}
