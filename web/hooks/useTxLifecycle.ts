import { useState } from "react";

type TxLifecycleStatus = "idle" | "pending" | "confirmed" | "failed";

export function useTxLifecycle(txHash?: string | null) {
  const [status, setStatus] = useState<TxLifecycleStatus>(txHash ? "pending" : "idle");
  const [message, setMessage] = useState<string | null>(txHash ? "Tracking transaction" : null);

  function start(nextHash: string) {
    setStatus("pending");
    setMessage(`Tracking ${nextHash}`);
  }

  function confirm(nextMessage = "Transaction confirmed") {
    setStatus("confirmed");
    setMessage(nextMessage);
  }

  function fail(nextMessage = "Transaction failed") {
    setStatus("failed");
    setMessage(nextMessage);
  }

  return {
    txHash: txHash ?? null,
    status,
    message,
    start,
    confirm,
    fail,
  };
}
