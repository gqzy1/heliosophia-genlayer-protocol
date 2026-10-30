import deploymentData from './deployment.json';

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

export const INITIAL_DEPLOYMENT_BRIDGE: DeploymentBridgeState = deploymentData as DeploymentBridgeState;

export interface StudionetRpcTelemetry {
  online: boolean;
  latencyMs: number;
  rpcMethod: string;
  returnedChainIdHex: string | null;
  rawJsonPayload: string;
  probedAtIso: string;
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
    const reason = err instanceof Error ? err.message : 'CORS or sandbox network boundary';
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
          status: 'LOCAL_GENVM_SANDBOX_FALLBACK',
          reason,
        },
        null,
        2
      ),
      probedAtIso: new Date().toISOString(),
    };
  }
}
