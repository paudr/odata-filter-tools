import odataFilterParser from './parser/index.js'
import odataFilterTraverse from './traverse.js'
import odataFilterCompare from './compare.js'
import odataFilterEncode from './encode.js'

export default class OdataFilterManager {
  constructor (filters, aggrupationOperation = null) {
    this.conditions = []
    for (const filter of filters) {
      if (filter instanceof OdataFilterManager) {
        this.conditions.push(filter)
      } else if (typeof filter === 'string') {
        const structure = odataFilterParser(filter)
        const aliases = []
        odataFilterTraverse(structure, (node, path) => {
          if (node.alias) {
            aliases.push({ name: node.alias.substring(1), path: node.path })
          }
        })
        this.conditions.push({ filter, structure, aliases })
      } else {
        throw new Error()
      }
    }
    this.aggrupationOperation = aggrupationOperation
  }

  getConditionValue (node) {
    const entries = []
    for (const condition of this.conditions) {
      if (condition instanceof OdataFilterManager) {
        const subentries = condition.getConditionValue(node)
        if (subentries.length > 0) {
          entries.push(...subentries)
        }
      } else {
        odataFilterCompare(condition.structure, node, entries)
      }
    }
    return entries
  }

  readFilter (filter) {
    if (!this.aggrupationOperation) {
      throw new Error()
    }
    const entries = []
    if (filter) {
      const structure = odataFilterParser(filter)
      const parts = Array.isArray(structure[this.aggrupationOperation])
        ? [structure, ...structure[this.aggrupationOperation]]
        : [structure]
      for (const part of parts) {
        const currentEntries = this.getConditionValue(part)
        if (currentEntries.length > 0) {
          entries.push(...currentEntries)
        }
      }
    }
    return entries
  }

  findValuesInFilter (filter) {
    const entries = []
    const structure = odataFilterParser(filter)
    odataFilterTraverse(structure, node => {
      const currentEntries = this.getConditionValue(node)
      if (currentEntries.length > 0) {
        entries.push(...currentEntries)
      }
    })
    return entries
  }

  writeFilter (entries) {
    if (!this.aggrupationOperation) {
      throw new Error()
    }

    const parts = []
    for (const condition of this.conditions) {
      if (condition instanceof OdataFilterManager) {
        const subfilter = condition.writeFilter(entries)
        if (subfilter) {
          parts.push(subfilter)
        }
      } else {
        if (condition.aliases.every(alias => entries.some(([name]) => alias.name === name))) {
          parts.push(odataFilterEncode(condition.structure, entries))
        }
      }
    }

    return parts.length > 0
      ? `(${parts.join(` ${this.aggrupationOperation} `)})`
      : ''
  }
}
