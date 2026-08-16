declare module 'markdown-it' {
  interface Options {
    html?: boolean
    xhtmlOut?: boolean
    breaks?: boolean
    langPrefix?: string
    linkify?: boolean
    typographer?: boolean
    quotes?: string | string[]
    highlight?: (str: string, lang: string) => string
  }

  interface MarkdownIt {
    render(md: string, env?: any): string
    renderInline(md: string, env?: any): string
    use(plugin: any, ...params: any[]): this
  }

  function MarkdownIt(presetName?: string, options?: Options): MarkdownIt
  function MarkdownIt(options?: Options): MarkdownIt

  class MarkdownItConstructor implements MarkdownIt {
    constructor(presetName?: string, options?: Options)
    constructor(options?: Options)
    render(md: string, env?: any): string
    renderInline(md: string, env?: any): string
    use(plugin: any, ...params: any[]): this
  }

  export default MarkdownItConstructor
}
