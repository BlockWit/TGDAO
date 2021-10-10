// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;


import "./CommonSale.sol";
import "./RecoverableFunds.sol";
import "./TGDAOToken.sol";
import "./VestingWallet.sol";

contract Configurator is RecoverableFunds {
    using Address for address;

    TGDAOToken public token;
    CommonSale public sale;
    VestingWallet[] public wallets;

    struct VestingSchedule {
        uint32 start;
        uint32 duration;
        uint32 interval;
    }

    constructor() {
        address         OWNER_ADDRESS      = address(0x0b2cBc8a2D434dc16818B0664Dd81e89fAA9c3AC);
        address payable ETH_WALLET_ADDRESS = payable(0xf83c2172950d2Cc6490F164bb08F2381C2CdEc82);

        address[] memory accounts = new address[](11);
        address[] memory walletOwners = new address[](6);
        VestingSchedule[] memory schedules = new VestingSchedule[](6);
        uint256[] memory supplies = new uint256[](11);

        // casual eth accounts
        accounts[0] = 0xe6Df6C96794063F2cC1Dc338908B2a04Ff29eBd4; // Liquidity
        accounts[1] = 0x3aCe47351C48a4971b62176Ef3538C51397a0d5E; // Farming
        accounts[2] = 0x3aCe47351C48a4971b62176Ef3538C51397a0d5E; // Airdrop

        // owners of vesting wallets
        walletOwners[0] = 0xe74b3Ba0e474eA8EE89da99Ef38889ED229e8782; // Company reserve
        walletOwners[1] = 0xe74b3Ba0e474eA8EE89da99Ef38889ED229e8782; // Launch team
        walletOwners[2] = 0x539e3b4Cf63685cB2aE9adA4414335EB0B496Aec; // Development team
        walletOwners[3] = 0x3aCe47351C48a4971b62176Ef3538C51397a0d5E; // Marketing
        walletOwners[4] = 0x3aCe47351C48a4971b62176Ef3538C51397a0d5E; // Advisors
        walletOwners[5] = 0x3aCe47351C48a4971b62176Ef3538C51397a0d5E; // Seed round
        walletOwners[6] = 0x3aCe47351C48a4971b62176Ef3538C51397a0d5E; // Funds round

        // vesting schedules
        schedules[0] = VestingSchedule(0, 0, 0); // Company reserve:    lock for 6 months
        schedules[1] = VestingSchedule(0, 0, 0); // Launch team:        unlock 10% monthly after 3 months
        schedules[2] = VestingSchedule(0, 0, 0); // Development team:   unlock 2,5% monthly after 6 months
        schedules[3] = VestingSchedule(0, 0, 0); // Marketing:          lock for 6 months
        schedules[4] = VestingSchedule(0, 0, 0); // Advisors:           unlock 10% monthly after 6 months
        schedules[5] = VestingSchedule(0, 0, 0); // Seed round:         unlock 20% monthly after 6 months
        schedules[6] = VestingSchedule(0, 0, 0); // Funds round:        unlock 10% monthly after 3 months

        // supplies
        supplies[0]  = 3_000_000 ether; // Liquidity
        supplies[1]  =   600_000 ether; // Farming
        supplies[2]  =   250_000 ether; // Airdrop
        supplies[3]  = 2_400_000 ether; // Company Reserve
        supplies[4]  = 2_250_000 ether; // Launch team
        supplies[5]  = 2_250_000 ether; // Development team
        supplies[6]  = 4_500_000 ether; // Marketing
        supplies[7]  = 1_000_000 ether; // Advisors
        supplies[8]  = 3_750_000 ether; // Seed round
        supplies[9]  = 3_500_000 ether; // Funds round
        supplies[10] = 6_500_000 ether; // Public partners (500K) + Public sale (6M)

        // create vesting wallets
        for (uint256 i = 0; i < walletOwners.length; i++) {
            VestingSchedule memory schedule = schedules[i];
            VestingWallet wallet = new VestingWallet(schedule.start, schedule.duration, schedule.interval);
            wallets.push(wallet);
            accounts[i + 3] = address(wallet);
        }

        // create sale
        sale = new CommonSale();
        sale.setWallet(ETH_WALLET_ADDRESS);
        sale.setPrice(21674 ether);
        // funds round
        sale.addStage(1631635200, 1632240000, 50,  30000000000000000, 0, 0, 28305000000000000000000000, 1);
        // public partners round
        sale.addStage(1632240000, 1632844800, 20,  30000000000000000, 0, 0, 28305000000000000000000000, 0);
        // public sale round
        sale.addStage(1632844800, 4788518400, 0,   30000000000000000, 0, 0, 28390000000000000000000000, 0);

        accounts[10] = address(sale);

        // create token
        require(accounts.length == supplies.length, "Configurator: wrong account array length");
        token = new TGDAOToken(accounts, supplies);
        token.transferOwnership(OWNER_ADDRESS);

        // finish sale configuration
        sale.setToken(address(token));
        sale.transferOwnership(OWNER_ADDRESS);

        // finish wallet configuration
        for (uint256 i = 0; i < wallets.length; i++) {
            wallets[i].setToken(address(token));
            wallets[i].init();
        }
    }

}

