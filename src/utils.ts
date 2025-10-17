export const usdcAddressMap: Record<number, string> = {
  1: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // Ethereum Mainnet
  42161: '0xaf88d065e77c8cc2239327c5edb3a432268e5831', // Arbitrum
  137: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359', // Polygon (Matic)
  10: '0x0b2c639c533813f4aa9d7837caf62653d097ff85', // Optimism
  8453: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', // Base
  56: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', // BNB Chain (BSC)
  43114: '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664', // Avalanche
  534352: '0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4', // Scroll
  59144: '0x176211869ca2b568f2a7d4ee941e073a821ee1ff', // Linea
  5000: '0x09bc4e0d864854c6afb6eb9a9cdf58ac190d0df9', // Mantle
  34443: '0xd988097fb8612cc24eeC14542bC03424c656005f', // Mode
  130: '0x078d782b760474a361dda0af3839290b0ef57ad6', // Unichain
  1399811149: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // Solana
};

export function chainIdToSlug(id?: number): string | null {
  switch (id) {
    case 1:
      return 'ethereum';
    case 56:
      return 'bsc';
    case 137:
      return 'polygon';
    case 10:
      return 'optimism';
    case 42161:
      return 'arbitrum';
    case 8453:
      return 'base';
    case 43114:
      return 'avalanche';
    case 534352:
      return 'scroll';
    case 59144:
      return 'linea';
    case 5000:
      return 'mantle';
    case 34443:
      return 'mode';
    default:
      return null;
  }
}

export function buildMatchaTradeUrl(
  contractAddress: string,
  amountUsd: string = '20',
  chainId?: number,
): string | null {
  if (!contractAddress || !chainId) {
    return null;
  }
  const chainSlug = chainIdToSlug(chainId);
  const usdc = usdcAddressMap[chainId];
  if (!chainSlug || !usdc) {
    return null;
  }

  const baseUrl = `https://matcha.xyz/tokens/${chainSlug}/${contractAddress}`;

  const params: Record<string, string> = {};

  if (Number(amountUsd) > 0) {
    params.sellAmount = String(amountUsd);
  }
  params.sellChain = String(chainId);
  params.sellAddress = usdc.toLowerCase();

  const query = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  return `${baseUrl}?${query}`;
}
