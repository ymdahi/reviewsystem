'use client'

import { FormField as FormFieldType } from "../types"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { StarRating } from "@/components/star-rating"
import { Card } from "@/components/ui/card"
import { useState } from "react"

interface FormPreviewProps {
  title: string
  description?: string
  fields: FormFieldType[]
}

export function FormPreview({ title, description, fields }: FormPreviewProps) {
  const [formState, setFormState] = useState<Record<string, any>>({})

  const renderField = (field: FormFieldType) => {
    const commonProps = {
      id: field.name,
      placeholder: field.placeholder,
      required: field.required,
      value: formState[field.name] || "",
      onChange: (e: any) => {
        const value = e.target?.value ?? e
        setFormState(prev => ({ ...prev, [field.name]: value }))
      }
    }

    switch (field.type) {
      case "text":
      case "email":
        return <Input type={field.type} {...commonProps} />
      case "textarea":
        return <Textarea {...commonProps} />
      case "number":
        return <Input type="number" {...commonProps} />
      case "star-rating":
        return (
          <StarRating
            value={formState[field.name] || 0}
            onChange={(value) => setFormState(prev => ({ ...prev, [field.name]: value }))}
          />
        )
      default:
        return null
    }
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">{title || "Untitled Form"}</h2>
          {description && <p className="text-gray-600 mt-2">{description}</p>}
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={index} className="space-y-2">
              <Label htmlFor={field.name}>
                {field.name}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {field.description && (
                <p className="text-sm text-gray-500">{field.description}</p>
              )}
              {renderField(field)}
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
