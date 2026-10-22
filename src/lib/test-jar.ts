export class Jar {
  cookies = new Map<string, string>()

  apply(headers: Headers) {
    for (const line of headers.getSetCookie()) {
      const [pair = '', ...attributes] = line.split(';')
      const [, name = '', value = ''] = /^([^=]*)=(.*)$/u.exec(pair) ?? []
      const expired = value === '' || attributes.some(attribute => /max-age=0/iu.test(attribute))
      if (expired) this.cookies.delete(name)
      if (!expired) this.cookies.set(name, value)
    }
  }

  header() {
    return [...this.cookies].map(([name, value]) => `${name}=${value}`).join('; ')
  }

  headers() {
    return new Headers({ cookie: this.header() })
  }

  has(fragment: string) {
    return [...this.cookies.keys()].some(name => name.includes(fragment))
  }
}
