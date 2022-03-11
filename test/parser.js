import test from 'tape'
import { odataFilterParser } from '../src/index.js'

test('Condiciones.', t => {
  const eqAlias = odataFilterParser('Title eq @title')
  t.deepEqual(eqAlias,
    {
      eq: [
        { property: 'Title' },
        { alias: '@title' }
      ]
    }
  )

  const gtNumber = odataFilterParser('Quantity gt 100')
  t.deepEqual(gtNumber,
    {
      gt: [
        { property: 'Quantity' },
        100
      ]
    }
  )

  t.end()
})

test('Operaciones binarias encadenables.', t => {
  const addOperation = odataFilterParser('base add tax add income gt minimum')
  t.deepEqual(addOperation,
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
    }
  )

  const orOperation = odataFilterParser('condition eq true or number lt 300 or lookup in (2, 3, 5, 7)')
  t.deepEqual(orOperation,
    {
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
    }
  )

  const andOperation = odataFilterParser("contains(Name, 'corp') and Price gt 250000000 and Location eq 'Barcelona'")
  t.deepEqual(andOperation,
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
    }
  )

  t.end()
})

test('Funciones de cadena.', t => {
  const contains = odataFilterParser("contains(Name, 'corp')")
  t.deepEqual(contains,
    {
      contains: [
        { property: 'Name' },
        'corp'
      ]
    }
  )

  const startswith = odataFilterParser("startswith(Name, 'M')")
  t.deepEqual(startswith,
    {
      startswith: [
        { property: 'Name' },
        'M'
      ]
    }
  )

  t.end()
})

test('Fechas.', t => {
  const date = odataFilterParser('2022-03-09T23:00:00.000Z')
  t.isEquivalent(date,
    new Date(2022, 2, 10)
  )

  const structure = odataFilterParser('date(2022-11-20T23:00:00.000Z)')
  t.deepEqual(structure,
    { date: [new Date(2022, 10, 21)] }
  )

  t.end()
})

test('Funciones lambda.', t => {
  const structure1 = odataFilterParser('AGENT_FORMATPER/any(o: o/TARGETLIST in [31, 22])')
  t.deepEqual(structure1,
    {
      lambda: 'any',
      path: 'AGENT_FORMATPER',
      name: 'o',
      expression: {
        in: [
          { property: 'o/TARGETLIST' },
          [31, 22]
        ]
      }
    }
  )

  const nested = odataFilterParser("Orders/any(o: o/Articles/all(p: p/Category eq 'Cookies'))")
  t.deepEqual(nested,
    {
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
    }
  )

  t.end()
})

test('Literales.', t => {
  const structure = odataFilterParser('$it/Address/City eq ShipTo/City')
  t.deepEqual(structure,
    {
      eq: [
        { property: '$it/Address/City' },
        { property: 'ShipTo/City' }
      ]
    }
  )

  const count = odataFilterParser('Country/City/$count')
  t.deepEqual(count, { literal: 'Country/City/$count' })

  t.end()
})

test('Alias.', t => {
  const structure = odataFilterParser('$it/Address/City eq @city')
  t.deepEqual(structure,
    {
      eq: [
        { property: '$it/Address/City' },
        { alias: '@city' }
      ]
    }
  )

  const count = odataFilterParser('Country/City/$count')
  t.deepEqual(count, { literal: 'Country/City/$count' })

  t.end()
})

test('Valor null.', t => {
  const structure = odataFilterParser('Value eq null')
  t.deepEqual(structure,
    {
      eq: [
        { property: 'Value' },
        null
      ]
    }
  )

  t.end()
})

test('Valor INF.', t => {
  const structure = odataFilterParser('Value eq INF')
  t.deepEqual(structure,
    {
      eq: [
        { property: 'Value' },
        Infinity
      ]
    }
  )

  t.end()
})

test('Parentesis de un elemento.', t => {
  const eqAlias = odataFilterParser('(Title eq @title)')
  t.deepEqual(eqAlias, {
    eq: [
      { property: 'Title' },
      { alias: '@title' }
    ]
  })

  const gtNumber = odataFilterParser('(Quantity gt 100)')
  t.deepEqual(gtNumber, {
    gt: [
      { property: 'Quantity' },
      100
    ]
  })
  t.end()
})

test('Parentesis en cada operacion.', t => {
  const orOperation = odataFilterParser('((condition eq true) or (number lt 300) or (lookup in (2)))')
  t.deepEqual(orOperation, {
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
        [2]
      ]
    }]
  })

  t.end()
})
