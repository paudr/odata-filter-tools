const visitor = {
  collection (node) {
    if (node.value.length === 1) {
      return visitExpression(node.value[0])
    } else {
      return node.value.map(visitExpression)
    }
  },
  boolean (node) {
    if (node.value === 'true') return true
    else if (node.value === 'false') return false
    else throw new Error()
  },
  constant (node) {
    if (node.value === 'null') return null
    if (node.value === 'NaN') return NaN
    if (node.value === 'INF') return Number.POSITIVE_INFINITY
    throw new Error()
  },
  date (node) { return node.value },
  number (node) { return node.value },
  string (node) { return node.value },
  guid (node) {
    return { guid: node.value }
  },
  alias (node) {
    return { alias: node.value }
  },
  negative (node) {
    return { not: visitAtom(node.value) }
  },
  functionCall (node) {
    return {
      [node.name]: node.parameters.map(visitAtom)
    }
  },
  lambda (node) {
    return {
      lambda: node.operation,
      path: node.navigation?.join('/'),
      name: node.name,
      expression: visitExpression(node.expression)
    }
  },
  property (node) {
    return {
      property: Array.isArray(node.navigation)
        ? [...node.navigation, node.value].join('/')
        : node.value
    }
  },
  literal (node) {
    return {
      literal: Array.isArray(node.navigation)
        ? [...node.navigation, node.value].join('/')
        : node.value
    }
  }
}

function visitAtom (node) {
  if (Array.isArray(node)) {
    return node.map(child => visitExpression(child))
  }
  if (node.type in visitor) {
    return visitor[node.type](node)
  }
}

function visitBinaryOp (binaryOp) {
  const canRepeat = ['and', 'or', 'add', 'sub', 'mul', 'div']
  if (canRepeat.includes(binaryOp.operator)) {
    const operands = []
    const add = node =>
      node.type === 'binaryOp' &&
      node.operator === binaryOp.operator
        ? operands.push(...visitBinaryOp(node)[binaryOp.operator])
        : operands.push(visitExpression(node))
    add(binaryOp.left)
    add(binaryOp.right)
    return { [binaryOp.operator]: operands }
  } else {
    return {
      [binaryOp.operator]: [
        visitExpression(binaryOp.left),
        visitExpression(binaryOp.right)
      ]
    }
  }
}

function visitExpression (expression) {
  if (expression.type === 'collection') {
    if (expression.value.length === 1 && ['binaryOp', 'collection'].includes(expression.value[0].type)) {
      return visitExpression(expression.value[0])
    } else {
      return expression.value.map(visitExpression)
    }
  } else if (expression.type === 'binaryOp') {
    return visitBinaryOp(expression)
  } else {
    return visitAtom(expression)
  }
}

export default function transformation (root) {
  return visitExpression(root)
}
