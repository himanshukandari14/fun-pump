import { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./index.css";
import Header from "./components/Header";
import List from "./components/List";
import Factory from "../../artifacts/contracts/Factory.sol/Factory.json";
import config from "../config.json";
import images from "./images.json";
import Token from "./components/Token";
import Trade from "./components/Trade";

export default function Home() {
  const [account, setAccount] = useState("");
  const [factory, setFactory] = useState(null);
  const [fee, setFee] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [tokens, setTokens] = useState([]); // Changed from setToken to setTokens
  const [selectedToken, setSelectedToken] = useState(null); // Added for tracking selected token
  const [showTrade, setShowTrade] = useState(false);

  const toggleCreate = () => {
    setShowCreate(!showCreate);
  };

  const toggleTrade = (token) => {
    setSelectedToken(token); // Use selectedToken instead of overwriting tokens
    setShowTrade(!showTrade);
  };

  useEffect(() => {
    const template = async () => {
      try {
        const { ethereum } = window;

        if (!ethereum) {
          alert(
            "MetaMask is not installed. Please install MetaMask to use this app."
          );
          return;
        }

        const provider = new ethers.BrowserProvider(ethereum);
        setProvider(provider);

        const network = await provider.getNetwork();
        console.log("Current network:", network);

        if (!network || !config[network.chainId]?.factory?.address) {
          console.error(
            "Invalid network or contract not deployed for this chain."
          );
          return;
        }

        const signer = await provider.getSigner();
        setSigner(signer);

        const factory = new ethers.Contract(
          config[network.chainId].factory.address,
          Factory.abi,
          signer
        );
        setFactory(factory);

        const fee = await factory.fee();
        setFee(fee);

        const totalTokens = await factory.totalTokens();
        const tokensArray = [];

        for (let i = 0; i < totalTokens; i++) {
          if (i === 6) {
            break;
          }
          const tokenSale = await factory.getTokenSale(i);

          const token = {
            token: tokenSale.token,
            name: tokenSale.name,
            creator: tokenSale.creator,
            sold: tokenSale.sold,
            raised: tokenSale.raised,
            isOpen: tokenSale.isOpen,
            image: images[i],
          };
          tokensArray.push(token);
        }
        setTokens(tokensArray.reverse()); // Changed from setToken to setTokens

        const accounts = await ethereum.request({
          method: "eth_requestAccounts",
        });
        setAccount(accounts[0]);

        window.ethereum.on("accountsChanged", () => {
          window.location.reload();
        });
      } catch (error) {
        console.error("Error initializing template:", error);
        alert(error.message);
      }
    };

    template();
  }, []);

  return (
    <div className="page">
      <Header account={account} setAccount={setAccount} />
      <main>
        <div className="create">
          <button
            onClick={factory && account ? toggleCreate : undefined}
            className="btn--fancy"
          >
            {!factory
              ? "[ contract not deployed ]"
              : !account
              ? "[ please connect ]"
              : "[ start a new token ]"}
          </button>
        </div>

        <div className="listings">
          <h1>New listings</h1>

          <div className="tokens">
            {!account ? (
              <p>please connect wallet</p>
            ) : tokens.length === 0 ? (
              <p>No tokens listed</p>
            ) : (
              tokens.map((token, index) => (
                <Token toggleTrade={toggleTrade} token={token} key={index} />
              ))
            )}
          </div>
        </div>
      </main>

      {showCreate && (
        <List
          toggleCreate={toggleCreate}
          fee={fee}
          factory={factory}
          signer={signer}
        />
      )}

      {showTrade && (
        <Trade
          toggleTrade={toggleTrade}
          token={selectedToken}
          provider={provider}
          factory={factory}
        />
      )}
    </div>
  );
}
