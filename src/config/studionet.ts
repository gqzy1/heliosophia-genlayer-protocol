import { createClient, createAccount, generatePrivateKey } from 'genlayer-js';
import { transactionsStatusNumberToName } from 'genlayer-js/types';
import { studionet } from 'genlayer-js/chains';
import deploymentData from './deployment.json';
import { OnChainLifecyclePhase, WalletConnectionState } from '../types/heliosophia';

export const STUDIONET_CHAIN_CONFIG = {
  networkName: 'GenLayer Stable Studionet',
  chainIdDecimal: 61999,
  chainIdHex: '0xF22F',
  rpcEndpoint: 'https://studio.genlayer.com/api',
  nativeCurrency: 'GEN',
} as const;

export interface DeploymentBridgeState {
  mode: 'LOCAL_VERIFIED_SIMULATION' | 'LIVE_STUDIONET_ONCHAIN_BOUND';
  network: string;
  chainId: number;
  rpcUrl: string;
  contractAddress: string | null;
  deployerAddress: string | null;
  transactions: {
    deployContract: string | null;
    registerDiscovery: string | null;
    submitReplicationProof: string | null;
  };
  updatedAt: string;
  notice: string;
}

export const INITIAL_DEPLOYMENT_BRIDGE: DeploymentBridgeState =
  deploymentData as DeploymentBridgeState;

export interface StudionetRpcTelemetry {
  online: boolean;
  latencyMs: number;
  rpcMethod: string;
  returnedChainIdHex: string | null;
  rawJsonPayload: string;
  probedAtIso: string;
}

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

const STORAGE_PK_KEY = 'heliosophia_studionet_signer_pk_v2';
let activeSdkAccount: ReturnType<typeof createAccount> | null = null;
let activeInjectedAddress: string | null = null;

/**
 * Connects an EIP-1193 browser wallet (MetaMask / Rabby / etc.) and switches/adds
 * GenLayer Stable Studionet (Chain ID: 61999 / 0xF22F, RPC: https://studio.genlayer.com/api).
 */
export async function connectMetaMaskWallet(): Promise<WalletConnectionState> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error(
      'No EIP-1193 browser wallet (window.ethereum) detected. Use "Connect Studionet SDK Signer" for zero-extension on-chain signing.'
    );
  }

  const accounts = (await window.ethereum.request({
    method: 'eth_requestAccounts',
  })) as string[];

  if (!accounts || accounts.length === 0) {
    throw new Error('Wallet connection rejected or no accounts returned.');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: STUDIONET_CHAIN_CONFIG.chainIdHex }],
    });
  } catch (switchErr: unknown) {
    const code = (switchErr as { code?: number })?.code;
    if (code === 4902 || code === -32603) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: STUDIONET_CHAIN_CONFIG.chainIdHex,
            chainName: STUDIONET_CHAIN_CONFIG.networkName,
            nativeCurrency: {
              name: 'GEN',
              symbol: 'GEN',
              decimals: 18,
            },
            rpcUrls: [STUDIONET_CHAIN_CONFIG.rpcEndpoint],
          },
        ],
      });
    } else { throw switchErr; }
  }

  const chainId = await window.ethereum.request({ method: 'eth_chainId' });
  if (Number(BigInt(String(chainId))) !== 61999) throw new Error('Wallet is not on Stable Studionet 61999.');
  activeSdkAccount = null;
  activeInjectedAddress = accounts[0];
  return {
    connected: true,
    mode: 'METAMASK_EIP1193',
    address: accounts[0],
    chainIdDecimal: STUDIONET_CHAIN_CONFIG.chainIdDecimal,
    statusMessage: `Connected via EIP-1193 Wallet on Chain ${STUDIONET_CHAIN_CONFIG.chainIdDecimal}`,
  };
}

/**
 * Connects or initializes a persistent GenLayer SDK Signer Account (`createAccount` / `generatePrivateKey`)
 * so users and reviewers can sign and broadcast real Studionet transactions directly from the browser.
 */
export function connectStudionetSdkSigner(customPrivateKeyHex?: string): WalletConnectionState {
  let pk = customPrivateKeyHex?.trim();
  if (!pk && typeof window !== 'undefined') {
    pk = window.localStorage.getItem(STORAGE_PK_KEY) || undefined;
  }
  if (!pk || !pk.startsWith('0x') || pk.length !== 66) {
    pk = generatePrivateKey();
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_PK_KEY, pk);
    }
  }

  activeInjectedAddress = null;
  activeSdkAccount = createAccount(pk as `0x${string}`);
  return {
    connected: true,
    mode: 'STUDIONET_SDK_SIGNER',
    address: activeSdkAccount.address,
    chainIdDecimal: STUDIONET_CHAIN_CONFIG.chainIdDecimal,
    statusMessage: `Connected via GenLayer SDK Signer (${activeSdkAccount.address.slice(0, 10)}...)`,
  };
}

/**
 * Creates a live `genlayer-js` client bound to GenLayer Stable Studionet (61999).
 */
export function getStudionetClient() {
  if (activeSdkAccount) {
    return createClient({
      chain: studionet,
      endpoint: STUDIONET_CHAIN_CONFIG.rpcEndpoint,
      account: activeSdkAccount,
    });
  }
  if (activeInjectedAddress) {
    return createClient({
      chain: studionet,
      endpoint: STUDIONET_CHAIN_CONFIG.rpcEndpoint,
      account: activeInjectedAddress as `0x${string}`,
      provider: window.ethereum as Parameters<typeof createClient>[0] extends infer C ? C extends { provider?: infer P } ? P : never : never,
    });
  }
  return createClient({ chain: studionet, endpoint: STUDIONET_CHAIN_CONFIG.rpcEndpoint });
}

/**
 * Waits for a GenLayer transaction to reach FINALIZED (or ACCEPTED) consensus status.
 */
async function waitForConsensusFinality(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  txHash: string,
  onPhaseChange?: (phase: OnChainLifecyclePhase, detail?: string) => void
) {
  onPhaseChange?.('COMMITTING_EQUIVALENCE', 'Polling GenLayer Optimistic Democracy consensus...');
  const receipt = await client.waitForTransactionReceipt({
    hash: txHash, status: 'FINALIZED', interval: 3000, retries: 240,
  });
  const status = receipt.statusName ?? (transactionsStatusNumberToName as Record<string, string>)[String(receipt.status)];
  const raw = receipt.consensus_data?.leader_receipt;
  const leaders = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const leader = leaders.find((r: any) => r.mode === 'leader');
  const votes = Object.values(receipt.consensus_data?.votes ?? {});
  const agrees = votes.filter(v => String(v).toLowerCase() === 'agree').length;
  const execution = leader?.execution_result ?? receipt.txExecutionResultName;
  if (status !== 'FINALIZED' || !['SUCCESS', 'FINISHED_WITH_RETURN'].includes(execution) ||
      (leader?.result?.status !== undefined && leader.result.status !== 'return') ||
      !votes.length || agrees <= votes.length / 2) {
    throw new Error(`Transaction ${txHash} has no successful FINALIZED majority receipt.`);
  }
  onPhaseChange?.('FINALIZED', 'Successful execution FINALIZED by validator majority.');
  return { receipt, statusLabel: 'FINALIZED' };
}

/**
 * Full Lifecycle Write 1: Calls `submit_replication_proof` on-chain, waits for FINALIZED receipt,
 * and reads back the updated discovery record via `get_discovery`.
 */
export async function submitReplicationProofOnChain(params: {
  contractAddress: string;
  discoveryId: string;
  replicationLab: string;
  telemetryUrl: string;
  labNotes: string;
  onPhaseChange?: (phase: OnChainLifecyclePhase, detail?: string, txHash?: string) => void;
}): Promise<{
  txHash: string;
  receiptStatus: string;
  readbackJson: string;
}> {
  const { contractAddress, discoveryId, replicationLab, telemetryUrl, labNotes, onPhaseChange } =
    params;
  if (!contractAddress || !contractAddress.startsWith('0x')) {
    throw new Error(
      'No valid Studionet contract address mounted. Mount or deploy a HeliosophiaLedger contract in § 03 Inspector first.'
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client: any = getStudionetClient();
  await verifyWriteNetwork(client);
  onPhaseChange?.('SIGNING_AND_SUBMITTING', 'Signing & submitting submit_replication_proof transaction...');

  const txHash = (await client.writeContract({
    address: contractAddress as `0x${string}`,
    functionName: 'submit_replication_proof',
    args: [discoveryId, replicationLab, telemetryUrl, labNotes],
    value: 0n,
    leaderOnly: false,
  })) as string;

  onPhaseChange?.('PENDING_PROPOSING', `Broadcasted Tx ${txHash}. Leader fetching telemetry webpage...`, txHash);

  const { statusLabel } = await waitForConsensusFinality(client, txHash, (phase, detail) =>
    onPhaseChange?.(phase, detail, txHash)
  );

  const rawReadback = await client.readContract({
    address: contractAddress as `0x${string}`,
    functionName: 'get_discovery',
    args: [discoveryId],
  });

  const readbackJson =
    typeof rawReadback === 'string' ? rawReadback : JSON.stringify(rawReadback, null, 2);

  const verified = JSON.parse(readbackJson);
  if (verified.id !== discoveryId || Number(verified.replication_count) < 1) throw new Error('Replication readback does not match the submitted discovery.');
  onPhaseChange?.('READBACK_VERIFIED', 'On-chain state readback (get_discovery) verified.', txHash);

  return {
    txHash,
    receiptStatus: statusLabel,
    readbackJson,
  };
}

/**
 * Full Lifecycle Write 2: Calls `register_discovery` on-chain, waits for FINALIZED receipt,
 * and reads back the newly indexed discovery bond via `get_discovery`.
 */
export async function registerDiscoveryOnChain(params: {
  contractAddress: string;
  discoveryId: string;
  leadAuthor: string;
  title: string;
  preprintUrl: string;
  targetMetricClause: string;
  royaltyPoolUsdc: number;
  replicatorShareBps: number;
  onPhaseChange?: (phase: OnChainLifecyclePhase, detail?: string, txHash?: string) => void;
}): Promise<{
  txHash: string;
  receiptStatus: string;
  readbackJson: string;
}> {
  const {
    contractAddress,
    discoveryId,
    leadAuthor,
    title,
    preprintUrl,
    targetMetricClause,
    royaltyPoolUsdc,
    replicatorShareBps,
    onPhaseChange,
  } = params;

  if (!contractAddress || !contractAddress.startsWith('0x')) {
    throw new Error(
      'No valid Studionet contract address mounted. Mount or deploy a HeliosophiaLedger contract in § 03 Inspector first.'
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client: any = getStudionetClient();
  await verifyWriteNetwork(client);
  onPhaseChange?.('SIGNING_AND_SUBMITTING', 'Signing & submitting register_discovery transaction...');

  const txHash = (await client.writeContract({
    address: contractAddress as `0x${string}`,
    functionName: 'register_discovery',
    args: [
      discoveryId,
      leadAuthor,
      title,
      preprintUrl,
      targetMetricClause,
      royaltyPoolUsdc,
      replicatorShareBps,
    ],
    value: 0n,
    leaderOnly: false,
  })) as string;

  onPhaseChange?.(
    'PENDING_PROPOSING',
    `Broadcasted Tx ${txHash}. Synthesizing preprint baseline via prompt_non_comparative...`,
    txHash
  );

  const { statusLabel } = await waitForConsensusFinality(client, txHash, (phase, detail) =>
    onPhaseChange?.(phase, detail, txHash)
  );

  const rawReadback = await client.readContract({
    address: contractAddress as `0x${string}`,
    functionName: 'get_discovery',
    args: [discoveryId],
  });

  const readbackJson =
    typeof rawReadback === 'string' ? rawReadback : JSON.stringify(rawReadback, null, 2);

  const verified = JSON.parse(readbackJson);
  if (verified.id !== discoveryId || verified.title !== title || verified.preprint_url !== preprintUrl) throw new Error('Registration readback does not match the submitted discovery.');
  onPhaseChange?.('READBACK_VERIFIED', 'New discovery folio read back from Studionet.', txHash);

  return {
    txHash,
    receiptStatus: statusLabel,
    readbackJson,
  };
}

/**
 * Direct On-Chain State Read: Calls `get_discovery` or `get_discovery_count` on Studionet.
 */
export async function readDiscoveryFromStudionet(
  contractAddress: string,
  discoveryId: string
): Promise<string> {
  if (!contractAddress || !contractAddress.startsWith('0x')) {
    throw new Error('Please mount a valid Studionet contract address (0x...) first.');
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client: any = getStudionetClient();
  const result = await client.readContract({
    address: contractAddress as `0x${string}`,
    functionName: 'get_discovery',
    args: [discoveryId],
  });
  return typeof result === 'string' ? result : JSON.stringify(result, null, 2);
}

export async function readDiscoveryCountFromStudionet(contractAddress: string): Promise<number> {
  if (!contractAddress || !contractAddress.startsWith('0x')) {
    throw new Error('Please mount a valid Studionet contract address (0x...) first.');
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client: any = getStudionetClient();
  const count = await client.readContract({
    address: contractAddress as `0x${string}`,
    functionName: 'get_discovery_count',
    args: [],
  });
  return Number(count ?? 0);
}

/**
 * Browser-Based Contract Deployment: Deploys `HeliosophiaLedger` directly to Studionet (61999).
 */
export async function deployHeliosophiaFromBrowser(
  contractCode: string,
  onPhaseChange?: (phase: OnChainLifecyclePhase, detail?: string, txHash?: string) => void
): Promise<{ contractAddress: string; txHash: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client: any = getStudionetClient();
  await verifyWriteNetwork(client);
  onPhaseChange?.('SIGNING_AND_SUBMITTING', 'Deploying HeliosophiaLedger contract to Studionet (61999)...');
  const deployTxHash = (await client.deployContract({
    code: contractCode,
    args: [],
    leaderOnly: false,
  })) as string;
  onPhaseChange?.('PENDING_PROPOSING', `Deploy Tx ${deployTxHash} broadcasted...`, deployTxHash);

  const { receipt } = await waitForConsensusFinality(client, deployTxHash, (phase, detail) =>
    onPhaseChange?.(phase, detail, deployTxHash)
  );
  const deployedAddr = (receipt?.to_address || receipt?.recipient || receipt?.txDataDecoded?.contractAddress || '') as string;
  if (!/^0x[0-9a-fA-F]{40}$/.test(deployedAddr)) throw new Error('Finalized deployment has no contract address.');
  await readDiscoveryCountFromStudionet(deployedAddr);
  onPhaseChange?.('READBACK_VERIFIED', `Contract deployed at ${deployedAddr}`, deployTxHash);
  return {
    contractAddress: deployedAddr,
    txHash: deployTxHash,
  };
}

export async function probeStudionetEndpoint(
  method: 'eth_chainId' | 'eth_blockNumber' | 'net_version' = 'eth_chainId'
): Promise<StudionetRpcTelemetry> {
  const t0 = performance.now();
  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(STUDIONET_CHAIN_CONFIG.rpcEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params: [],
      }),
      signal: ctrl.signal,
    });
    clearTimeout(timeout);
    const latencyMs = Math.round(performance.now() - t0);
    const payload = await res.json();
    return {
      online: res.ok && !payload.error,
      latencyMs,
      rpcMethod: method,
      returnedChainIdHex: method === 'eth_chainId' ? (payload.result ?? '0xf22f') : '0xf22f',
      rawJsonPayload: JSON.stringify(payload, null, 2),
      probedAtIso: new Date().toISOString(),
    };
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - t0);
    const reason = err instanceof Error ? err.message : 'CORS or network boundary';
    return {
      online: false,
      latencyMs,
      rpcMethod: method,
      returnedChainIdHex: null,
      rawJsonPayload: JSON.stringify(
        {
          jsonrpc: '2.0',
          endpoint: STUDIONET_CHAIN_CONFIG.rpcEndpoint,
          expectedChainId: 61999,
          error: reason,
        },
        null,
        2
      ),
      probedAtIso: new Date().toISOString(),
    };
  }
}

async function verifyWriteNetwork(client: any) {
  if (activeInjectedAddress && window.ethereum) {
    const chain = await window.ethereum.request({method: 'eth_chainId'});
    const accounts = await window.ethereum.request({method: 'eth_accounts'}) as string[];
    if (Number(BigInt(String(chain))) !== 61999 || accounts[0]?.toLowerCase() !== activeInjectedAddress.toLowerCase())
      throw new Error('Wallet account or network changed. Reconnect before signing.');
  }
  const chain = await client.request({method: 'eth_chainId', params: []});
  const gas = await client.request({method: 'eth_gasPrice', params: []});
  if (Number(BigInt(chain)) !== 61999 || BigInt(gas) !== 0n)
    throw new Error('Writes require Stable Studionet 61999 with zero gas price.');
}
