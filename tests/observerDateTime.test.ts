import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatLunarDate,
  formatUtcDateTimeInput,
  parseUtcDateTimeInput,
} from '../src/utils/observerDateTime';

await test('UTC datetime input round-trips without using the host timezone', () => {
  const date = parseUtcDateTimeInput('2026-09-12T00:30:45');
  assert.equal(date?.toISOString(), '2026-09-12T00:30:45.000Z');
  assert.equal(formatUtcDateTimeInput(date!), '2026-09-12T00:30:45');
  assert.equal(parseUtcDateTimeInput('2026-02-29T12:00:00'), null);
  assert.equal(parseUtcDateTimeInput('2026-09-12T24:00:00'), null);
});

await test('lunar date follows the selected UTC civil day at timezone boundaries', () => {
  const beforeBoundary = new Date('2026-09-11T23:30:00Z');
  const afterBoundary = new Date('2026-09-12T00:30:00Z');

  assert.equal(formatLunarDate(beforeBoundary), '丙午年八月初一');
  assert.equal(formatLunarDate(afterBoundary), '丙午年八月初二');
});
