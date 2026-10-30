import assert from 'node:assert/strict';
import test from 'node:test';
import {summarizeReceipt} from './studionet_receipt.mjs';

const leader = {mode:'leader', execution_result:'SUCCESS', result:{status:'return'}};
const idle = {mode:'validator', vote:'idle', execution_result:'ERROR',
  result:{status:'contract_error', payload:'idle'},
  genvm_result:{error_code:'CONSENSUS_VALIDATOR_QUORUM_REACHED'}};
const transaction = receipts => ({statusName:'FINALIZED', consensus_data:{leader_receipt:receipts}});

test('a quorum-canceled validator cannot replace a successful leader', () => {
  const summary = summarizeReceipt(transaction([leader,idle]), '0x123');
  assert.equal(summary.executionResult, 'SUCCESS');
  assert.equal(summary.successful, true);
  assert.equal(summary.error, null);
});
test('receipt order does not change the chosen leader', () => {
  assert.equal(summarizeReceipt(transaction([idle,leader]), '0x123').successful, true);
});
test('a genuine leader contract error is rejected', () => {
  const failed = {...leader, execution_result:'ERROR', result:{status:'contract_error', payload:'Invalid baseline'}};
  const summary = summarizeReceipt(transaction([failed,idle]), '0x123');
  assert.equal(summary.successful, false);
  assert.equal(summary.error, 'Invalid baseline');
});
test('a returned contract error cannot pass because of a success label', () => {
  const inconsistent = {...leader,result:{status:'contract_error',payload:'Failure'}};
  assert.equal(summarizeReceipt(transaction([inconsistent]), '0x123').successful, false);
});
test('an idle validator without a leader cannot establish success', () => {
  assert.equal(summarizeReceipt(transaction([idle]), '0x123').successful, false);
});
