import React, { useEffect, useState } from "react";
import { version } from "@walletconnect/client/package.json";
import * as encoding from "@walletconnect/encoding";

import Banner from "./components/Banner";
import Blockchain from "./components/Blockchain";
import Column from "./components/Column";
import Header from "./components/Header";
import Modal from "./components/Modal";
import { DEFAULT_MAIN_CHAINS, DEFAULT_TEST_CHAINS } from "./constants";
import {
  AccountAction,
  eip712,
  getLocalStorageTestnetFlag,
  setLocaleStorageTestnetFlag,
} from "./helpers";
import Toggle from "./components/Toggle";
import RequestModal from "./modals/RequestModal";
import PairingModal from "./modals/PairingModal";
import PingModal from "./modals/PingModal";
import {
  SAccounts,
  SAccountsContainer,
  SButtonContainer,
  SConnectButton,
  SContent,
  SLanding,
  SLayout,
  SToggleContainer,
} from "./components/app";
import { useWalletConnectClient } from "./contexts/ClientContext";
import { utils } from "ethers";

interface IFormattedRpcResponse {
  method: string;
  address: string;
  valid: boolean;
  result: string;
}

export default function App() {
  const [isTestnet, setIsTestnet] = useState(getLocalStorageTestnetFlag());
  const [isRpcRequestPending, setIsRpcRequestPending] = useState(false);
  const [rpcResult, setRpcResult] = useState<IFormattedRpcResponse | null>();

  const [modal, setModal] = useState("");

  const closeModal = () => setModal("");
  const openPairingModal = () => setModal("pairing");
  const openPingModal = () => setModal("ping");
  const openRequestModal = () => setModal("request");

  // Initialize the WalletConnect client.
  const {
    client,
    session,
    disconnect,
    chain,
    accounts,
    balances,
    chainData,
    isFetchingBalances,
    isInitializing,
    onEnable,
    web3Provider,
  } = useWalletConnectClient();

  // Close the pairing modal after a session is established.
  useEffect(() => {
    if (session && modal === "pairing") {
      closeModal();
    }
  }, [session, modal]);

  // TODO:
  // const onPing = async () => {
  //   openPingModal();
  //   await ping();
  // };

  const testSignMessage: () => Promise<IFormattedRpcResponse> = async () => {
    if (!web3Provider) {
      throw new Error("web3Provider not connected");
    }
    const msg = "hello world";
    const hexMsg = encoding.utf8ToHex(msg, true);
    const address = accounts[0];
    const signature = await web3Provider.send("personal_sign", [hexMsg, address]);
    const valid = utils.verifyMessage(msg, signature) === address;
    return {
      method: "personal_sign",
      address,
      valid,
      result: signature,
    };
  };

  const testSignTypedData: () => Promise<IFormattedRpcResponse> = async () => {
    if (!web3Provider) {
      throw new Error("web3Provider not connected");
    }
    const message = JSON.stringify(eip712.example);

    const address = accounts[0];

    // eth_signTypedData params
    const params = [address, message];

    // send message
    const signature = await web3Provider.send("eth_signTypedData", params);
    return {
      method: "eth_signTypedData",
      address,
      valid: true,
      result: signature,
    };
  };

  const getEthereumActions = (): AccountAction[] => {
    const wrapRpcRequest = (rpcRequest: () => Promise<IFormattedRpcResponse>) => async () => {
      openRequestModal();
      try {
        setIsRpcRequestPending(true);
        const result = await rpcRequest();
        setRpcResult(result);
      } catch (error) {
        console.error("RPC request failed:", error);
      } finally {
        setIsRpcRequestPending(false);
      }
    };

    return [
      // { method: "eth_sendTransaction", callback: onSendTransaction },
      { method: "personal_sign", callback: wrapRpcRequest(testSignMessage) },
      { method: "eth_signTypedData", callback: wrapRpcRequest(testSignTypedData) },
    ];
  };

  const getBlockchainActions = (chainId: string) => {
    const [namespace] = chainId.split(":");
    switch (namespace) {
      case "eip155":
        return getEthereumActions();
      case "cosmos":
        return [];
      default:
        break;
    }
  };

  // Toggle between displaying testnet or mainnet chains as selection options.
  const toggleTestnets = () => {
    const nextIsTestnetState = !isTestnet;
    setIsTestnet(nextIsTestnetState);
    setLocaleStorageTestnetFlag(nextIsTestnetState);
  };

  // Renders the appropriate model for the given request that is currently in-flight.
  const renderModal = () => {
    switch (modal) {
      case "pairing":
        if (typeof client === "undefined") {
          throw new Error("WalletConnect is not initialized");
        }
        // return <PairingModal pairings={client.pairing.values} connect={onEnable} />;
        return null;
      case "request":
        return <RequestModal pending={isRpcRequestPending} result={rpcResult} />;
      case "ping":
        return <PingModal pending={isRpcRequestPending} result={rpcResult} />;
      default:
        return null;
    }
  };

  const renderContent = () => {
    const chainOptions = isTestnet ? DEFAULT_TEST_CHAINS : DEFAULT_MAIN_CHAINS;
    return !accounts.length && !Object.keys(balances).length ? (
      <SLanding center>
        <Banner />
        <h6>
          <span>{`Using v${version || "2.0.0-beta"}`}</span>
        </h6>
        <SButtonContainer>
          <h6>Select an Ethereum chain:</h6>
          <SToggleContainer>
            <p>Testnets Only?</p>
            <Toggle active={isTestnet} onClick={toggleTestnets} />
          </SToggleContainer>
          {chainOptions.map(chainId => (
            <Blockchain key={chainId} chainId={chainId} chainData={chainData} onClick={onEnable} />
          ))}
          {/* <SConnectButton left onClick={onEnable} disabled={!chains.length}>
            {"Connect"}
          </SConnectButton> */}
        </SButtonContainer>
      </SLanding>
    ) : (
      <SAccountsContainer>
        <h3>Account</h3>
        <SAccounts>
          {accounts.map(account => {
            return (
              <Blockchain
                key={account}
                active={true}
                chainData={chainData}
                fetching={isFetchingBalances}
                address={account}
                chainId={chain}
                balances={balances}
                actions={getBlockchainActions(chain)}
              />
            );
          })}
        </SAccounts>
      </SAccountsContainer>
    );
  };

  return (
    <SLayout>
      <Column maxWidth={1000} spanHeight>
        <Header ping={() => Promise.resolve()} disconnect={disconnect} session={session} />
        <SContent>{isInitializing ? "Loading..." : renderContent()}</SContent>
      </Column>
      <Modal show={!!modal} closeModal={closeModal}>
        {renderModal()}
      </Modal>
    </SLayout>
  );
}
