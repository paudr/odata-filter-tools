import { operators, functions } from './definition.js'

export default function odataFilterEncode (structure, entries) {
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
    return '-' + odataFilterEncode(structure.not, entries)
  }

  if (Array.isArray(structure)) {
    return `(${
      structure.map(element => odataFilterEncode(element, entries)).join(',')
    })`
  }

  if (structure.lambda) {
    return `${structure.path}/${structure.lambda}(${structure.name}:${odataFilterEncode(structure.expression, entries)})`
  }

  if (structure.guid) {
    return structure.guid
  }

  if (structure.alias) {
    const aliasName = structure.alias.substring(1)
    const alias = Array.isArray(entries) && entries.find(([name]) => name === aliasName)
    if (alias) {
      return odataFilterEncode(alias[1], entries)
    } else {
      return structure.alias
    }
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
      const parameters = structure[functionName].map(param => odataFilterEncode(param, entries))
      return `${functionName}(${parameters.join(', ')})`
    } else {
      const parameter = odataFilterEncode(structure[functionName], entries)
      return `${functionName}(${parameter})`
    }
  }

  const operatorName = operators.find(name => name in structure)
  if (operatorName) {
    const operands = structure[operatorName].map(operand => odataFilterEncode(operand, entries))
    return `(${operands.join(` ${operatorName} `)})`
  }

  throw new Error('El filtro odata no se reconoce.')
}
