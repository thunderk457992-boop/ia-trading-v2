"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export function HomeLink({
  fallbackHref,
  className,
  children,
}: {
  fallbackHref: string
  className?: string
  children: React.ReactNode
}) {
  const [href, setHref] = useState(fallbackHref)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHref(session ? "/dashboard" : "/")
    })
  }, [])

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}
