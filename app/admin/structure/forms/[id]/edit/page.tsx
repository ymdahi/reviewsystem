'use client'

import { FormBuilder } from "../../components/form-builder"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useEffect, useState } from "react"
import { Form } from "../../types"

export default function EditFormPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [form, setForm] = useState<Form | null>(null)
  const [loading, setLoading] = useState(true)
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    let mounted = true

    const init = async () => {
      // Check for valid ID
      if (!params?.id || params.id === 'null') {
        setRedirecting(true)
        await router.replace('/admin/structure/forms')
        return
      }

      try {
        const response = await fetch(`/api/admin/forms/${params.id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch form')
        }
        const data = await response.json()
        if (mounted) {
          setForm(data)
        }
      } catch (error) {
        console.error('Error fetching form:', error)
        if (mounted) {
          toast({
            title: "Error",
            description: "Failed to fetch form. Please try again.",
            variant: "destructive",
          })
          setRedirecting(true)
          await router.push('/admin/structure/forms')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    init()

    return () => {
      mounted = false
    }
  }, [params?.id, router, toast])

  // Show nothing while redirecting
  if (redirecting) {
    return null
  }

  // Show loading state
  if (loading) {
    return <div className="text-center py-6">Loading form...</div>
  }

  // Show nothing if no form data
  if (!form) {
    return null
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Edit Form</h1>
      <FormBuilder
        initialData={form}
        onSubmit={async (formData) => {
          try {
            const response = await fetch(`/api/admin/forms/${params.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(formData),
            })

            if (!response.ok) {
              throw new Error('Failed to update form')
            }

            toast({
              title: "Success",
              description: "Form updated successfully",
            })

            router.push('/admin/structure/forms')
          } catch (error) {
            console.error('Error updating form:', error)
            toast({
              title: "Error",
              description: "Failed to update form. Please try again.",
              variant: "destructive",
            })
          }
        }}
      />
    </div>
  )
}
