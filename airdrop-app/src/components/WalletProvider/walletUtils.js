import { useState } from 'react';

const useWallet2 = () => {
  const [state, setState] = useState({
    connectedStatus: false,
    description: null,
    address: null
  });
  if (window.ethereum) { //check if Metamask is installed
    try {
      window.ethereum.enable().then(address => {
        setState({
          ...state,
          connectedStatus: true,
          address: address
        });
      });
    } catch (error) {
      setState({
        ...state,
        connectedStatus: false,
        description: '🦊 Connect to Metamask using the button on the top right.',
        address: null
      });
    }
  } else {
    setState({
      ...state,
      connectedStatus: false,
      description: '🦊 You must install Metamask into your browser: https://metamask.io/download.html',
      address: null
    });
  }
};

export default useWallet2;
