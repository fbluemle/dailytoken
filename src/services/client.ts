import {chainIdToSlug} from '../utils';
import {ApiTokenResponse, DailyToken, NewsResource} from './types';

// Default production endpoint; can be overridden via env var
const DEFAULT_ENDPOINT =
  'https://dailytoken-relay-rho.vercel.app/api/token/trending';
const ENDPOINT = process.env.DAILYTOKEN_API_URL ?? DEFAULT_ENDPOINT;

// Required app token header for production relay
const APP_TOKEN_HEADER =
  '8a7144e4d11178082b8d9dc493b21356419f8b3f46b69efdf850231e7bcc5593';

export async function getDailyToken(): Promise<DailyToken> {
  const res = await fetch(ENDPOINT, {
    headers: {
      'x-app-token': APP_TOKEN_HEADER,
    },
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }
  const json = (await res.json()) as ApiTokenResponse;

  const id = json.id ?? 'unknown';
  const name = json.name ?? 'Unknown';
  const symbol = json.symbol ?? '?';
  const contractAddress = json.address ?? '';

  const chainSlug = chainIdToSlug(json.chainId) ?? '';

  const priceUsd = json.price ?? 0;
  const changePct = json.priceChangePercentage ?? 0;

  return {
    id,
    name,
    symbol,
    contractAddress,
    chainSlug,
    chainId: json.chainId ?? 0,
    priceUsd,
    changePct,
    logoUrl: json.logo,
    marketCapUsd: json.marketCap,
    fdvUsd: json.fullyDilutedValuation,
    volumeUsd: json.totalVolume,
    totalSupply: json.totalSupply,
    circulatingSupply: json.circulatingSupply,
    holdersCount: json.holders,
    resources: Array.isArray(json.resources)
      ? (json.resources.filter(r => r && r.title && r.url) as NewsResource[])
      : undefined,
    summary: json.summary,
  };
}
