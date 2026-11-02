import {build} from 'esbuild';
import test from 'node:test';
import assert from 'node:assert/strict';
const bundle = await build({entryPoints:['src/config/studionet.ts'],bundle:true,write:false,format:'esm',platform:'node',plugins:[{name:'sdk-test-boundary',setup(b){b.onResolve({filter:/^genlayer-js$/},()=>({path:'sdk',namespace:'mock'}));b.onLoad({filter:/.*/,namespace:'mock'},()=>({contents:`export const createClient=c=>globalThis.__chainTest.createClient(c);export const generatePrivateKey=()=> '0x'+'1'.repeat(64);export const createAccount=()=>({address:'0x'+'1'.repeat(40)});`,loader:'js'}));}}]});
let i=0;
async function setup({receipt,readback,provider}={}){
 const calls=[];
 const tx={statusName:'FINALIZED',consensus_data:{leader_receipt:[{mode:'validator',execution_result:'ERROR'},{mode:'leader',execution_result:'SUCCESS',result:{status:'return'}}],votes:{a:'agree',b:'agree',c:'disagree'}}};
 const client={request:async({method})=>method==='eth_chainId'?'0xf22f':'0x0',writeContract:async p=>{calls.push(p);return '0x'+'a'.repeat(64)},waitForTransactionReceipt:async p=>{calls.push(p);return receipt??tx},readContract:async()=>JSON.stringify(readback??{id:'test-1',title:'Test discovery',preprint_url:'https://example.com/paper'})};
 globalThis.__chainTest={createClient:c=>{calls.push(c);return client}};
 globalThis.window={ethereum:provider,localStorage:{getItem:()=>null,setItem:()=>{}}};
 const mod=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text+`\n// instance ${i++}`).toString('base64'));
 return {mod,calls};
}
const params={contractAddress:'0x'+'2'.repeat(40),discoveryId:'test-1',leadAuthor:'author',title:'Test discovery',preprintUrl:'https://example.com/paper',targetMetricClause:'Measured value must be less than 1.26.',royaltyPoolUsdc:1000,replicatorShareBps:2000};
test('injected provider is passed to SDK and supersedes local signer',async()=>{const provider={request:async({method})=>method==='eth_requestAccounts'?['0x'+'3'.repeat(40)]:'0xf22f'};const {mod,calls}=await setup({provider});mod.connectStudionetSdkSigner();await mod.connectMetaMaskWallet();mod.getStudionetClient();assert.equal(calls.at(-1).provider,provider);assert.equal(typeof calls.at(-1).account,'string');});
test('rejected chain switch cannot mark a wallet connected',async()=>{const {mod}=await setup({provider:{request:async({method})=>{if(method==='eth_requestAccounts')return ['0x'+'3'.repeat(40)];throw Object.assign(new Error('Rejected'),{code:4001});}}});await assert.rejects(mod.connectMetaMaskWallet(),/Rejected/);});
test('wrong wallet chain is rejected after switch',async()=>{const {mod}=await setup({provider:{request:async({method})=>method==='eth_requestAccounts'?['0x'+'3'.repeat(40)]:method==='eth_chainId'?'0x1':null}});await assert.rejects(mod.connectMetaMaskWallet(),/61999/);});
test('read-only client does not create a signer',async()=>{const {mod,calls}=await setup();await mod.readDiscoveryFromStudionet(params.contractAddress,'test-1');assert.equal(calls[0].account,undefined);});
test('ACCEPTED is never labelled FINALIZED',async()=>{const {mod}=await setup({receipt:{statusName:'ACCEPTED'}});mod.connectStudionetSdkSigner();await assert.rejects(mod.registerDiscoveryOnChain(params),/FINALIZED/);});
test('FINALIZED failed execution cannot pass',async()=>{const {mod}=await setup({receipt:{statusName:'FINALIZED',consensus_data:{leader_receipt:[{mode:'leader',execution_result:'ERROR'}],votes:{a:'agree'}}}});mod.connectStudionetSdkSigner();await assert.rejects(mod.registerDiscoveryOnChain(params),/FINALIZED/);});
test('readback mismatch cannot become verified',async()=>{const {mod}=await setup({readback:{id:'another'}});mod.connectStudionetSdkSigner();await assert.rejects(mod.registerDiscoveryOnChain(params),/readback/);});
test('successful majority and exact readback establish the lifecycle',async()=>{const {mod,calls}=await setup();mod.connectStudionetSdkSigner();const phases=[];const result=await mod.registerDiscoveryOnChain({...params,onPhaseChange:p=>phases.push(p)});assert.equal(result.receiptStatus,'FINALIZED');assert.deepEqual(phases,['SIGNING_AND_SUBMITTING','PENDING_PROPOSING','COMMITTING_EQUIVALENCE','FINALIZED','READBACK_VERIFIED']);assert.equal(calls.find(c=>c.functionName)?.leaderOnly,false);assert.equal(calls.find(c=>c.status)?.status,'FINALIZED');});
