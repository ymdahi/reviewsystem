'use client'

import { FormBuilder } from "../components/form-builder"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function NewFormPage() {
  const router = useRouter()
  const { toast } = useToast()

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Create New Form</h1>
      <p className="text-gray-600 mb-8">
        Define a new form by specifying its fields and properties.
      </p>

      <FormBuilder 
        onSubmit={async (data) => {
          try {
            const response = await fetch('/api/admin/forms', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(data),
            })

            if (!response.ok) {
              throw new Error('Failed to create form')
            }

            toast({
              title: "Success",
              description: "Form created successfully.",
            })

            router.push('/admin/structure/forms')
          } catch (error) {
            toast({
              title: "Error",
              description: "Failed to create form. Please try again.",
              variant: "destructive",
            })
          }
        }}
      />
    </div>
  )
}
