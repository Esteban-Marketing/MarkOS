'use strict';

const { createInMemoryStore } = require('./engine.cjs');
const { createInMemoryDeliveryStore, createInMemoryQueue } = require('./delivery.cjs');

let _subscriptions = null;
let _deliveries = null;
let _queue = null;

function getWebhookStores() {
  if (!_subscriptions) _subscriptions = createInMemoryStore();
  if (!_deliveries) _deliveries = createInMemoryDeliveryStore();
  if (!_queue) _queue = createInMemoryQueue();
  return { subscriptions: _subscriptions, deliveries: _deliveries, queue: _queue };
}

function _resetWebhookStoresForTests() {
  _subscriptions = null;
  _deliveries = null;
  _queue = null;
}

module.exports = { getWebhookStores, _resetWebhookStoresForTests };
