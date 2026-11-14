// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import {Pingus2} from "../Pingus2.sol";

/**
 * @title Pingus2Harness — TEST ONLY. NEVER DEPLOYED.
 * @notice Identical to `Pingus2` except that the two supply caps are supplied
 *         at construction, so that the test matrix rows "mint beyond GENESIS"
 *         and "mint beyond HARD_CAP via breeding" can be *executed* instead of
 *         asserted by inspection. Reaching 2,369 / 5,922 tokens in a unit test
 *         is not feasible (the hard cap is only reachable through hundreds of
 *         chained breeds), so the caps are shrunk and the exact same code path
 *         is exercised.
 *
 * @dev This file adds NO new mint path, NO setter, and NO privileged function.
 *      It only narrows two numbers. The production artifact is `Pingus2`.
 */
contract Pingus2Harness is Pingus2 {
    uint256 private immutable _genesisCap;
    uint256 private immutable _hardCap;

    constructor(
        uint256 genesisCap_,
        uint256 hardCap_,
        address owner_,
        address treasury_,
        address attestor_,
        uint256 mintPrice_,
        uint96 royaltyBps_,
        bytes32 traitsRoot_,
        string memory traitsUri_,
        uint64[6] memory schedule_,
        string[4] memory baseCID_
    )
        Pingus2(
            owner_,
            treasury_,
            attestor_,
            mintPrice_,
            royaltyBps_,
            traitsRoot_,
            traitsUri_,
            schedule_,
            baseCID_
        )
    {
        _genesisCap = genesisCap_;
        _hardCap = hardCap_;
    }

    function GENESIS() public view override returns (uint256) {
        return _genesisCap;
    }

    function HARD_CAP() public view override returns (uint256) {
        return _hardCap;
    }
}
