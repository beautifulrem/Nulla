# Repository Guidelines

## Project Structure & Module Organization
This repository is a minimal Foundry project. Write production contracts in `src/`, deployment and maintenance scripts in `script/`, and tests in `test/`. Keep third-party dependencies in `lib/`; `lib/forge-std/` is vendored and should only be updated intentionally. Build artifacts are generated in `out/` and should stay untracked.

Use Foundry’s file suffixes consistently:
- `src/Counter.sol` for contracts
- `script/Counter.s.sol` for scripts
- `test/Counter.t.sol` for tests

## Build, Test, and Development Commands
Run commands from the repo root, `Nulla/`.

- `rtk forge fmt` formats Solidity sources.
- `rtk forge fmt --check` matches the CI formatting check.
- `rtk forge build --sizes` compiles contracts and reports bytecode size.
- `rtk forge test -vvv` runs the test suite with verbose traces.
- `rtk anvil` starts a local EVM node for manual testing.
- `rtk forge script script/Counter.s.sol:CounterScript --rpc-url $RPC_URL --private-key $PRIVATE_KEY` runs the deployment script.

In this workspace, shell commands are expected to be prefixed with `rtk`.

## Coding Style & Naming Conventions
Use Solidity `^0.8.13` unless the project intentionally upgrades `foundry.toml`. Follow `forge fmt` output: 4-space indentation, one contract per file, and explicit imports such as `import {Counter} from "../src/Counter.sol";`.

Name contracts and libraries in `PascalCase`, state variables and functions in `camelCase`, test contracts as `<Contract>NameTest`, and test functions with Foundry patterns like `test_Increment` or `testFuzz_SetNumber`.

## Testing Guidelines
Every contract change should include or update tests in `test/`. Prefer unit tests for direct behavior and fuzz tests for public setters, math, and boundary conditions. CI runs `forge fmt --check`, `forge build --sizes`, and `forge test -vvv`; keep local results aligned before opening a PR.

## Commit & Pull Request Guidelines
The repository does not have established commit history yet, so use short imperative commit subjects such as `Add decrement test for Counter`. Keep commits focused and avoid mixing contract, script, and dependency churn without reason.

PRs should explain the behavior change, list the commands run, and call out any deployment assumptions, RPC requirements, or broadcast-affecting script changes. Link issues when available.
