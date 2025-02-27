'use client'

import { Button } from "@/components/ui/button"
import { Form } from "../types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, PencilLine, Trash } from 'lucide-react';
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface FormListProps {
  forms: Form[];
  onDelete: (id: string) => void;
}

export function FormList({ forms = [], onDelete }: FormListProps) {
  const router = useRouter()

  if (!forms?.length) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-500 mb-4">No forms found.</p>
        <Button onClick={() => router.push('/admin/structure/forms/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Form
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Forms</h2>
        <Button onClick={() => router.push('/admin/structure/forms/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Form
        </Button>
      </div>

      <div className="grid gap-4">
        {forms.filter(form => form?.id).map((form) => (
          <Card key={form.id}>
            <CardHeader>
              <CardTitle>{form.title}</CardTitle>
              <CardDescription>{form.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  {form.fields?.length || 0} fields
                </span>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/structure/forms/${form.id}/edit`)}
                  >
                    <PencilLine className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Form</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{form.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(form.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
