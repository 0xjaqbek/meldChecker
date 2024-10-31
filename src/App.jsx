import { useState, useEffect } from 'react';
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';
import { WagmiConfig, useAccount, useChainId, useSwitchChain } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { mainnet } from 'viem/chains';
import { ethers } from 'ethers';
import { Alert, AlertDescription } from "@/components/ui/alerts";
import { db } from './firebase/firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

// Create a client
const queryClient = new QueryClient();

// Define the MELD chain
const meldChain = {
  id: 333000333,
  name: 'Meld',
  network: 'meld',
  nativeCurrency: {
    decimals: 18,
    name: 'gMELD',
    symbol: 'gMELD',
  },
  rpcUrls: {
    default: { http: ['https://subnets.avax.network/meld/mainnet/rpc'] },
    public: { http: ['https://subnets.avax.network/meld/mainnet/rpc'] },
  },
  blockExplorers: {
    default: { name: 'MeldScan', url: 'https://meldscan.io' },
  }
};

// ABI for token balance checking
const minABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
];

// Web3Modal configuration
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

const metadata = {
  name: 'MELD Token Checker',
  description: 'Check your MELD token eligibility',
  url: window.location.origin,
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

const chains = [mainnet, meldChain];
const wagmiConfig = defaultWagmiConfig({ 
  chains, 
  projectId, 
  metadata,
  ssr: false 
});

createWeb3Modal({ 
  wagmiConfig, 
  projectId, 
  chains,
  themeMode: 'light'
});

const TokenChecker = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  
  const [telegramUsername, setTelegramUsername] = useState('');
  const [telegramUserId, setTelegramUserId] = useState('');
  const [isEligible, setIsEligible] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLink, setShowLink] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [tokenBalance, setTokenBalance] = useState('0');
  const [nftBalance, setNftBalance] = useState('0');

  useEffect(() => {
    // Telegram login widget setup
    const script = document.createElement('script');
    script.src = "https://telegram.org/js/telegram-widget.js?15";
    script.setAttribute('data-telegram-login', 'getDataForMeldBot');
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '5');
    script.setAttribute('data-auth-url', 'https://meldchecker.web.app');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.async = true;

    const container = document.getElementById('telegram-login');
    if (container) {
      container.innerHTML = '';
      container.appendChild(script);
    }

    // Telegram auth callback
    window.onTelegramAuth = (user) => {
      setTelegramUsername(user.username);
      setTelegramUserId(user.id);
    };
  }, []);

  const isCorrectNetwork = chainId === meldChain.id;

  const handleSwitchNetwork = async () => {
    try {
      await switchChain({ chainId: meldChain.id });
      setError('');
    } catch (err) {
      setError('Failed to switch network: ' + err.message);
    }
  };

  const checkEligibility = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!isCorrectNetwork) {
      setError('Please switch to MELD network');
      return;
    }

    setIsLoading(true);
    setError('');
    setIsEligible(null);

    try {
      const provider = new ethers.providers.JsonRpcProvider(meldChain.rpcUrls.default.http[0]);
      
      // Check MELD token balance
      const tokenAddress = '0x333000333528b1e38884a5d1EF13615B0C17a301';
      const tokenContract = new ethers.Contract(tokenAddress, minABI, provider);
      const tokenBalance = await tokenContract.balanceOf(address);
      const requiredTokenBalance = ethers.utils.parseUnits('5000000', 18);
      const tokenEligible = tokenBalance.gte(requiredTokenBalance);
      setTokenBalance(ethers.utils.formatUnits(tokenBalance, 18));

      // Check NFT balance
      const nftAddress = '0x333000Dca02578EfE421BE77FF0aCC0F947290f0';
      const nftContract = new ethers.Contract(nftAddress, minABI, provider);
      const nftBalance = await nftContract.balanceOf(address);
      const nftEligible = nftBalance.gt(0);
      setNftBalance(nftBalance.toString());

      // Set eligibility if either condition is met
      const eligible = tokenEligible || nftEligible;
      setIsEligible(eligible);

      if (eligible) {
        try {
          const response = await fetch('https://tokengate-8acc7ede28d5.herokuapp.com/generate-link');
          if (!response.ok) throw new Error('Failed to get invite link');
          const data = await response.json();
          setInviteLink(data.inviteLink);
        } catch (error) {
          setError('Error fetching invite link: ' + error.message);
        }
      }
    } catch (err) {
      setError('Error checking eligibility: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const saveData = async () => {
    if (!telegramUsername) {
      setError('Please connect with Telegram first');
      return;
    }

    try {
      await addDoc(collection(db, "users"), {
        walletAddress: address,
        telegramUsername,
        telegramUserId,
        tokenBalance,
        nftBalance,
        timestamp: new Date()
      });
      setShowLink(true);
    } catch (error) {
      setError('Error saving data: ' + error.message);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">MELD Token Checker</h1>
      <div className="mb-6 text-center">
        <p className="text-gray-600">
          Required: 5,000,000 MELD tokens OR 1 MELD Banker NFT
        </p>
      </div>

      <div className="space-y-4">
        {/* Wallet Connection */}
        <div className="flex justify-center mb-6">
          <w3m-button />
        </div>

        {/* Connected Address Display */}
        {isConnected && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Connected Address:</p>
            <p className="font-mono text-sm break-all">{address}</p>
          </div>
        )}

        {/* Network Switch Button */}
        {isConnected && !isCorrectNetwork && (
          <button
            onClick={handleSwitchNetwork}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Switch to MELD Network
          </button>
        )}

        {/* Eligibility Check Button */}
        {isConnected && isCorrectNetwork && (
          <button
            onClick={checkEligibility}
            disabled={isLoading}
            className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Checking...' : 'Check Eligibility'}
          </button>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Balance Display */}
        {isConnected && tokenBalance !== '0' && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Your Balances:</p>
            <p className="font-mono text-sm">MELD Tokens: {Number(tokenBalance).toLocaleString()}</p>
            <p className="font-mono text-sm">MELD Banker NFTs: {nftBalance}</p>
          </div>
        )}

        {/* Eligibility Result */}
        {isEligible !== null && (
          <div className={`p-4 rounded-lg ${isEligible ? 'bg-green-50' : 'bg-red-50'}`}>
            {isEligible ? (
              <div className="space-y-4">
                <p className="text-green-700 font-medium">You are eligible!</p>
                
                {/* Telegram Login */}
                {!telegramUsername && (
                  <div id="telegram-login" className="flex justify-center" />
                )}

                {/* Telegram Username Display */}
                {telegramUsername && (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={telegramUsername}
                      readOnly
                      className="w-full p-2 border rounded bg-gray-50"
                    />
                    <button
                      onClick={saveData}
                      className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Get Invite Link
                    </button>
                  </div>
                )}

                {/* Invite Link */}
                {showLink && inviteLink && (
                  <a
                    href={inviteLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center text-blue-600 hover:text-blue-800 underline"
                  >
                    Join Telegram Group
                  </a>
                )}
              </div>
            ) : (
              <p className="text-red-700">
                You are not eligible. Required: Either 5,000,000 MELD tokens OR 1 MELD Banker NFT
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Wrap the component with WagmiConfig
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={wagmiConfig}>
        <TokenChecker />
      </WagmiConfig>
    </QueryClientProvider>
  );
};

export default App;