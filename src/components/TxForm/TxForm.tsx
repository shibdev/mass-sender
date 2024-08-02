import { useState } from "react";
import "./style.scss";
import {
  SendTransactionRequest,
  useTonConnectUI,
  useTonWallet,
} from "@tonconnect/ui-react";
import { Cell, Dictionary, beginCell } from "@ton/core";
import { Address, TonClient4 } from "@ton/ton";
import Button from "../Button";

const defaultTx: SendTransactionRequest = {
  validUntil: 0,
  messages: [],
};

const tonClient = new TonClient4({
  endpoint: "https://mainnet-v4.tonhubapi.com",
});

export function TxForm() {
  const [tx, setTx] = useState(defaultTx);
  const [content, setContent] = useState("");
  const wallet = useTonWallet();
  const [tonConnectUi] = useTonConnectUI();

  const onSendTransaction = async () => {
    const hashmap = Dictionary.empty(
      Dictionary.Keys.BigUint(16),
      Dictionary.Values.Cell()
    );
    const block = await tonClient.getLastBlock();
    const request = await fetch(
      `https://toncenter.com/api/v3/jetton/masters?address=${tx.tokenAddress}`
    );
    const jetton_data = await request.json();

    var decimals = jetton_data.jetton_masters?.[0]?.jetton_content?.decimals;
    const jetton_wallet_data = await tonClient.runMethod(
      block.last.seqno,
      Address.parse(tx.tokenAddress),
      "get_wallet_address",
      [
        {
          type: "slice",
          cell: beginCell()
            .storeAddress(Address.parse(tonConnectUi.account?.address ?? ""))
            .endCell(),
        },
      ]
    );
    const jetton_wallet_address = (
      jetton_wallet_data.result[0] as { cell: Cell }
    ).cell
      .beginParse()
      .loadAddress();
    var counter = Number(0);
    var total_jetton_amount = Number(0);
    content.split("\n").forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine) {
        const [address, amount] = trimmedLine.split(",");
        if (address && amount) {
          hashmap.set(
            BigInt(counter),
            beginCell()
              .storeAddress(Address.parse(address))
              .storeCoins(Number(amount) * 10 ** decimals)
              .endCell()
          );
          counter += Number(1);
          total_jetton_amount += Number(amount) * 10 ** decimals;
        }
      }
    });

    const jetton_transfer_body = beginCell()
      .storeUint(0xf8a7ea5, 32)
      .storeUint(0, 64)
      .storeCoins(total_jetton_amount)
      .storeAddress(
        Address.parse("EQA_U8vtwX88cxJiCJRP7xIjveYX_bmJYLKLJkFABg2hDVvX")
      )
      .storeAddress(Address.parse(tonConnectUi.account?.address ?? ""))
      .storeBit(0)
      .storeCoins((counter * 0.05 + 0.5) * 1e9)
      .storeBit(1)
      .storeRef(
        beginCell()
          .storeDict(hashmap)
          .endCell()
      )
      .endCell();
    tx.messages.push({
      address: jetton_wallet_address.toRawString(),
      amount: String((counter * 0.05 + 1) * 1e9),
      payload: jetton_transfer_body.toBoc(),
    });

    tx.validUntil = Math.floor(Date.now() / 1000) + 600;
    tonConnectUi.sendTransaction(tx);
    tx.messages = [];
  };

  const preventSpaces = (event: React.KeyboardEvent) => {
    if (event.key === " ") {
      console.log(event);
      event.preventDefault();
    }
  };

  const handlePaste = (event: React.ClipboardEvent) => {
    const paste = (event.clipboardData || window.Clipboard).getData("text");
    if (paste.includes(" ")) {
      console.log(event);
      event.preventDefault();
    }
  };

  return (
    <div className="send-tx-form">
      <div className="send-tx-form_card">
        <div className="send-tx-form__label">Enter token address to send</div>
        <div className="send-tx-form__input-gradient">
          <input
            className="send-tx-form__input"
            type="text"
            placeholder="Enter token address"
            value={tx.tokenAddress}
            onChange={(e) => setTx({ ...tx, tokenAddress: e.target.value })}
            onKeyDown={preventSpaces}
            onPaste={handlePaste}
          />
        </div>
      </div>
      <div className="send-tx-form_card">
        <div className="send-tx-form__label">Address list</div>
        <div className="send-tx-form__input-gradient">
          <textarea
            className="send-tx-form__textarea"
            placeholder="Enter addresses and amounts in the format:
address1,amount1
address2,amount2"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={preventSpaces}
            onPaste={handlePaste}
          />
        </div>
      </div>
      {wallet ? (
        <>
          <Button gradient onClick={onSendTransaction}>
            Send transaction
          </Button>
          <Button
            className="send-tx-form_button__disconnect"
            onClick={() => tonConnectUi.disconnect()}
          >
            Disconnect wallet
          </Button>
        </>
      ) : (
        <Button gradient onClick={() => tonConnectUi.openModal()}>
          Connect wallet to send the transaction
        </Button>
      )}
    </div>
  );
}
