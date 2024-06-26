import { useState } from 'react';
import './style.scss';
import { SendTransactionRequest, useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { Dictionary, beginCell } from "@ton/core";
import { Address, TonClient4 } from "@ton/ton";

const defaultTx: SendTransactionRequest = {
	validUntil: 0,
	messages: []
};

const tonClient = new TonClient4({ endpoint: "https://testnet-v4.tonhubapi.com" });

export function TxForm() {
	const [tx, setTx] = useState(defaultTx);
	const [Content, setContent] = useState('');
	const wallet = useTonWallet();
	const [tonConnectUi] = useTonConnectUI();

	const onSendTransaction = async () => {
		const hashmap = Dictionary.empty(Dictionary.Keys.BigUint(16), Dictionary.Values.Cell());
		const block = await tonClient.getLastBlock();
		const request = await fetch(
			`https://testnet.toncenter.com/api/v3/jetton/masters?address=${tx.tokenAddress}`
		);
		const jetton_data = await request.json();

		var decimals = jetton_data.jetton_masters?.[0]?.jetton_content?.decimals;
		const jetton_wallet_data = await tonClient.runMethod(
			block.last.seqno,
			Address.parse(tx.tokenAddress),
			'get_wallet_address',
			[
				{
					type: 'slice', cell: beginCell().storeAddress(Address.parse(tonConnectUi.account?.address)).endCell()
				}
			]);
		const jetton_wallet_address = jetton_wallet_data.result[0].cell.beginParse().loadAddress();
		var counter = Number(0);
		var total_jetton_amount = Number(0);
		Content.split('\n').map((line) => {
			const [address, amount] = line.split(' ');
			hashmap.set(BigInt(counter),
				beginCell().storeAddress(Address.parse(address)).storeCoins(Number(amount) * 10 ** decimals).endCell()
			);
			counter += Number(1);
			total_jetton_amount += Number(amount) * 10 ** decimals;
			return { address, amount };
		});

		const jetton_transfer_body =
			beginCell()
				.storeUint(0xf8a7ea5, 32)
				.storeUint(0, 64)
				.storeCoins(total_jetton_amount)
				.storeAddress(Address.parse('EQB-njcWloLO1V1lt0wIB2hPSQMi627k0uyAdFMtau90bHMp'))
				.storeAddress(Address.parse(tonConnectUi.account?.address))
				.storeBit(0)
				.storeCoins(((counter * 0.05) + 0.5) * 1e9)
				.storeBit(1)
				.storeRef(
					beginCell()
						.storeDict(hashmap)
						.storeRef(
							beginCell()
								.storeStringTail('test')
								.endCell()
						)
						.endCell()
				)
				.endCell();
		tx.messages.push(
			{
				'address': jetton_wallet_address.toRawString(),
				'amount': String(((counter * 0.05) + 1) * 1e9),
				'payload': jetton_transfer_body.toBoc()
			}
		)

		tx.validUntil = Math.floor(Date.now() / 1000) + 600;
		tonConnectUi.sendTransaction(tx);
		tx.messages = [];
	};

	const inputStyle = {
		margin: '10px 0',
		padding: '8px',
		width: '100%',
		backgroundColor: 'rgba(16, 22, 31, 0.92)',
		color: '#fff',
		border: '1px solid #444',
	};

	const containerStyle = {
		backgroundColor: 'rgba(16, 22, 31, 0.92)',
		padding: '20px',
		borderRadius: '8px',
		color: '#fff',
	};

	const csvAreaStyle = {
		width: '100%',
		height: '200px',
		backgroundColor: 'rgba(16, 22, 31, 0.92)',
		color: '#fff',
		border: '1px solid #444',
		padding: '10px',
		whiteSpace: 'pre-wrap',
		overflowY: 'auto',
	};

	return (
		<div className="send-tx-form" style={containerStyle}>
			<h3>Enter token address to send</h3>
			<input
				type="text"
				placeholder="Enter token address"
				value={tx.tokenAddress}
				onChange={(e) => setTx({ ...tx, tokenAddress: e.target.value })}
				style={inputStyle}
			/>
			<h3>Address list</h3>
			<textarea
				placeholder="Enter addresses and amounts in the format:
address1 amount1
address2 amount2"
				value={Content}
				onChange={(e) => setContent(e.target.value)}
				style={csvAreaStyle}
			/>
			{wallet ? (
				<button onClick={onSendTransaction} style={{ ...inputStyle, width: 'auto', padding: '8px 16px' }}>
					Send transaction
				</button>
			) : (
				<button onClick={() => tonConnectUi.openModal()} style={{ ...inputStyle, width: 'auto', padding: '8px 16px' }}>
					Connect wallet to send the transaction
				</button>
			)}
		</div>
	);
}