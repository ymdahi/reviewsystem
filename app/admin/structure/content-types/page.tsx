import { Metadata } from "next"
import { EntityManager } from "../components/entity-manager"

export const metadata: Metadata = {
  title: "Content Type",
  description: "Configure and manage your content types.",
}

export default function EntitiesPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Content Types</h1>
      <p className="text-gray-600">
        Configure and manage your content types.
      </p>

      <EntityManager />
    </div>
  )
}
