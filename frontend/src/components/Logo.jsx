export default function Logo({ color = "#ece7f2" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M10 1L18 19H14.5L10 8.5L5.5 19H2L10 1Z" fill={color} />
        <path d="M6.5 14H13.5" stroke={color} strokeWidth="1.6" />
      </svg>
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <span style={{ fontFamily: "var(--font-brand)", fontSize: 22, fontWeight: 600, color, letterSpacing: 3 }}>
          AURELLE
        </span>
        <span style={{ fontFamily: "var(--font-body)", fontSize: 7.5, fontWeight: 600, color, letterSpacing: 4.2, opacity: 0.7 }}>
          BOUTIQUE
        </span>
      </div>
    </div>
  );
}
