import type { Metadata } from "next"
import { DemoShowcase } from "@/components/demo/DemoShowcase"
import { buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Axiom AI Demo Showcase",
  description: "Internal showcase page for premium product videos and clean screen recordings.",
  path: "/demo",
  keywords: ["axiom ai demo", "product showcase", "crypto app demo", "video walkthrough"],
  noIndex: true,
})

export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<{ video?: string }>
}) {
  const params = await searchParams
  const videoMode = params.video === "true" || params.video === "1"

  return <DemoShowcase videoMode={videoMode} />
}
