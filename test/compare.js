import test from 'tape'
import { odataFilterCompare } from '../src/index.js'

test('Compara estructuras.', t => {
  t.true(odataFilterCompare(
    {
      eq: [
        { property: 'Title' },
        { alias: '@title' }
      ]
    },
    {
      eq: [
        { property: 'Title' },
        { alias: '@title' }
      ]
    }
  ))

  t.false(odataFilterCompare(
    {
      eq: [
        { property: 'Title' },
        { alias: '@title' }
      ]
    },
    {
      eq: [
        { property: 'Titles' },
        { alias: '@title' }
      ]
    }
  ))

  t.false(odataFilterCompare(
    {
      eq: [
        { property: 'Title' },
        { alias: '@title' }
      ]
    },
    {
      eq: [
        { property: 'Title' },
        { alias: '@title', navigation: [] }
      ]
    }
  ))

  t.false(odataFilterCompare(
    {
      eq: [
        { property: 'Title' },
        { alias: '@title' }
      ]
    },
    {
      eq: [
        { property: 'Title' }
      ]
    }
  ))

  t.false(odataFilterCompare(
    {
      ne: [
        { property: 'Title' },
        { alias: '@title' }
      ]
    },
    {
      eq: [
        { property: 'Title' },
        { alias: '@title' }
      ]
    }
  ))

  t.end()
})

test('Compara alias.', t => {
  t.true(odataFilterCompare(
    {
      eq: [
        { property: 'Title' },
        { alias: '@title' }
      ]
    },
    {
      eq: [
        { property: 'Title' },
        { alias: '@title' }
      ]
    }
  ))

  t.false(odataFilterCompare(
    {
      eq: [
        { property: 'Title' },
        { alias: '@title' }
      ]
    },
    {
      eq: [
        { property: 'Title' },
        { alias: '@name' }
      ]
    }
  ))

  t.false(odataFilterCompare(
    {
      eq: [
        { property: 'Title' },
        { alias: '@title' }
      ]
    },
    {
      eq: [
        { property: 'Title' },
        'A book'
      ]
    }
  ))

  t.end()
})

test('Extrae valores de los alias.', t => {
  const eqEntries = []
  const eqComparison = odataFilterCompare(
    {
      eq: [
        { property: 'Title' },
        { alias: '@title' }
      ]
    },
    {
      eq: [
        { property: 'Title' },
        'A book'
      ]
    },
    eqEntries
  )

  t.true(eqComparison)
  t.deepEqual(eqEntries, [['title', 'A book']])

  const betweenEntries = []
  const betweenComparison = odataFilterCompare(
    {
      and: [{
        ge: [
          { property: 'Date' },
          { alias: '@date_ge' }
        ]
      }, {
        le: [
          { property: 'Date' },
          { alias: '@date_le' }
        ]
      }]
    },
    {
      and: [{
        ge: [
          { property: 'Date' },
          new Date(2022, 0, 1)
        ]
      }, {
        le: [
          { property: 'Date' },
          new Date(2022, 2, 10)
        ]
      }]
    },
    betweenEntries
  )

  t.true(betweenComparison)
  t.deepEqual(betweenEntries, [
    ['date_ge', new Date(2022, 0, 1)],
    ['date_le', new Date(2022, 2, 10)]
  ])

  t.end()
})

test('Funciones lambda.', t => {
  const entries = []
  t.true(odataFilterCompare(
    {
      lambda: 'any',
      path: 'Line',
      name: 'o',
      expression: {
        in: [
          { property: 'ItemId' },
          [2, 5, 8]
        ]
      }
    },
    {
      lambda: 'any',
      path: 'Line',
      name: 'o',
      expression: {
        in: [
          { property: 'ItemId' },
          [2, 5, 8]
        ]
      }
    },
    entries
  ))

  t.deepEqual(entries, [])

  t.end()
})

test('Alias por delante', t => {
  const eqEntries = []
  const eqComparison = odataFilterCompare(
    {
      and: [{
        eq: [
          { property: 'Title' },
          { alias: '@title' }
        ]
      }, {
        eq: [1, 1]
      }]
    },
    {
      and: [{
        eq: [
          { property: 'Title' },
          'A book'
        ]
      }, {
        eq: [1, 2]
      }]
    },
    eqEntries
  )

  t.false(eqComparison)
  t.deepEqual(eqEntries, [])

  t.end()
})
