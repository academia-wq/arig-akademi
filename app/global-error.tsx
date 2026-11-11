"use client";

// Root layout өөрөө унавал (error.tsx ажиллахгүй үед) харуулна — өөрийн <html>-тэй, Tailwind-гүй.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="mn">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#FFFBF6", color: "#485353" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ maxWidth: 420, background: "#fff", borderRadius: 16, padding: 40 }}>
            <h1 style={{ margin: 0, fontSize: 26 }}>Алдаа гарлаа</h1>
            <p style={{ marginTop: 16, opacity: 0.7 }}>Уучлаарай, сайтыг ачаалах үед алдаа гарлаа. Дахин оролдоно уу.</p>
            <button
              type="button"
              onClick={reset}
              style={{ marginTop: 24, height: 48, width: "100%", border: 0, borderRadius: 6, background: "#FF7F56", color: "#fff", fontSize: 16, cursor: "pointer" }}
            >
              Дахин оролдох
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
