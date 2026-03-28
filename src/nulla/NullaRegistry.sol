// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";
import {GuardianProfile, ProfileStatus} from "./NullaTypes.sol";

contract NullaRegistry is Ownable {
    error InvalidProfile();
    error UnknownProfile();

    event ProfileRegistered(bytes32 indexed profileId, address indexed safeAddress, address indexed owner);
    event ProfileStatusUpdated(bytes32 indexed profileId, ProfileStatus status);

    mapping(bytes32 => GuardianProfile) private profiles;
    mapping(address => bytes32) private profileIdsBySafe;

    constructor(address initialOwner) Ownable(initialOwner) {}

    function registerProfile(bytes32 profileId, GuardianProfile calldata profile) external onlyOwner {
        if (profileId == bytes32(0) || profile.safeAddress == address(0) || profile.owner == address(0)) {
            revert InvalidProfile();
        }

        profiles[profileId] = profile;
        profileIdsBySafe[profile.safeAddress] = profileId;

        emit ProfileRegistered(profileId, profile.safeAddress, profile.owner);
    }

    function updateProfileStatus(bytes32 profileId, ProfileStatus status) external onlyOwner {
        GuardianProfile storage profile = profiles[profileId];
        if (profile.safeAddress == address(0)) {
            revert UnknownProfile();
        }

        profile.status = status;
        emit ProfileStatusUpdated(profileId, status);
    }

    function getProfile(bytes32 profileId) external view returns (GuardianProfile memory) {
        return profiles[profileId];
    }

    function getProfileBySafe(address safeAddress) external view returns (GuardianProfile memory) {
        return profiles[profileIdsBySafe[safeAddress]];
    }

    function getProfileIdBySafe(address safeAddress) external view returns (bytes32) {
        return profileIdsBySafe[safeAddress];
    }

    function isProfileActive(bytes32 profileId) external view returns (bool) {
        return profiles[profileId].status == ProfileStatus.Active;
    }
}
