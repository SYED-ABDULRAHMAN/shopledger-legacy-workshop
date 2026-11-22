'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var pricing = require('../lib/pricing');
var invoice = require('../lib/invoice');

test('CURRENT BEHAVIOUR: checkout applies coupon to taxable value before HSN GST', function () {
  var items = [
    { id: 1, name: 'Rice', hsn: '1006', price: 500, qty: 1 },
    { id: 2, name: 'Tea', hsn: '0902', price: 500, qty: 1 }
  ];

  assert.deepEqual(pricing.computeTotals(items, 'SAVE10'), {
    subtotal: 1000,
    discount: 100,
    taxable: 900,
    tax: 103.5,
    cgst: 51.75,
    sgst: 51.75,
    total: 1003.5,
    lines: [
      { id: 1, name: 'Rice', hsn: '1006', gstPercent: 5, gross: 500, discount: 50, taxable: 450, tax: 22.5, net: 472.5 },
      { id: 2, name: 'Tea', hsn: '0902', gstPercent: 18, gross: 500, discount: 50, taxable: 450, tax: 81, net: 531 }
    ]
  });
});

test('invoice matches checkout HSN slabs, proportional discount, tax, and total', function () {
  var order = {
    items: [
      { id: 1, name: 'Rice', sku: 'GRN-001', hsn: '1006', price: 500, qty: 1 },
      { id: 2, name: 'Tea', sku: 'BEV-001', hsn: '0902', price: 500, qty: 1 }
    ],
    coupon: 'SAVE10'
  };

  assert.deepEqual(invoice.computeInvoiceFigures(order), {
    subtotal: 1000,
    discount: 100,
    tax: 103.5,
    cgst: 51.75,
    sgst: 51.75,
    total: 1003.5,
    rows: [
      { name: 'Rice', sku: 'GRN-001', hsn: '1006', qty: 1, price: 500, gstPercent: 5, line: 500, lineTax: 22.5 },
      { name: 'Tea', sku: 'BEV-001', hsn: '0902', qty: 1, price: 500, gstPercent: 18, line: 500, lineTax: 81 }
    ]
  });
});

test('invoice respects the coupon maximum discount used by checkout', function () {
  var items = [{ id: 1, name: 'Coffee', hsn: '0901', price: 2000, qty: 1 }];
  var order = {
    items: [{ id: 1, name: 'Coffee', sku: 'BEV-002', hsn: '0901', price: 2000, qty: 1 }],
    coupon: 'WHOLESALE15'
  };

  assert.equal(pricing.computeTotals(items, 'WHOLESALE15').discount, 300);
  assert.equal(invoice.computeInvoiceFigures(order).discount, 300);
});

test('invoice resolves GST from HSN when stored order lines lack gstRate', function () {
  var result = invoice.computeInvoiceFigures({
    items: [{ name: 'Rice', hsn: '1006', price: 100, qty: 1 }],
    coupon: ''
  });

  assert.equal(result.rows[0].gstPercent, 5);
  assert.equal(result.tax, 5);
  assert.equal(result.total, 105);
});
