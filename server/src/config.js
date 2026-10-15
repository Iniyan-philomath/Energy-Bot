export function readConfig(env = process.env) {
  const origins = (env.ALLOWED_ORIGINS || "https://energybot.onrender.com")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  for (const origin of origins) {
    const parsed = new URL(origin);
    if (
      parsed.origin !== origin ||
      !["https:", "http:"].includes(parsed.protocol)
    )
      throw new Error(
        "ALLOWED_ORIGINS must contain exact origins without trailing slashes.",
      );
  }
  const supabaseUrl =
    env.SUPABASE_URL || "https://akgdqmijbygpunwtgoss.supabase.co";
  const parsed = new URL(supabaseUrl);
  if (
    parsed.protocol !== "https:" ||
    !parsed.hostname.endsWith(".supabase.co") ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.pathname !== "/"
  )
    throw new Error("SUPABASE_URL must be a Supabase HTTPS project URL.");
  const bucket = env.AUDIT_BUCKET || "energy-audits";
  const objectPath = env.AUDIT_OBJECT_PATH || "sce-energy-audit-2025-2026.pdf";
  if (
    !/^[\w-]+$/.test(bucket) ||
    !objectPath.toLowerCase().endsWith(".pdf") ||
    objectPath.includes("..") ||
    objectPath.startsWith("/") ||
    objectPath.includes("?")
  )
    throw new Error("Configure one fixed PDF path in AUDIT_OBJECT_PATH.");
  return {
    port: Number(env.PORT || 3001),
    origins,
    supabaseUrl,
    bucket,
    objectPath,
    supabaseKey: env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || "",
    groqKey: env.GROQ_API_KEY || "",
    model: env.GROQ_MODEL || "llama-3.3-70b-versatile",
  };
}
