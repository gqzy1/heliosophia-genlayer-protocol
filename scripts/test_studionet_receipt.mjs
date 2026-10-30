import assert from 'node:assert/strict';
import test from 'node:test';
import {summarizeReceipt} from './studionet_receipt.mjs';

const leader = {mode:'leader', execution_result:'SUCCESS', result:{status:'return'}};
const idle = {mode:'validator', vote:'idle', execution_result:'ERROR',
  result:{status:'contract_error', payload:'idle'},
  genvm_result:{error_code:'CONSENSUS_VALIDATOR_QUORUM_REACHED'}};
const transaction = receipts => ({statusName:'FINALIZED', consensus_data:{leader_receipt:receipts,
  votes:{a:'agree',b:'agree',c:'agree',d:'idle',e:'idle'}}});

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
test('a finalized successful leader without consensus is rejected', () => {
  const tx = transaction([leader,idle]);
  tx.consensus_data.votes = {a:'disagree',b:'disagree',c:'disagree',d:'idle',e:'idle'};
  const summary = summarizeReceipt(tx, '0x123');
  assert.equal(summary.successful, false);
  assert.equal(summary.quorumAgreed, false);
});
test('an undetermined transaction cannot pass even with a successful leader', () => {
  const tx = transaction([leader]);
  tx.statusName = 'UNDETERMINED';
  assert.equal(summarizeReceipt(tx, '0x123').successful, false);
});
