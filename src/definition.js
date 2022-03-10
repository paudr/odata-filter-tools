export const operatorPrecedence = {
  eq: 40,
  ne: 30,
  gt: 70,
  ge: 50,
  lt: 80,
  le: 60,
  and: 20,
  or: 10,
  add: 100,
  sub: 90,
  mul: 130,
  div: 120,
  mod: 110,
  has: 150,
  in: 140
}

export const operators = Object.keys(operatorPrecedence)

export const functions = [
  'cast',
  'ceiling',
  'concat',
  'contains',
  'date',
  'day',
  'endswith',
  'fractionalseconds',
  'floor',
  'hassubsequence',
  'hassubset',
  'hour',
  'indexof',
  'isof',
  'length',
  'matchesPattern',
  'maxdatetime',
  'mindatetime',
  'minute',
  'month',
  'now',
  'replace',
  'round',
  'second',
  'startswith',
  'substring',
  'substringof',
  'time',
  'tolower',
  'totaloffsetminutes',
  'totalseconds',
  'toupper',
  'trim',
  'year'
]

export const keywords = [
  'not',
  'true',
  'false',
  'null',
  'NaN',
  'INF'
]

export const lambdas = ['all', 'any']
