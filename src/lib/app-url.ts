const APP_URL_ENV_KEYS = [
  "NEXT_PUBLIC_SITE_URL",
  "SITE_URL",
  "APP_URL",
  "NEXT_PUBLIC_APP_URL",
] as const

function isUsableOrigin(origin: string | null | undefined) {
  if (!origin) return false

  try {
    const url = new URL(origin)
    return url.hostname !== "0.0.0.0" && url.hostname !== "::" && url.hostname !== "[::]"
  } catch {
    return false
  }
}

export function resolveAppUrl(request: Request) {
  const forwardedProto = request.headers.get("x-forwarded-proto")
  const forwardedHost = request.headers.get("x-forwarded-host")
  const host = request.headers.get("host")

  const candidates: Array<string | undefined> = []

  if (forwardedProto && forwardedHost) {
    candidates.push(`${forwardedProto}://${forwardedHost}`)
  }

  if (host) {
    const inferredProto =
      forwardedProto ??
      (host.includes("localhost") ||
      host.startsWith("127.") ||
      host.startsWith("192.168.") ||
      host.startsWith("10.") ||
      host.endsWith(".local")
        ? "http"
        : "https")

    candidates.push(`${inferredProto}://${host}`)
  }

  candidates.push(...APP_URL_ENV_KEYS.map((key) => process.env[key]))
  candidates.push(new URL(request.url).origin)

  const resolved = candidates.find((candidate) => isUsableOrigin(candidate))

  if (!resolved) {
    return new URL(request.url).origin.replace("0.0.0.0", "localhost")
  }

  return resolved
}
