import test from 'tape'
import { OdataFilterManager } from '../src/index.js'

const manager = new OdataFilterManager([
  new OdataFilterManager([
    'Rating gt @rating_gt',
    'Rating lt @rating_lt'
  ], 'and'),
  'Rooms/any(room: room/BaseRate lt @maxRoomBaseRate)',
  'contains(HotelName, @hotelName)',
  new OdataFilterManager([
    'LastRenovationDate  gt @lastRenovation_gt',
    'LastRenovationDate  lt @lastRenovation_lt'
  ], 'and'),
  'ParkingIncluded eq @parkingIncluded',
  'Rooms/all(room: room/SmokingAllowed eq @smokingAllowed) and ParkingIncluded eq true'
  /*************/
  // 'Rooms/any()'
], 'and')

test('getConditionValue.', t => {
  const entries1 = manager.getConditionValue({
    gt: [
      { property: 'Rating' },
      25
    ]
  })
  t.deepEqual(entries1, [['rating_gt', 25]])

  const entries2 = manager.getConditionValue({
    lambda: 'any',
    path: 'Rooms',
    name: 'room',
    expression: {
      lt: [
        { property: 'room/BaseRate' },
        100
      ]
    }
  })
  t.deepEqual(entries2, [['maxRoomBaseRate', 100]])

  const entries3 = manager.getConditionValue({
    and: [{
      lambda: 'all',
      path: 'Rooms',
      name: 'room',
      expression: {
        eq: [
          { property: 'room/SmokingAllowed' },
          true
        ]
      }
    }, {
      eq: [
        { property: 'ParkingIncluded' },
        true
      ]
    }]
  })
  t.deepEqual(entries3, [['smokingAllowed', true]])

  const entries4 = manager.getConditionValue({
    and: [{
      lambda: 'all',
      path: 'Rooms',
      name: 'room',
      expression: {
        eq: [
          { property: 'room/SmokingAllowed' },
          true
        ]
      }
    }, {
      eq: [
        { property: 'ParkingIncluded' },
        false
      ]
    }]
  })
  t.deepEqual(entries4, [])

  t.end()
})

test('readFilter.', t => {
  const entries1 = manager.readFilter('(Rooms/any(room:(room/BaseRate lt 200)) and (ParkingIncluded eq true))')
  t.deepEqual(entries1, [
    ['maxRoomBaseRate', 200],
    ['parkingIncluded', true]
  ])

  const entries2 = manager.readFilter("(Rooms/any(room:(room/BaseRate lt 3000)) and ((LastRenovationDate gt 2022-03-09T23:00:00.000Z)) and (ParkingIncluded eq 'Yes'))")
  t.deepEqual(entries2, [
    ['maxRoomBaseRate', 3000],
    ['lastRenovation_gt', new Date(2022, 2, 10)],
    ['parkingIncluded', 'Yes']
  ])

  const entries3 = manager.readFilter('(((LastRenovationDate gt 2021-12-31T23:00:00.000Z) and (LastRenovationDate lt 2022-03-09T23:00:00.000Z)))')
  t.deepEqual(entries3, [
    ['lastRenovation_gt', new Date(2022, 0, 1)],
    ['lastRenovation_lt', new Date(2022, 2, 10)]
  ])

  t.end()
})

test('findValuesInFilter.', t => {
  const entries1 = manager.findValuesInFilter('(Rooms/any(room:(room/BaseRate lt 200)) and (ParkingIncluded eq true))')
  t.deepEqual(entries1, [
    ['maxRoomBaseRate', 200],
    ['parkingIncluded', true]
  ])

  const entries2 = manager.findValuesInFilter("(Rooms/any(room:(room/BaseRate lt 3000)) and ((LastRenovationDate gt 2022-03-09T23:00:00.000Z)) and (ParkingIncluded eq 'Yes'))")
  t.deepEqual(entries2, [
    ['maxRoomBaseRate', 3000],
    ['lastRenovation_gt', new Date(2022, 2, 10)],
    ['parkingIncluded', 'Yes']
  ])

  const entries3 = manager.findValuesInFilter('(((LastRenovationDate gt 2021-12-31T23:00:00.000Z) and (LastRenovationDate lt 2022-03-09T23:00:00.000Z)))')
  t.deepEqual(entries3, [
    ['lastRenovation_gt', new Date(2022, 0, 1)],
    ['lastRenovation_lt', new Date(2022, 2, 10)]
  ])

  t.end()
})

test('writeFilter.', t => {
  const filter1 = manager.writeFilter([
    ['maxRoomBaseRate', 200],
    ['parkingIncluded', true]
  ])
  t.equal(filter1, '(Rooms/any(room:(room/BaseRate lt 200)) and (ParkingIncluded eq true))')

  const filter2 = manager.writeFilter([
    ['maxRoomBaseRate', 3000],
    ['parkingIncluded', 'Yes'],
    ['lastRenovation_gt', new Date(2022, 2, 10)]
  ])
  t.equal(filter2, "(Rooms/any(room:(room/BaseRate lt 3000)) and ((LastRenovationDate gt 2022-03-09T23:00:00.000Z)) and (ParkingIncluded eq 'Yes'))")

  const filter3 = manager.writeFilter([
    ['lastRenovation_gt', new Date(2022, 0, 1)],
    ['lastRenovation_lt', new Date(2022, 2, 10)]
  ])
  t.equal(filter3, '(((LastRenovationDate gt 2021-12-31T23:00:00.000Z) and (LastRenovationDate lt 2022-03-09T23:00:00.000Z)))')

  t.end()
})
