export default function ConfidenceGauge({ score = 0, isReal = true }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  // Green if confidence > 60, else red
  const color = score > 60 ? "#22c55e" : "#ef4444";
  const glowColor = score > 60 ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)";

  return (
    <div
      style={{
        position: "relative",
        width: 180,
        height: 180,
        margin: "0 auto",
      }}
    >
      <svg width="180" height="180" viewBox="0 0 180 180">
        {/* Background Ring */}
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="10"
        />
        {/* Glow ring */}
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="gauge-ring"
          style={{
            transform: "rotate(-90deg)",
            transformOrigin: "50% 50%",
            filter: `drop-shadow(0 0 8px ${glowColor})`,
          }}
        />
        {/* Inner subtle ring */}
        <circle
          cx="90"
          cy="90"
          r="55"
          fill="none"
          stroke="rgba(255,255,255,0.03)"
          strokeWidth="1"
        />
      </svg>
      {/* Center text */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: "2.2rem",
            fontWeight: 800,
            color: color,
            textShadow: `0 0 15px ${glowColor}`,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {score.toFixed(1)}%
        </span>
        <span
          style={{
            fontSize: "0.7rem",
            color: "#94a3b8",
            letterSpacing: 2,
            textTransform: "uppercase",
            marginTop: 2,
          }}
        >
          Confidence
        </span>
      </div>
    </div>
  );
}
