import { operators, functions } from './definition.js'

const visitor = {
  collection (node, method, options, path) {
    for (let index = 0; index < node.length; index += 1) {
      const child = node[index]
      if (odataFilterTraverse(child, method, options, [...path, index])) return true
    }
  },
  negative (node, method, options, path) {
    if (options.order === 'pre') {
      if (method(node, path)) return true
      if (odataFilterTraverse(node.not, method, options, [...path, 'not'])) return true
    } else if (options.order === 'post') {
      if (odataFilterTraverse(node.not, method, options, [...path, 'not'])) return true
      if (method(node, path)) return true
    }
  },
  functionCall (node, method, options, path) {
    const name = functions.find(name => name in node)
    if (options.order === 'pre') {
      if (method(node, path)) return true
      if (visitor.collection(node[name], method, options, [...path, name])) return true
    } else if (options.order === 'post') {
      if (visitor.collection(node[name], method, options, [...path, name])) return true
      if (method(node, path)) return true
    }
  },
  lambda (node, method, options, path) {
    const name = `${node.path}/${node.lambda}`
    if (options.order === 'pre') {
      if (method(node, path)) return true
      if (odataFilterTraverse(node.expression, method, options, [...path, name])) return true
    } else if (options.order === 'post') {
      if (odataFilterTraverse(node.expression, method, options, [...path, name])) return true
      if (method(node, path)) return true
    }
  },
  operators (node, method, options, path) {
    const name = operators.find(name => name in node)
    if (options.order === 'pre') {
      if (method(node, path)) return true
      if (visitor.collection(node[name], method, options, [...path, name])) return true
    } else if (options.order === 'post') {
      if (visitor.collection(node[name], method, options, [...path, name])) return true
      if (method(node, path)) return true
    }
  }
}

export default function odataFilterTraverse (node, method, options = { order: 'post' }, path = []) {
  if (
    typeof node === 'string' ||
    typeof node === 'number' ||
    typeof node === 'boolean' ||
    node === null ||
    node === isNaN ||
    node === Number.POSITIVE_INFINITY ||
    node instanceof Date ||
    node.guid ||
    node.alias ||
    node.property ||
    node.literal
  ) {
    return method(node, path)
  } else if (Array.isArray(node)) {
    return visitor.collection(node, method, options, path)
  } if (node.not) {
    return visitor.negative(node, method, options, path)
  } if (functions.some(name => name in node)) {
    return visitor.functionCall(node, method, options, path)
  } if (node.lambda) {
    return visitor.lambda(node, method, options, path)
  } if (operators.some(name => name in node)) {
    return visitor.operators(node, method, options, path)
  }
}
