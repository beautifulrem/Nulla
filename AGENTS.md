# Repository Guidelines

## Project Structure & Module Organization
This repository is a minimal Foundry project for Ethereum smart contracts. Core contracts live in `src/`, deployment and broadcast scripts live in `script/`, and tests live in `test/`. Third-party dependencies are vendored in `lib/`, currently including `forge-std`. Foundry outputs build artifacts to `out/`, as configured in `foundry.toml`; treat generated output as disposable unless a task explicitly requires it.

## Build, Test, and Development Commands
Run all local commands through `rtk`, per workspace instructions.

- `rtk forge build`: compile contracts.
- `rtk forge build --sizes`: compile and report contract size, matching CI.
- `rtk forge test -vvv`: run the full test suite with verbose traces.
- `rtk forge fmt`: format Solidity files.
- `rtk forge fmt --check`: verify formatting without rewriting files.
- `rtk forge snapshot`: record gas snapshots when gas changes matter.
- `rtk anvil`: start a local EVM node for manual testing.
- `rtk forge script script/Counter.s.sol:CounterScript --rpc-url <RPC_URL> --private-key <KEY>`: run a deployment script.

## Coding Style & Naming Conventions
Use Solidity `^0.8.13`, matching the current codebase. Follow `forge fmt` output for spacing and line wrapping; the existing code uses 4-space indentation. Name contracts in `PascalCase` (`Counter`), state variables and functions in `camelCase` (`setNumber`, `increment`), and test files with the `.t.sol` suffix. Keep one primary contract per file where practical, and place deployment scripts in files ending with `.s.sol`.

## Testing Guidelines
Tests use Foundry’s `forge-std/Test.sol`. Add unit tests in `test/` alongside the feature they validate, and prefer descriptive names such as `test_Increment()` and `testFuzz_SetNumber(uint256 x)`. Cover happy paths, reverts, and relevant fuzz cases for state-changing logic. Before opening a PR, run `rtk forge fmt --check`, `rtk forge build --sizes`, and `rtk forge test -vvv`.

## Commit & Pull Request Guidelines
This repository currently has no commit history, so no established convention can be inferred yet. Use short, imperative commit subjects, ideally scoped by area, for example: `feat: add ownership checks` or `test: cover counter underflow guard`. PRs should include a concise summary, testing notes, linked issues when applicable, and command output or screenshots only when they help explain behavior changes.

## Security & Configuration Tips
Do not commit private keys, RPC URLs, or `.env` secrets. Pass credentials through environment variables or CLI flags during local runs. Treat `lib/` as external code: avoid editing vendored dependencies unless the task explicitly requires a dependency update.
