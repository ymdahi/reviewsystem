import { Metadata } from "next"

export const metadata: Metadata = {
  title: "New Content Type",
  description: "Create a new content type",
}

export default function NewContentTypeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
