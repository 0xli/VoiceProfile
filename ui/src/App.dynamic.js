// frontend/src/App.js
// frontend/src/App.js
import React from 'react';
import MintVoiceNFT from './components/MintVoiceNFT';
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core';
// import { DynamicContextProvider, DynamicWidget } from '@dynamic-labs/sdk-react-core';
// import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
//<DynamicContextProvider environmentId={process.env.REACT_APP_DYNAMIC_ENV_ID} >

function App() {
  return (
     <DynamicContextProvider environmentId="fe6976a9-7d12-4893-a723-0063e2df234c" >
    <div className="App">
      <MintVoiceNFT />
      </div>
      </DynamicContextProvider>
);
}

export default App;

// import { DynamicContextProvider, DynamicWidget } from '@dynamic-labs/sdk-react-core';
// import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
//
// const App = () => (
//     <DynamicContextProvider
// settings={{
//   environmentId: 'fe6976a9-7d12-4893-a723-0063e2df234c',
//       walletConnectors: [ EthereumWalletConnectors ],
// }}>
// <DynamicWidget />
// </DynamicContextProvider>
// );
//
// export default App;
