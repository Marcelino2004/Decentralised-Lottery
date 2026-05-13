// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/interfaces/IVRFCoordinatorV2Plus.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";

error Lottery__NotEnoughEntranceFee();
error Transaction__Failed();
error Lottery__NotOpen();
error Lottery__upkeepNotNeeded(
    uint256 balance,
    uint256 num_players,
    uint256 lottery_state
);

contract Lottery is VRFConsumerBaseV2Plus, AutomationCompatibleInterface {
    enum LotteryState {
        OPEN,
        CALCULATING
    }

    uint256 private immutable i_entrance_fee;
    address payable[] private players;
    bytes32 private immutable i_keyhash;
    uint256 private immutable i_subscriptionId;
    uint16 public constant REQUEST_CONFIRMATIONS = 3;
    uint32 private immutable i_callbackGasLimit;
    uint32 public constant NUM_WORDS = 1;

    address private s_recentWinner;
    LotteryState private s_lotterystate;
    uint256 private s_lastTimeStamp;
    uint256 private immutable i_interval;

    event LotteryEnter(address indexed player);
    event RandomWinnerRequest(uint256 indexed requestId);
    event WinnersPicked(address indexed winner);

    constructor(
        address vrfCoordinatorV2,
        uint256 entrance_fee,
        bytes32 keyhash,
        uint256 subscriptionId,
        uint32 callbackGasLimit,
        uint256 interval
    ) VRFConsumerBaseV2Plus(vrfCoordinatorV2) {
        i_entrance_fee = entrance_fee;
        i_keyhash = keyhash;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        s_lotterystate = LotteryState.OPEN;
        s_lastTimeStamp = block.timestamp;
        i_interval = interval;
    }

    function enterLottery() public payable {
        if (s_lotterystate != LotteryState.OPEN) {
            revert Lottery__NotOpen();
        }
        if (msg.value < i_entrance_fee) {
            revert Lottery__NotEnoughEntranceFee();
        }
        players.push(payable(msg.sender));
        emit LotteryEnter(msg.sender);
    }

    function checkUpkeep(
        bytes memory /*checkData*/
    )
        public
        view
        override
        returns (bool upkeepNeeded, bytes memory /*performData*/)
    {
        bool isOpen = (s_lotterystate == LotteryState.OPEN);
        bool timeChecked = (uint256(block.timestamp - s_lastTimeStamp) >
            i_interval);
        bool hasPlayers = players.length > 0;
        bool hasBalance = address(this).balance > 0;
        upkeepNeeded = (isOpen && timeChecked && hasPlayers && hasBalance);
    }

    function performUpkeep(bytes memory /*performData*/) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        if (!upkeepNeeded) {
            revert Lottery__upkeepNotNeeded(
                address(this).balance,
                players.length,
                uint256(s_lotterystate)
            );
        }
        s_lotterystate = LotteryState.CALCULATING;
        uint256 requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: i_keyhash,
                subId: i_subscriptionId,
                requestConfirmations: REQUEST_CONFIRMATIONS,
                callbackGasLimit: i_callbackGasLimit,
                numWords: NUM_WORDS,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({nativePayment: false})
                )
            })
        );
        emit RandomWinnerRequest(requestId);
    }

    function fulfillRandomWords(
        uint256 /*requestId*/,
        uint256[] calldata randomWords
    ) internal override {
        uint256 indexOfWinner = randomWords[0] % players.length;
        address payable recentWinner = players[indexOfWinner];
        s_recentWinner = recentWinner;
        s_lotterystate = LotteryState.OPEN;
        players = new address payable[](0);
        s_lastTimeStamp = block.timestamp;
        (bool success, ) = recentWinner.call{value: address(this).balance}("");
        if (!success) {
            revert Transaction__Failed();
        }
        emit WinnersPicked(recentWinner);
    }

    function getEntranceFee() public view returns (uint256) {
        return i_entrance_fee;
    }

    function getPlayers(uint256 index) public view returns (address) {
        return players[index];
    }

    function getRecentWinner() public view returns (address) {
        return s_recentWinner;
    }

    function getLotteryState() public view returns (LotteryState) {
        return s_lotterystate;
    }

    function getNumOfPlayers() public view returns (uint256) {
        return players.length;
    }

    function getNumWords() public pure returns (uint256) {
        return NUM_WORDS;
    }

    function getBlockConfirmations() public pure returns (uint256) {
        return REQUEST_CONFIRMATIONS;
    }

    function getLastTimeStamp() public view returns (uint256) {
        return s_lastTimeStamp;
    }

    function getInterval() public view returns (uint256) {
        return i_interval;
    }

    function setLotteryStateForTest(LotteryState _state) external {
        s_lotterystate = _state;
    }

    function getCallbackGasLimit() public view returns (uint32) {
        return i_callbackGasLimit;
    }

    function getSubscriptionId() public view returns (uint256) {
        return i_subscriptionId;
    }
}
