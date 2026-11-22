'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var orders = require('../lib/orders');
var ledger = require('../lib/ledger');

test('order history sorts Indian calendar dates newest first', function () {
  var db = {
    orders: [
      { id: 1004, date: '30/01/2022' },
      { id: 1001, date: '28/12/2021' },
      { id: 1008, date: '15/03/2022' }
    ]
  };

  assert.deepEqual(orders.list(db, {}).map(function (order) { return order.id; }), [1008, 1004, 1001]);
});

test('order history date range filters using calendar dates', function () {
  var db = {
    orders: [
      { id: 1004, date: '30/01/2022' },
      { id: 1001, date: '28/12/2021' },
      { id: 1008, date: '15/03/2022' }
    ]
  };

  assert.deepEqual(orders.list(db, { from: '2022-03-01', to: '2022-03-31' }).map(function (order) { return order.id; }), [1008]);
});

test('Khata settlement adds a numeric amount and updates the balance', function () {
  var customer = {
    id: 1,
    name: 'Meera Joshi',
    openingBalance: 0,
    totalBilled: 2432.01,
    totalSettled: 1200
  };
  var db = { customers: [customer], nextSettlementId: 501, settlements: [] };

  var result = ledger.recordSettlement(db, 1, '500', 'cash', 'Counter payment');

  assert.equal(result.ok, true);
  assert.equal(customer.totalSettled, 1700);
  assert.equal(customer.balance, 732.01);
  assert.equal(result.settlement.amount, 500);
});

test('Khata settlement rejects a nonnumeric amount without changing the balance', function () {
  var customer = { id: 1, name: 'Meera Joshi', openingBalance: 0, totalBilled: 2432.01, totalSettled: 1200 };
  var db = { customers: [customer], nextSettlementId: 501, settlements: [] };

  var result = ledger.recordSettlement(db, 1, 'not a number');

  assert.equal(result.ok, false);
  assert.equal(customer.totalSettled, 1200);
  assert.equal(customer.balance, undefined);
  assert.equal(db.settlements.length, 0);
});
