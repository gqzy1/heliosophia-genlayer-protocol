import fs from 'node:fs';
import {createClient} from 'genlayer-js';
import {studionet} from 'genlayer-js/chains';
const progress = JSON.parse(fs.readFileSync('onchain-progress.json', 'utf8'));
const client = createClient({chain:studionet, endpoint:'https://studio.genlayer.com/api'});
const printable = result => result?.payload?.readable ?? (typeof result?.payload === 'string' ? result.payload : undefined);
const report = r => ({mode:r.mode, vote:r.vote, executionResult:r.execution_result,
  resultStatus:r.result?.status, result:printable(r.result),
  errorDescription:r.genvm_result?.error_description, errorCode:r.genvm_result?.error_code,
  nondetDisagree:r.nondet_disagree,
  equivalence:Object.fromEntries(Object.entries(r.eq_outputs ?? {}).map(([key,value]) => [key,printable(value)]))});
for (const [name, hash] of Object.entries(progress.transactions)) {
  if (name !== 'submitReplicationProof') continue;
  const tx = await client.getTransaction({hash});
  const raw = tx.consensus_data?.leader_receipt;
  const leaders = Array.isArray(raw) ? raw : raw ? [raw] : [];
  console.log(name, hash, JSON.stringify({status:tx.statusName,
    leaders:leaders.map(report), validators:(tx.consensus_data?.validators ?? []).map(report)},null,2));
}
