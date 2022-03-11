export default function odataFilterCompare (conditionStructure, dataStructure, entries) {
  if (
    Array.isArray(entries) &&
    typeof conditionStructure?.alias === 'string' &&
    Object.keys(conditionStructure).length === 1
  ) {
    entries.push([conditionStructure.alias.substring(1), dataStructure])
    return true
  }

  if (typeof conditionStructure === typeof dataStructure) {
    if (
      Array.isArray(conditionStructure) &&
      Array.isArray(dataStructure) &&
      conditionStructure.length === dataStructure.length
    ) {
      let value = true
      for (let index = 0; index < conditionStructure.length; index += 1) {
        const result = odataFilterCompare(conditionStructure[index], dataStructure[index], entries)
        if (result === false) {
          return false
        } else if (Array.isArray(result)) {
          value = result
        }
      }
      return value
    }

    if (
      conditionStructure instanceof Date &&
      dataStructure instanceof Date
    ) {
      return conditionStructure.getTime() === dataStructure.getTime()
    }

    if (typeof conditionStructure === 'object') {
      const conditionKeys = Object.keys(conditionStructure)
      const dataKeys = Object.keys(dataStructure)
      if (
        conditionKeys.length === dataKeys.length &&
        conditionKeys.every(key => dataKeys.includes(key))
      ) {
        let value = true
        for (const key of conditionKeys) {
          const result = odataFilterCompare(conditionStructure[key], dataStructure[key], entries)
          if (result === false) {
            return false
          } else if (Array.isArray(result)) {
            value = result
          }
        }
        return value
      }
    }

    return conditionStructure === dataStructure
  }

  return false
}
