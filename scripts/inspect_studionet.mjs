import fs from 'node:fs';
import {createClient} from 'genlayer-js';
import {studionet} from 'genlayer-js/chains';
const progress = JSON.parse(fs.readFileSync('onchain-progress.json', 'utf8'));
const client = createClient({chain:studionet, endpoint:'https://studio.genlayer.com/api'});
const clean = value => JSON.stringify(value, (key, item) => /node_config|api.?key|private.?key|secret|token/i.test(key) ? '[omitted]' : typeof item === 'bigint' ? item.toString() : item, 2);
for (const [name, hash] of Object.entries(progress.transactions)) {
  const transaction = await client.getTransaction({hash});
  const raw = transaction.consensus_data?.leader_receipt;
  const receipts = Array.isArray(raw) ? raw : raw ? [raw] : [];
  console.log(name, hash, clean({status:transaction.statusName, receipts:receipts.map(r => ({
    mode:r.mode, vote:r.vote, executionResult:r.execution_result,
    resultStatus:r.result?.status, errorDescription:r.genvm_result?.error_description,
    errorCode:r.genvm_result?.error_code, stateHash:r.contract_state_hash,
  }))}));
}
