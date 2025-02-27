import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Edit Content Type",
  description: "Modify content type structure and configuration",
}

export default function EditContentTypeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
