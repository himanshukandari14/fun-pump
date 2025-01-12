// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.27;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract Token is ERC20, ERC20Permit {

    address payable public owner; //owner aka deployer of contract
    address public creator; //person who will create coins

    constructor(
        address _creator,
        string memory _name,
        string memory _symbol,
        uint256 _totalSupply
    ) ERC20(_name, _symbol) ERC20Permit("MyToken") {
        owner = payable(msg.sender);
        creator = _creator;

        _mint(msg.sender, _totalSupply); //creating coins
    }
}