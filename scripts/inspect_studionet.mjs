import fs from 'node:fs';
import {createClient} from 'genlayer-js';
import {studionet} from 'genlayer-js/chains';
const progress = JSON.parse(fs.readFileSync('onchain-progress.json', 'utf8'));
const client = createClient({chain:studionet, endpoint:'https://studio.genlayer.com/api'});
const clean = value => JSON.stringify(value, (key, item) => /node_config|api.?key|private.?key|secret|token/i.test(key) ? '[omitted]' : typeof item === 'bigint' ? item.toString() : item, 2);
for (const [name, hash] of Object.entries(progress.transactions)) {
  const transaction = await client.getTransaction({hash});
  console.log(name, hash, clean({status:transaction.statusName, leaders:transaction.consensus_data?.leader_receipt}));
}
