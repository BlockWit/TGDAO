# BSC Testnet log
## Addresses
* Configurator deployed at address: https://testnet.bscscan.com/address/0x48500Ad7BF36E43977C5e6B4aAcD189398580FEF
* Sale address https://testnet.bscscan.com/address/0x51101DEa66dCB85D70dAE8923FF2CBfAEe6de8BC
* Token address: https://testnet.bscscan.com/address/0x2ad7F077AE21bdD7412778193f64C22b81Bc50f0

## Test actions
* CommonSale. Attempting to send Ether to the CommonSale contract before the sale starts. Should revert.
    Result: Revert with reason 'StagedCrowdsale: No suitable stage found'. https://testnet.bscscan.com/tx/0xb6b92a04cabdfcc67f86901de9363a3fd0a1ad43fc6590f651159d80a351f7c5
* CommonSale. Change the beginning time of the first stage.
  Result: successful tx: https://testnet.bscscan.com/tx/0x43f210da2b929729ca4962bbfc141bd3741f05e95eb4111ac636994c889f34bd
* CommonSale. Attempting to send less than the allowed amount of BNB. Should revert.
  Result: Revert with reason 'CommonSale: The amount of ETH you sent is too small'. https://testnet.bscscan.com/tx/0x34dd17fd5b8d99a432a57100c835fb938bf82ea8f7ef85c0b0828fde0167011d
* CommonSale. Send 0.23786 BNB from buyer's account.
  Result: successful tx: https://testnet.bscscan.com/tx/0x9cd6d811d432e93c9fb6829633fa970c59385c73f0194e5a9ebb10f316298a04
* CommonSale. Change vesting schedule.
  Result: successful tx: https://testnet.bscscan.com/tx/0xe489af86072acbb94a77ea4ce669728a3e8e3c26745262bbc462b770cc0eeb22
* CommonSale. Withdraw from buyer's account.
  Result: successful tx: https://testnet.bscscan.com/tx/0xa150fcb347cc069dad3b18260b2e5451b32b7fe87c71ef39568c77751877ba95
* VestingWallet. Set new start time.
  Result: successful tx: https://testnet.bscscan.com/tx/0x5a5467b4c513ff94b0b79f7d68ceda5a467f208c59177b5d0a9c821fb860c07b
* VestingWallet. Set new duration.
  Result: successful tx: https://testnet.bscscan.com/tx/0x8aa7b442134ea87fd5ddb9cccfd3abf35b9278e32afb5c3019e368a8840cb400
* VestingWallet. Set new interval.
  Result: successful tx: https://testnet.bscscan.com/tx/0xc8c9a2ba713cc38c001fcd372133af1d98bc062845f14bb05c440ac118c752c2
* VestingWallet. Set new beneficiary.
  Result: successful tx: https://testnet.bscscan.com/tx/0x3ec0f61c2dff169848111d0d4855f25f554bfe08774f2858ad037bc2ecc0a1d8
* VestingWallet. Lock.
  Result: successful tx: https://testnet.bscscan.com/tx/0x03fc000959a7fd7975c30cd2bfcafab2b405f940d9850b1885689736913e69ad
* VestingWallet. Withdraw.
  Result: successful tx: https://testnet.bscscan.com/tx/0x1f81b336fd05a2faca353133442d6c9e916124c422dd011944450882ec479175
* Token. Transfer from buyer's account.
  Result: successful tx: https://testnet.bscscan.com/tx/0x59ca7363815f6e8bad980130203c22dabc2623eec5253b9841bc121d4ba4ce90
