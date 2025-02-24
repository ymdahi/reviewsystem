import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Form Management",
  description: "Manage system forms and their configurations",
}

export default function FormsPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Form Management</h1>
      <p className="text-gray-600">
        Configure and manage your system forms.
      </p>
    </div>
  )
}
