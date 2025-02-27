import { Button } from "@/components/ui/button"
import { Entity } from "../types"
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

interface EntityListProps {
  entities: Entity[] | null;
  onDelete: (id: string) => void;
}

export function EntityList({ entities = [], onDelete }: EntityListProps) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Content Types</h2>
        <Button onClick={() => router.push("/admin/structure/content-types/new")}>
          <Plus className="mr-2 h-4 w-4" />
          New Content Type
        </Button>
      </div>
      
      {!entities || entities.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Content Types Found</CardTitle>
            <CardDescription>
              Get started by creating your first content type.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={() => router.push("/admin/structure/content-types/new")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Content Type
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {entities.map((entity) => (
            <Card key={entity.id}>
              <CardHeader>
                <CardTitle>{entity.name}</CardTitle>
                <CardDescription>{entity.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {entity.fields.length} fields
                  </span>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/structure/content-types/${entity.id}/edit`)}
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
                          <AlertDialogTitle>Delete Content Type</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{entity.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDelete(entity.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
