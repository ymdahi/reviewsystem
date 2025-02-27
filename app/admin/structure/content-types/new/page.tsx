'use client'

import { EntityForm } from "../../components/entity-form"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function NewContentTypePage() {
  const router = useRouter()
  const { toast } = useToast()

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">New Content Type</h1>
      <p className="text-gray-600 mb-8">
        Create a new content type to define the structure of your content.
      </p>

      <EntityForm 
        onSubmit={async (data) => {
          try {
            const response = await fetch('/api/admin/content-types', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(data),
            })

            if (!response.ok) {
              throw new Error('Failed to create content type')
            }

            toast({
              title: "Success",
              description: "Content type created successfully.",
            })

            router.push('/admin/structure/content-types')
          } catch (error) {
            toast({
              title: "Error",
              description: "Failed to create content type. Please try again.",
              variant: "destructive",
            })
          }
        }} 
      />
    </div>
  )
}
