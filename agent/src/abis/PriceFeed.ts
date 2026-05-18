// The agent only ever reads the cached oracle value; it never triggers a
// fresh fetch (that's a non-payable write that costs gas). Keeping a single
// view entry here makes that intent obvious from the ABI.
export const PRICE_FEED_ABI = [
  {
    type: 'function',
    name: 'lastGoodPrice',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;
