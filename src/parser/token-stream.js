import { operators, functions, keywords } from '../definition.js'
import ParseError from './parse-error.js'

const operatorRegex = new RegExp(`^(${operators.join('|')})\\b`, 'i')
const functionRegex = new RegExp(`^(${functions.join('|')})\\b`, 'i')
const keywordRegex = new RegExp(`^(${keywords.join('|')})\\b`)

function getRegexReader (regex) {
  return function regexReader (string, index) {
    const part = string.substring(index)
    const [value] = part.match(regex)
    return {
      value,
      newIndex: index + value.length
    }
  }
}

function dateReader (string, index) {
  const reader = getRegexReader(/^(\d{4}-(?:0?\d|1[012])-(?:[0123]?\d|3[01])(?:T(?:[01]?\d|2[0-3]):[0-5]?\d(?::[0-5]?\d(?:\.\d{1,12})?)?Z)?)/)
  const token = reader(string, index)
  token.value = new Date(token.value)
  return token
}

function numberReader (string, index) {
  const reader = getRegexReader(/^(-?\d+(?:\.\d+)?(?:e-?\d+)?)/)
  const token = reader(string, index)
  token.value = Number(token.value)
  return token
}

function stringReader (string, index) {
  let value = ''
  let current = index + 1
  let closeNotRead = true

  while (closeNotRead) {
    if (current >= string.length) {
      throw new ParseError('Unclosed string', index, current)
    }

    const char = string[current]
    current += 1

    if (char === "'") {
      if (string[current] === "'") {
        value += "'"
        current += 1
      } else {
        closeNotRead = false
      }
    } else {
      value += char
    }
  }

  return {
    value,
    newIndex: current
  }
}

const tokenReaders = [{
  name: 'EOS',
  test: (string, index) => index >= string.length,
  reader: (string, index) => ({ value: null, newIndex: string.length })
}, {
  name: 'WHITESPACE',
  test: (string, index) => /\s/.test(string[index] ?? ''),
  reader: getRegexReader(/^(\s+)/)
}, {
  name: 'LITERAL',
  test: (string, index) => string[index] === '$',
  reader: getRegexReader(/^(\$[a-zA-Z]\w+)/)
}, {
  name: 'ALIAS',
  test: (string, index) => string[index] === '@',
  reader: getRegexReader(/^(@[a-zA-Z]\w+)/)
}, {
  name: 'GUID',
  test: (string, index) => /^\d{8}-\d{4}-\d{4}-\d{4}-\d{12}/.test(string.substring(index)),
  reader: getRegexReader(/^(\d{8}-\d{4}-\d{4}-\d{4}-\d{12})/)
}, {
  name: 'DATE',
  test: (string, index) => /^\d{4}-(?:0?\d|1[012])-(?:[0123]?\d|3[01])(?:T(?:[01]?\d|2[0-3]):[0-5]?\d(?::[0-5]?\d(?:\.\d{1,12})?)?Z)?/.test(string.substring(index)),
  reader: dateReader
}, {
  name: 'NUMBER',
  test: (string, index) => /^-?\d/.test(string.substring(index)),
  reader: numberReader
}, {
  name: 'PUNCTUATION',
  test: (string, index) => ['/', '(', ')', '[', ']', ',', '.', ':', '-'].includes(string[index]),
  reader: (string, index) => ({ value: string[index], newIndex: index + 1 })
}, {
  name: 'STRING',
  test: (string, index) => string[index] === "'",
  reader: stringReader
}, {
  name: 'OPERATOR',
  test: (string, index) => operatorRegex.test(string.substring(index)),
  reader: getRegexReader(operatorRegex)
}, {
  name: 'FUNCTION',
  test: (string, index) => functionRegex.test(string.substring(index)),
  reader: getRegexReader(functionRegex)
}, {
  name: 'KEYWORD',
  test: (string, index) => keywordRegex.test(string.substring(index)),
  reader: getRegexReader(keywordRegex)
}, {
  name: 'NAME',
  test: (string, index) => /[a-zA-Z]/.test(string[index] ?? ''),
  reader: getRegexReader(/^\w*/)
}]

function getTokenAt (string, index) {
  for (const tokenReader of tokenReaders) {
    if (tokenReader.test(string, index)) {
      const { value, newIndex } = tokenReader.reader(string, index)
      return {
        type: tokenReader.name,
        value,
        indexStart: Math.min(index, string.length),
        indexEnd: newIndex
      }
    }
  }

  throw new ParseError(`Unexpected character '${string[index]}'`, index, index + 1)
}

function getTokenIgnoreWitespacesAt (string, index) {
  let token = getTokenAt(string, index)
  while (token.type === 'WHITESPACE') {
    token = getTokenAt(string, token.indexEnd)
  }
  return token
}

export default function tokenizer (string) {
  let index = 0
  let current = getTokenIgnoreWitespacesAt(string, index)
  let next = getTokenIgnoreWitespacesAt(string, current.indexEnd)
  index = next.indexEnd

  return {
    get current () {
      return current
    },

    get next () {
      return next
    },

    check (type, value) {
      if (type != null) {
        if (Array.isArray(type)) {
          return type.includes(current.type)
        } else if (type !== current.type) {
          return false
        }
      }

      if (value != null) {
        if (Array.isArray(value)) {
          return value.includes(current.value)
        } else if (value !== current.value) {
          return false
        }
      }

      return true
    },

    checkNext (type, value) {
      if (type != null) {
        if (Array.isArray(type)) {
          return type.includes(next.type)
        } else if (type !== next.type) {
          return false
        }
      }

      if (value != null) {
        if (Array.isArray(value)) {
          return value.includes(next.value)
        } else if (value !== next.value) {
          return false
        }
      }

      return true
    },

    advance (type, value) {
      if (type != null) {
        if (Array.isArray(type)) {
          if (!type.includes(current.type)) {
            throw new ParseError(
              `Expected a token with a set of types, but found '${current.type}'`,
              current.indexStart,
              current.indexEnd
            )
          }
        } else if (current.type !== type) {
          throw new ParseError(
            `Expected a token with type '${type}', but found '${current.type}'`,
            current.indexStart,
            current.indexEnd
          )
        }
      }

      if (value != null) {
        if (Array.isArray(value)) {
          if (!value.includes(current.value)) {
            throw new ParseError(
              `Expected a token with a set of values, but found '${current.value}'`,
              current.indexStart,
              current.indexEnd
            )
          }
        } else if (current.value !== value) {
          throw new ParseError(
            `Expected a token with value '${value}', but found '${current.value}'`,
            current.indexStart,
            current.indexEnd
          )
        }
      }

      const previous = current
      current = next

      next = getTokenIgnoreWitespacesAt(string, index)
      index = next.indexEnd

      return previous
    },

    advanceIfExists (type, value) {
      if (type && current.type !== type) {
        return null
      }

      if (value != null) {
        if (Array.isArray(value)) {
          if (!value.includes(current.value)) {
            return null
          }
        } else if (current.value !== value) {
          return null
        }
      }

      return this.advance(type, value)
    }
  }
}
