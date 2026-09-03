import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "DIBS — my closet, temporarily available to the public";

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px",
          background: "#f4eee4",
          backgroundImage:
            "linear-gradient(#e4daca 1px, transparent 1px), linear-gradient(90deg, #e4daca 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      >
        <div
          style={{
            fontSize: 300,
            fontWeight: 900,
            letterSpacing: "-0.05em",
            color: "#ff2d8b",
            WebkitTextStroke: "6px #14110f",
            lineHeight: 1,
          }}
        >
          DIBS.
        </div>
        <div style={{ fontSize: 46, fontStyle: "italic", color: "#14110f", marginTop: 24 }}>
          my closet, temporarily available to the public.
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 36 }}>
          {[
            ["GIFT IT", "#c9a7ff"],
            ["SELL IT", "#1b3fd8"],
            ["CALL DIBS", "#ff2d8b"],
          ].map(([t, c]) => (
            <div
              key={t}
              style={{
                background: c as string,
                color: c === "#c9a7ff" ? "#14110f" : "#fff",
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: "0.12em",
                padding: "12px 20px",
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
