import test from 'tape'
import { odataFilterEncode } from '../src/index.js'

test('Condiciones.', t => {
  const eqAlias = odataFilterEncode({
    eq: [
      { property: 'Title' },
      { alias: '@title' }
    ]
  })
  t.equal(eqAlias, '(Title eq @title)')

  const gtNumber = odataFilterEncode({
    gt: [
      { property: 'Quantity' },
      100
    ]
  })
  t.equal(gtNumber, '(Quantity gt 100)')

  t.end()
})

test('Operaciones binarias encadenables.', t => {
  const addOperation = odataFilterEncode({
    gt: [{
      add: [
        { property: 'base' },
        { property: 'tax' },
        { property: 'income' }
      ]
    }, {
      property: 'minimum'
    }]
  })
  t.equal(addOperation, '((base add tax add income) gt minimum)')

  const orOperation = odataFilterEncode({
    or: [{
      eq: [
        { property: 'condition' },
        true
      ]
    }, {
      lt: [
        { property: 'number' },
        300
      ]
    }, {
      in: [
        { property: 'lookup' },
        [2, 3, 5, 7]
      ]
    }]
  })
  t.equal(orOperation, '((condition eq true) or (number lt 300) or (lookup in (2,3,5,7)))')

  const andOperation = odataFilterEncode({
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
  })
  t.equal(andOperation, "(contains(Name, 'corp') and (Price gt 250000000) and (Location eq 'Barcelona'))")

  t.end()
})

test('Funciones de cadena.', t => {
  const contains = odataFilterEncode({
    contains: [
      { property: 'Name' },
      'corp'
    ]
  })
  t.equal(contains, "contains(Name, 'corp')")

  const startswith = odataFilterEncode({
    startswith: [
      { property: 'Name' },
      'M'
    ]
  })
  t.equal(startswith, "startswith(Name, 'M')")

  t.end()
})

test('Fechas.', t => {
  const date = odataFilterEncode(new Date(2022, 2, 10))
  t.isEquivalent(date, '2022-03-09T23:00:00.000Z')

  const structure = odataFilterEncode({ date: [new Date(2022, 10, 21)] })
  t.equal(structure, 'date(2022-11-20T23:00:00.000Z)')

  t.end()
})

test('Funciones lambda.', t => {
  const structure1 = odataFilterEncode({
    lambda: 'any',
    path: 'AGENT_FORMATPER',
    name: 'o',
    expression: {
      in: [
        { property: 'o/TARGETLIST' },
        [31, 22]
      ]
    }
  })
  t.equal(structure1, 'AGENT_FORMATPER/any(o:(o/TARGETLIST in (31,22)))')

  const nested = odataFilterEncode({
    lambda: 'any',
    path: 'Orders',
    name: 'o',
    expression: {
      lambda: 'all',
      path: 'o/Articles',
      name: 'p',
      expression: {
        eq: [
          { property: 'p/Category' },
          'Cookies'
        ]
      }
    }
  })
  t.equal(nested, "Orders/any(o:o/Articles/all(p:(p/Category eq 'Cookies')))")

  t.end()
})

test('Literales.', t => {
  const structure = odataFilterEncode({
    eq: [
      { property: '$it/Address/City' },
      { property: 'ShipTo/City' }
    ]
  })
  t.equal(structure, '($it/Address/City eq ShipTo/City)')

  const count = odataFilterEncode({ literal: 'Country/City/$count' })
  t.equal(count, 'Country/City/$count')

  t.end()
})

test('Alias.', t => {
  const structure = odataFilterEncode({
    eq: [
      { property: '$it/Address/City' },
      { alias: '@city' }
    ]
  })
  t.equal(structure, '($it/Address/City eq @city)')

  const count = odataFilterEncode({ literal: 'Country/City/$count' })
  t.equal(count, 'Country/City/$count')

  t.end()
})

test('Valor null.', t => {
  const structure = odataFilterEncode({
    eq: [
      { property: 'Value' },
      null
    ]
  })
  t.equal(structure, '(Value eq null)')

  t.end()
})

test('Valor INF.', t => {
  const structure = odataFilterEncode({
    eq: [
      { property: 'Value' },
      Infinity
    ]
  })
  t.equal(structure, '(Value eq INF)')

  t.end()
})
