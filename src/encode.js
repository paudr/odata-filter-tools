import { operators, functions } from './definition.js'

export default function odataFilterEncode (structure) {
  if (structure === undefined || typeof structure === 'symbol') {
    return undefined
  }

  if (structure === null) {
    return 'null'
  }

  if (structure === Number.POSITIVE_INFINITY) {
    return 'INF'
  }

  if (structure === isNaN) {
    return 'NaN'
  }

  if (structure instanceof Date) {
    return structure.toISOString()
  }

  if (typeof structure === 'string') {
    if (!structure.includes("'")) {
      return `'${structure}'`
    } else {
      return `'${structure.replace(/'/g, "''")}'`
    }
  }

  if (typeof structure === 'number' || typeof structure === 'bigint' || typeof structure === 'boolean') {
    return String(structure)
  }

  if (structure.not) {
    return '-' + odataFilterEncode(structure.not)
  }

  if (Array.isArray(structure)) {
    return `(${
      structure.map(element => odataFilterEncode(element)).join(',')
    })`
  }

  if (structure.lambda) {
    return `${structure.path}/${structure.lambda}(${structure.name}:${odataFilterEncode(structure.expression)})`
  }

  if (structure.guid) {
    return structure.guid
  }

  if (structure.alias) {
    return structure.alias
  }

  if (structure.property) {
    return structure.property
  }

  if (structure.literal) {
    return structure.literal
  }

  const functionName = functions.find(name => name in structure)
  if (functionName) {
    if (Array.isArray(structure[functionName])) {
      const parameters = structure[functionName].map(param => odataFilterEncode(param))
      return `${functionName}(${parameters.join(', ')})`
    } else {
      const parameter = odataFilterEncode(structure[functionName])
      return `${functionName}(${parameter})`
    }
  }

  const operatorName = operators.find(name => name in structure)
  if (operatorName) {
    const operands = structure[operatorName].map(operand => odataFilterEncode(operand))
    return `(${operands.join(` ${operatorName} `)})`
  }

  throw new Error('El filtro odata no se reconoce.')
}
