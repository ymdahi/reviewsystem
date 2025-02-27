import { Metadata } from "next"


export const metadata: Metadata = {
  title: "Structure Management",
  description: "Manage system structure, entities and forms",
}

export default function StructurePage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Structure Management</h1>
      <p className="text-gray-600 mb-8">
        Manage your system structure, including content types and form configurations.
      </p>

      
    </div>
  )
}
