"use client";

import { useState } from "react";

type RoundtripState = {
  loading: boolean;
  statusCode?: number;
  result?: unknown;
  error?: string;
};

export function RoundtripCheckButton() {
  const [state, setState] = useState<RoundtripState>({ loading: false });

  async function runRoundtrip() {
    setState({ loading: true });

    try {
      const response = await fetch("/api/persistence/roundtrip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });
      const result = await response.json().catch(() => ({
        status: "error",
        errorCode: "UPSTREAM_BAD_RESPONSE",
        message: "Roundtrip response was not valid JSON."
      }));

      setState({
        loading: false,
        statusCode: response.status,
        result
      });
    } catch (error) {
      setState({
        loading: false,
        error: error instanceof Error ? error.message : "Unknown roundtrip error"
      });
    }
  }

  return (
    <div className="roundtrip-panel">
      <button className="button" type="button" onClick={runRoundtrip} disabled={state.loading}>
        {state.loading ? "確認中" : "roundtripを実行"}
      </button>
      <p className="muted">
        owner sessionでCustomerとReservationを作成し、同じworkspace内でfind/listできるか確認します。
      </p>
      {state.statusCode ? (
        <p className="muted">HTTP status: {state.statusCode}</p>
      ) : null}
      {state.error ? <p className="muted">error: {state.error}</p> : null}
      {state.result ? (
        <pre className="code-block">{JSON.stringify(state.result, null, 2)}</pre>
      ) : null}
    </div>
  );
}
