import { operatorPrecedence, lambdas } from '../definition.js'
import ParseError from './parse-error.js'

// booleanValue = "true" / "false"
function parseBoolean (tokens) {
  return {
    type: 'boolean',
    value: tokens.advance('KEYWORD', ['true', 'false']).value
  }
}

// constantValue = "null" / "NaN" / "INF"
function parseConstant (tokens) {
  return {
    type: 'constant',
    value: tokens.advance('KEYWORD', ['null', 'NaN', 'INF']).value
  }
}

// number = NUMBER
function parseDouble (tokens) {
  return {
    type: 'number',
    value: tokens.advance('NUMBER').value
  }
}

// guid = GUID
function parseGuid (tokens) {
  return {
    type: 'guid',
    value: tokens.advance('GUID').value
  }
}

// string = STRING
function parseString (tokens) {
  return {
    type: 'string',
    value: tokens.advance('STRING').value
  }
}

// date = DATE
function parseDate (tokens) {
  return {
    type: 'date',
    value: tokens.advance('DATE').value
  }
}

// alias = ALIAS
function parseAlias (tokens) {
  return {
    type: 'alias',
    value: tokens.advance('ALIAS').value
  }
}

// navigation = (NAME|LITERAL) (('/' NAME)* '/' (NAME|LITERAL|(("any"|"all") '(' NAME ':' expression ')')))?
function parseNavigation (tokens) {
  const navigation = []
  while (
    tokens.check(['NAME', 'LITERAL']) &&
    tokens.checkNext('PUNCTUATION', '/')
  ) {
    navigation.push(tokens.advance(['NAME', 'LITERAL']).value)
    tokens.advance('PUNCTUATION', '/')
  }

  if (
    lambdas.some(lambda => tokens.check('NAME', lambda)) &&
    tokens.checkNext('PUNCTUATION', '(')
  ) {
    const operation = tokens.advance('NAME').value
    tokens.advance('PUNCTUATION', '(')
    const name = tokens.advance('NAME').value
    tokens.advance('PUNCTUATION', ':')
    const expression = parseExpression(tokens)
    tokens.advance('PUNCTUATION', ')')
    return {
      type: 'lambda',
      navigation: navigation.length > 0 ? navigation : null,
      operation,
      name,
      expression
    }
  } else if (tokens.check('NAME')) {
    return {
      type: 'property',
      navigation: navigation.length > 0 ? navigation : null,
      value: tokens.advance('NAME').value
    }
  } else if (tokens.check('LITERAL')) {
    return {
      type: 'literal',
      navigation: navigation.length > 0 ? navigation : null,
      value: tokens.advance('LITERAL').value
    }
  } else {
    throw new ParseError(
      `Unexpected token ${tokens.current.type}.`,
      tokens.current.indexStart,
      tokens.current.indexEnd
    )
  }
}

// parameter = atom
function parseParameter (tokens) {
  return parseAtom(tokens)
}

// parameterList = '(' (parameter ',')* parameter ')'
function parseParameterList (tokens) {
  const parameters = []
  let first = true

  tokens.advance('PUNCTUATION', '(')

  while (!tokens.check('EOS')) {
    if (tokens.check('PUNCTUATION', ')')) break

    if (first) first = false
    else tokens.advance('PUNCTUATION', ',')

    parameters.push(parseParameter(tokens))
  }

  tokens.advance('PUNCTUATION', ')')

  return parameters
}

// functionCall = NAME parameterList
function parseFunctionCall (tokens) {
  const name = tokens.advance('FUNCTION')
  const parameters = parseParameterList(tokens)
  return {
    type: 'functionCall',
    name: name.value,
    parameters
  }
}

// negativeAtom = '-' atom
function parseNegativeAtom (tokens) {
  if (tokens.check('PUNCTUATION', '-')) {
    tokens.advance('PUNCTUATION', '-')
  } else if (tokens.check('KEYWORD', 'not')) {
    tokens.advance('KEYWORD', 'not')
  }
  return {
    type: 'negative',
    value: parseAtom(tokens)
  }
}

// atom = '(' expressionOrCollection ')'
//      | '[' expressionOrCollection ']'
//      | boolean
//      | constant
//      | date
//      | number
//      | guid
//      | string
//      | alias
//      | negativeAtom
//      | functionCall
//      | navigation
//      |   property
//      |   literal
//      |   lambda
function parseAtom (tokens) {
  if (tokens.check('PUNCTUATION', '(')) {
    tokens.advance('PUNCTUATION', '(')
    const expression = parseExpressionOrCollection(tokens)
    tokens.advance('PUNCTUATION', ')')
    return expression
  }

  if (tokens.check('PUNCTUATION', '[')) {
    tokens.advance('PUNCTUATION', '[')
    const expression = parseExpressionOrCollection(tokens)
    tokens.advance('PUNCTUATION', ']')
    return expression
  }

  if (tokens.check('KEYWORD', ['true', 'false'])) {
    return parseBoolean(tokens)
  }

  if (tokens.check('KEYWORD', ['null', 'NaN', 'INF'])) {
    return parseConstant(tokens)
  }

  if (tokens.check('DATE')) {
    return parseDate(tokens)
  }

  if (tokens.check('NUMBER')) {
    return parseDouble(tokens)
  }

  if (tokens.check('GUID')) {
    return parseGuid(tokens)
  }

  if (tokens.check('STRING')) {
    return parseString(tokens)
  }

  if (tokens.check('ALIAS')) {
    return parseAlias(tokens)
  }

  if (tokens.check('PUNCTUATION', '-') || tokens.check('KEYWORD', 'not')) {
    return parseNegativeAtom(tokens)
  }

  if (tokens.check('FUNCTION')) {
    return parseFunctionCall(tokens)
  }

  if (tokens.check('NAME') || tokens.check('LITERAL')) {
    return parseNavigation(tokens)
  }

  throw new ParseError(
    `Unexpected token ${tokens.current.type}.`,
    tokens.current.indexStart,
    tokens.current.indexEnd
  )
}

// expressionOrCollection = expression
//                        | (expression ',')+ expression
function parseExpressionOrCollection (tokens) {
  const expressions = [
    parseExpression(tokens)
  ]

  while (tokens.check('PUNCTUATION', ',')) {
    tokens.advance('PUNCTUATION', ',')
    expressions.push(
      parseExpression(tokens)
    )
  }

  return {
    type: 'collection',
    value: expressions
  }
}

// maybeBinaryOp(left): (?<=left) OPERATOR right
//                    | (?<=left)
function maybeBinaryOp (tokens, left, precedence = 0) {
  if (tokens.check('OPERATOR')) {
    const nextPrecendence = operatorPrecedence[tokens.current.value]
    if (nextPrecendence > precedence) {
      const operator = tokens.advance('OPERATOR').value
      const right = maybeBinaryOp(tokens, parseAtom(tokens), nextPrecendence)
      const binaryToken = {
        type: 'binaryOp',
        operator,
        left,
        right
      }
      return maybeBinaryOp(tokens, binaryToken, precedence)
    }
  }

  return left
}

// parseExpression = '(' expressionOrCollection ')'
//                 / '[' expressionOrCollection ']'
//                 / maybeBinaryOp
//                 / atom
//                 / ...
function parseExpression (tokens) {
  if (tokens.check('PUNCTUATION', '(')) {
    tokens.advance('PUNCTUATION', '(')
    const expression = parseExpressionOrCollection(tokens)
    tokens.advance('PUNCTUATION', ')')
    return maybeBinaryOp(tokens, expression)
  }

  if (tokens.check('PUNCTUATION', '[')) {
    tokens.advance('PUNCTUATION', '[')
    const expression = parseExpressionOrCollection(tokens)
    tokens.advance('PUNCTUATION', ']')
    return maybeBinaryOp(tokens, expression)
  }

  const atom = parseAtom(tokens)
  return maybeBinaryOp(tokens, atom)
}

export default function parser (tokens) {
  const expression = parseExpression(tokens)
  return maybeBinaryOp(tokens, expression)
}
