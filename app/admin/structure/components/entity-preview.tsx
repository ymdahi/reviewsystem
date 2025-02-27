'use client'

import { EntityField } from "../types"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface EntityPreviewProps {
  name: string
  description?: string
  fields: EntityField[]
}

export function EntityPreview({ name, description, fields }: EntityPreviewProps) {
  const [formState, setFormState] = useState<Record<string, any>>({})

  const renderField = (field: EntityField) => {
    const commonProps = {
      id: field.name,
      placeholder: field.placeholder,
      required: field.required,
      value: formState[field.name] || field.defaultValue || "",
      onChange: (e: any) => {
        const value = e.target?.value ?? e
        setFormState(prev => ({ ...prev, [field.name]: value }))
      }
    }

    switch (field.type) {
      case "text":
      case "email":
      case "url":
        return <Input type={field.type} {...commonProps} />
      case "number":
        return <Input type="number" {...commonProps} />
      case "date":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formState[field.name] && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formState[field.name] ? format(formState[field.name], "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formState[field.name]}
                onSelect={(date) => setFormState(prev => ({ ...prev, [field.name]: date }))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        )
      case "boolean":
        return (
          <Switch
            checked={formState[field.name] || false}
            onCheckedChange={(checked) => setFormState(prev => ({ ...prev, [field.name]: checked }))}
          />
        )
      case "select":
        return (
          <Select
            value={formState[field.name] || ""}
            onValueChange={(value) => setFormState(prev => ({ ...prev, [field.name]: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="option1">Option 1</SelectItem>
              <SelectItem value="option2">Option 2</SelectItem>
              <SelectItem value="option3">Option 3</SelectItem>
            </SelectContent>
          </Select>
        )
      case "file":
        return (
          <Input
            type="file"
            {...commonProps}
            value={undefined}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                setFormState(prev => ({ ...prev, [field.name]: file }))
              }
            }}
          />
        )
      case "relation":
        return (
          <Select
            value={formState[field.name] || ""}
            onValueChange={(value) => setFormState(prev => ({ ...prev, [field.name]: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a relation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="item1">Related Item 1</SelectItem>
              <SelectItem value="item2">Related Item 2</SelectItem>
              <SelectItem value="item3">Related Item 3</SelectItem>
            </SelectContent>
          </Select>
        )
      default:
        return null
    }
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">{name || "Untitled Content Type"}</h2>
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
