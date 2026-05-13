// components/MoralisProviderWrapper.tsx
'use client';

import { MoralisProvider } from 'react-moralis';

export default function MoralisProviderWrapper({ children }) {
  return (
    <MoralisProvider initializeOnMount={false}>
      {children}
    </MoralisProvider>
  );
}