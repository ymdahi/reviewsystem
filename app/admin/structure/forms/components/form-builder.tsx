'use client'

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form as UIForm, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormField as FormFieldType, FormFieldType as FieldType } from "../types"
import { Card } from "@/components/ui/card"
import { GripVertical, Trash } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

const fieldTypes: { label: string; value: FieldType }[] = [
  { label: "Text", value: "text" },
  { label: "Text Area", value: "textarea" },
  { label: "Number", value: "number" },
  { label: "Email", value: "email" },
  { label: "Star Rating", value: "star-rating" },
]

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  fields: z.array(z.object({
    name: z.string().min(1, "Field name is required"),
    type: z.enum(["text", "textarea", "number", "email", "star-rating"]),
    description: z.string().optional(),
    required: z.boolean().default(false),
    placeholder: z.string().optional(),
  })).default([]),
})

type FormValues = z.infer<typeof formSchema>

interface FormBuilderProps {
  initialData?: Form;
  onSubmit: (data: FormValues) => void;
}

export function FormBuilder({ initialData, onSubmit }: FormBuilderProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      fields: Array.isArray(initialData?.fields) ? initialData.fields.map(field => ({
        name: field.name || "",
        type: field.type || "text",
        description: field.description || "",
        required: field.required || false,
        placeholder: field.placeholder || "",
      })) : [],
    },
  })

  const fields = form.watch("fields") || []

  const addField = () => {
    const currentFields = form.getValues("fields") || []
    form.setValue("fields", [
      ...currentFields,
      {
        name: "",
        type: "text" as const,
        required: false,
      },
    ])
  }

  const removeField = (index: number) => {
    const currentFields = form.getValues("fields") || []
    currentFields.splice(index, 1)
    form.setValue("fields", [...currentFields])
  }

  return (
    <UIForm {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Form Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                A descriptive title for your form
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormDescription>
                Optional description of the form's purpose
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Fields</h3>
            <Button type="button" onClick={addField} variant="outline">
              Add Field
            </Button>
          </div>

          {fields.map((field, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center space-x-4">
                <GripVertical className="h-5 w-5 text-gray-500" />
                <div className="flex-1 grid gap-4 grid-cols-2">
                  <FormField
                    control={form.control}
                    name={`fields.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Field Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`fields.${index}.type`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {fieldTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`fields.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`fields.${index}.placeholder`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Placeholder</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`fields.${index}.required`}
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormLabel>Required</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeField(index)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <Button type="submit">
          {initialData ? "Update Form" : "Create Form"}
        </Button>
      </form>
    </UIForm>
  )
}
