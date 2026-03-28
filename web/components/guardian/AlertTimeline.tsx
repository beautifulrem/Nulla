"use client";

import { TimelineEntry } from "../../hooks/guardianTypes";
import { card, cardInner, mono, subtitle, title } from "./ui";

export function AlertTimeline({ entries }: { entries: TimelineEntry[] }) {
  return (
    <section style={card}>
      <div style={cardInner}>
        <h2 style={title}>Cross-chain Timeline</h2>
        <p style={subtitle}>Same alert, three chains, five ordered milestones.</p>
        <div style={{ marginTop: 16, display: "grid", gap: 16 }}>
          {entries.length === 0 ? (
            <div style={{ fontSize: 13, color: "rgba(229,238,252,0.65)" }}>No alerts yet.</div>
          ) : (
            entries.map((entry) => (
              <article key={entry.alertId} style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{entry.title}</div>
                  <div style={{ fontSize: 12, color: "rgba(229,238,252,0.6)" }}>{entry.originChainName}</div>
                </div>
                <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                  {entry.events.map((event) => (
                    <div
                      key={`${entry.alertId}-${event.kind}-${event.chainName}`}
                      style={{
                        padding: 12,
                        borderRadius: 16,
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.04)",
                      }}
                    >
                      <div style={{ fontSize: 12, color: "rgba(229,238,252,0.6)" }}>
                        {event.kind} on {event.chainName}
                      </div>
                      <div style={{ marginTop: 4, fontSize: 13 }}>{event.label}</div>
                      {event.hash ? <div style={{ marginTop: 6, fontSize: 11, ...mono }}>{event.hash}</div> : null}
                    </div>
                  ))}
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
