export function normalizeNextPath(nextPath?: string | null) {
  if (!nextPath || !nextPath.trim()) return "/auth/post-login"
  return nextPath.startsWith("/") ? nextPath : `/${nextPath}`
}

export function buildAuthCallbackUrl(origin: string, nextPath?: string | null) {
  const url = new URL("/auth/callback", origin)
  url.searchParams.set("next", normalizeNextPath(nextPath))
  return url.toString()
}
