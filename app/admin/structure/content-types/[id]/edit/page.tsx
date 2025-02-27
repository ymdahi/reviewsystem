'use client'

import { EntityForm } from "../../../components/entity-form"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useEffect, useState } from "react"
import { Entity } from "../../../types"

export default function EditContentTypePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [entity, setEntity] = useState<Entity | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEntity = async () => {
      try {
        const response = await fetch(`/api/admin/content-types/${params.id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch content type')
        }
        const data = await response.json()
        setEntity(data)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch content type. Please try again.",
          variant: "destructive",
        })
        router.push('/admin/structure/content-types')
      } finally {
        setLoading(false)
      }
    }

    fetchEntity()
  }, [params.id, router, toast])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!entity) {
    return null
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Edit Content Type</h1>
      <p className="text-gray-600 mb-8">
        Modify the content type structure and properties.
      </p>

      <EntityForm 
        initialData={entity}
        onSubmit={async (data) => {
          try {
            const response = await fetch(`/api/admin/content-types/${params.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(data),
            })

            if (!response.ok) {
              throw new Error('Failed to update content type')
            }

            toast({
              title: "Success",
              description: "Content type updated successfully.",
            })

            router.push('/admin/structure/content-types')
          } catch (error) {
            toast({
              title: "Error",
              description: "Failed to update content type. Please try again.",
              variant: "destructive",
            })
          }
        }} 
      />
    </div>
  )
}
