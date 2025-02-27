import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Form Management",
  description: "Manage system forms and their configurations",
}

export default function FormsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
