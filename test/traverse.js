import test from 'tape'
import { odataFilterTraverse } from '../src/index.js'

test('Por defeto se recorre el filtro postorder.', t => {
  const checks = [
    node => t.equal(node.property, 'base'),
    node => t.equal(node.property, 'tax'),
    node => t.equal(node.property, 'income'),
    node => t.assert(Array.isArray(node.add) && node.add.length === 3),
    node => t.equal(node.property, 'minimum'),
    node => t.assert(Array.isArray(node.gt) && node.gt.length === 2)
  ]

  t.plan(checks.length)

  odataFilterTraverse(
    {
      gt: [{
        add: [
          { property: 'base' },
          { property: 'tax' },
          { property: 'income' }
        ]
      }, {
        property: 'minimum'
      }]
    },
    (node, path) => {
      const current = checks.shift()
      current(node)
    }
  )
})

test('Se puede recorrer el arbor preorder.', t => {
  const checks = [
    node => t.assert(Array.isArray(node.and) && node.and.length === 3),
    node => t.assert(Array.isArray(node.contains) && node.contains.length === 2),
    node => t.equal(node.property, 'Name'),
    node => t.equal(node, 'corp'),
    node => t.assert(Array.isArray(node.gt) && node.gt.length === 2),
    node => t.equal(node.property, 'Price'),
    node => t.equal(node, 250000000),
    node => t.assert(Array.isArray(node.eq) && node.eq.length === 2),
    node => t.equal(node.property, 'Location'),
    node => t.equal(node, 'Barcelona')
  ]

  t.plan(checks.length)

  odataFilterTraverse(
    {
      and: [{
        contains: [
          { property: 'Name' },
          'corp'
        ]
      }, {
        gt: [
          { property: 'Price' },
          250000000
        ]
      }, {
        eq: [
          { property: 'Location' },
          'Barcelona'
        ]
      }]
    },
    (node, path) => {
      const current = checks.shift()
      current(node)
    },
    { order: 'pre' }
  )
})

test('El metodo tambien recibe el path para llegar al nodo', t => {
  const checks = [
    (node, path) => t.equal(node.property, 'base') && t.deepEqual(path, ['gt', 0, 'add', 0]),
    (node, path) => t.equal(node.property, 'tax') && t.deepEqual(path, ['gt', 0, 'add', 1]),
    (node, path) => t.assert(Array.isArray(node.add)) && t.deepEqual(path, ['gt', 0]),
    (node, path) => t.equal(node, 250000000) && t.deepEqual(path, ['gt', 1]),
    (node, path) => t.assert(Array.isArray(node.gt)) && t.deepEqual(path, [])
  ]

  t.plan(checks.length)

  odataFilterTraverse(
    {
      gt: [
        {
          add: [
            { property: 'base' },
            { property: 'tax' }
          ]
        },
        250000000
      ]
    },
    (node, path) => {
      const current = checks.shift()
      current(node)
    }
  )
})

test('Se puede interrumpir el proceso.', t => {
  const checks = [
    node => t.equal(node.property, 'Name'),
    node => t.equal(node, 'corp'),
    node => t.assert(Array.isArray(node.contains) && node.contains.length === 2),
    node => t.equal(node.property, 'Price'),
    node => t.equal(node, 250000000),
    node => t.assert(Array.isArray(node.gt) && node.gt.length === 2),
    node => t.equal(node.property, 'Location'),
    node => t.equal(node, 'Barcelona'),
    node => t.assert(Array.isArray(node.eq) && node.eq.length === 2),
    node => t.assert(Array.isArray(node.and) && node.and.length === 3)
  ]

  const lastNodeId = 5
  let count = 1

  t.plan(lastNodeId)

  odataFilterTraverse(
    {
      and: [{
        contains: [
          { property: 'Name' },
          'corp'
        ]
      }, {
        gt: [
          { property: 'Price' },
          250000000
        ]
      }, {
        eq: [
          { property: 'Location' },
          'Barcelona'
        ]
      }]
    },
    (node, path) => {
      const current = checks.shift()
      current(node)
      count += 1
      return count > lastNodeId
    }
  )
})
