'use client'

import { useToast } from "@/hooks/use-toast"
import { FormList } from "./form-list"
import { useState, useEffect } from "react"
import { Form } from "../types"

export function FormManager() {
  const { toast } = useToast()
  const [forms, setForms] = useState<Form[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchForms()
  }, [])

  const fetchForms = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/forms')
      if (!response.ok) {
        throw new Error('Failed to fetch forms')
      }
      const data = await response.json()
      // Ensure we only set valid form data
      setForms(Array.isArray(data) ? data.filter((form): form is Form => 
        form && typeof form === 'object' && typeof form.id === 'string'
      ) : [])
    } catch (error) {
      console.error('Error fetching forms:', error)
      toast({
        title: "Error",
        description: "Failed to fetch forms. Please try again.",
        variant: "destructive",
      })
      setForms([])
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteForm = async (id: string) => {
    if (!id) return

    try {
      const response = await fetch(`/api/admin/forms/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete form")
      }

      toast({
        title: "Form deleted",
        description: "The form has been successfully deleted.",
      })

      // Refresh the forms list
      fetchForms()
    } catch (error) {
      console.error('Error deleting form:', error)
      toast({
        title: "Error",
        description: "Failed to delete form. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div>
      {loading ? (
        <div className="text-center py-6">Loading forms...</div>
      ) : (
        <FormList forms={forms} onDelete={handleDeleteForm} />
      )}
    </div>
  )
}
