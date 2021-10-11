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
        address         OWNER_ADDRESS      = address(0xA8c578022409c7f44264A0742444f1399DAcD46b);
        address payable ETH_WALLET_ADDRESS = payable(0x67B8CAF85C727A27935570Caf0e62f265c0d95ff);

        address[] memory accounts = new address[](10);
        address[] memory walletOwners = new address[](6);
        VestingSchedule[] memory schedules = new VestingSchedule[](6);
        uint256[] memory supplies = new uint256[](10);

        // casual eth accounts
        accounts[0] = 0x0113518FBcE33BA055d3753DaF0903f64a49554E; // Liquidity
        accounts[1] = 0x7bd37252Fd94D98Dd9aF3e1aB45a58aC31B8a45F; // Farming
        accounts[2] = 0xEb39C884d2C7B54520D0F9a24E0ffcf1aE6B58D0; // Airdrop

        // owners of vesting wallets
        walletOwners[0] = 0x9241750A09CdB56D33582e2Ea92Ed448806B8f53; // Company reserve
        walletOwners[1] = 0xf1edD24D2c517A17Ab1D32EE8d46C327c1389539; // Launch team
        walletOwners[2] = 0x594c80E7dF5775b142587Cf3A609a010248EaBEc; // Development team
        walletOwners[3] = 0xD00e8C8151Fadc16392796c50327E73d20Bb0dc1; // Marketing
        walletOwners[4] = 0x68E543680f1b91236c30d009FFE699f7f8DE1a49; // Advisors
        walletOwners[5] = 0x76E945bc22fd03C7268a33aD39beC7042Dfe5288; // Seed round

        uint32 VESTING_START = 1635984000;

        // vesting schedules
        schedules[0] = VestingSchedule(VESTING_START,  180 days, 180 days); // Company reserve:    lock for 6 months
        schedules[1] = VestingSchedule(VESTING_START,  300 days,  30 days); // Launch team:        unlock 10% monthly after 3 months
        schedules[2] = VestingSchedule(VESTING_START, 1200 days,  30 days); // Development team:   unlock 2,5% monthly after 6 months
        schedules[3] = VestingSchedule(VESTING_START,  180 days, 180 days); // Marketing:          lock for 6 months
        schedules[4] = VestingSchedule(VESTING_START,  300 days,  30 days); // Advisors:           unlock 10% monthly after 6 months
        schedules[5] = VestingSchedule(VESTING_START,  150 days,  30 days); // Seed round:         unlock 20% monthly after 6 months

        // supplies
        supplies[0] =  3_000_000 ether; // Liquidity
        supplies[1] =    600_000 ether; // Farming
        supplies[2] =    250_000 ether; // Airdrop
        supplies[3] =  2_400_000 ether; // Company Reserve
        supplies[4] =  2_250_000 ether; // Launch team
        supplies[5] =  2_250_000 ether; // Development team
        supplies[6] =  4_500_000 ether; // Marketing
        supplies[7] =  1_000_000 ether; // Advisors
        supplies[8] =  3_750_000 ether; // Seed round
        supplies[9] = 10_000_000 ether; // Funds (3.5M) + Public partners (500K) + Public sale (6M)

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
        sale.setPrice(3395 ether);
        sale.setVestingSchedule(1, 0, 300 days, 30 days);
        // funds round
        sale.addStage(1634256000, 1635120000, 200, 24540000000000000000, 0, 0, 3_500_000 ether, 1);
        // public partners round
        sale.addStage(1635120000, 1635206400,  50, 24540000000000000000, 0, 0,   500_000 ether, 0);
        // public sale round
        sale.addStage(1635897600, 1635984000,   0, 24540000000000000000, 0, 0, 6_000_000 ether, 0);

        accounts[9] = address(sale);

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
            wallets[i].transferOwnership(walletOwners[i]);
        }
    }

}

