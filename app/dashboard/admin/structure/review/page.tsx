'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Trash2, GripVertical, Check, X } from 'lucide-react';
import { ReviewField } from '@/lib/review-schema';
import * as Toast from '@radix-ui/react-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableItemProps {
  id: string;
  field: ReviewField;
  onUpdate: (id: string, updates: Partial<ReviewField>) => void;
  onDelete: (id: string) => void;
}

function SortableItem({ id, field, onUpdate, onDelete }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-4 p-4 border rounded-lg">
      <div className="flex items-center gap-4">
        <div {...attributes} {...listeners}>
          <GripVertical className="h-5 w-5 text-gray-400 cursor-grab" />
        </div>
        
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label htmlFor={`name-${id}`}>Field Name</Label>
            <Input
              id={`name-${id}`}
              value={field.name}
              onChange={(e) => onUpdate(id, { name: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor={`label-${id}`}>Label</Label>
            <Input
              id={`label-${id}`}
              value={field.label}
              onChange={(e) => onUpdate(id, { label: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor={`type-${id}`}>Type</Label>
            <Select
              value={field.type}
              onValueChange={(value) => onUpdate(id, { type: value as 'number' | 'text' | 'textarea' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="textarea">Text Area</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id={`required-${id}`}
                checked={field.required}
                onCheckedChange={(checked) => onUpdate(id, { required: checked })}
              />
              <Label htmlFor={`required-${id}`}>Required</Label>
            </div>

            {field.type === 'number' && (
              <>
                <Input
                  type="number"
                  placeholder="Min"
                  className="w-20"
                  value={field.min}
                  onChange={(e) => onUpdate(id, { min: parseInt(e.target.value) })}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  className="w-20"
                  value={field.max}
                  onChange={(e) => onUpdate(id, { max: parseInt(e.target.value) })}
                />
              </>
            )}
          </div>
        </div>

        <Button
          variant="destructive"
          size="icon"
          onClick={() => onDelete(id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function ReviewStructurePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [fields, setFields] = useState<ReviewField[]>([]);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [toastData, setToastData] = useState<{ title: string; description: string; type: 'success' | 'error' }>({
    title: '',
    description: '',
    type: 'success'
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchFields();
  }, []);

  async function fetchFields() {
    try {
      const response = await fetch('/api/admin/review-schema');
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/login');
          return;
        }
        throw new Error('Failed to fetch fields');
      }
      const data = await response.json();
      setFields(data.fields);
    } catch (error) {
      setError('Failed to load review structure');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddField() {
    const newField = {
      name: `field_${Date.now()}`,
      label: 'New Field',
      type: 'number' as const,
      required: true,
      min: 0,
      max: 10,
      order: fields.length + 1
    };

    try {
      const response = await fetch('/api/admin/review-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newField)
      });

      if (!response.ok) throw new Error('Failed to add field');
      
      const data = await response.json();
      setFields([...fields, data.field]);
    } catch (error) {
      setError('Failed to add field');
      console.error(error);
    }
  }

  async function handleUpdateField(id: string, updates: Partial<ReviewField>) {
    try {
      const response = await fetch('/api/admin/review-schema', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      });

      if (!response.ok) throw new Error('Failed to update field');
      
      const data = await response.json();
      setFields(fields.map(f => f.id === id ? data.field : f));
    } catch (error) {
      setError('Failed to update field');
      console.error(error);
    }
  }

  async function handleDeleteField(id: string) {
    try {
      const response = await fetch('/api/admin/review-schema', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (!response.ok) throw new Error('Failed to delete field');
      
      setFields(fields.filter(f => f.id !== id));
    } catch (error) {
      setError('Failed to delete field');
      console.error(error);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
          ...item,
          order: index + 1
        }));

        // Update the server
        fetch('/api/admin/review-schema/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderedIds: newItems.map(item => item.id) })
        }).catch(error => {
          setError('Failed to save field order');
          console.error(error);
        });

        return newItems;
      });
    }
  }

  async function handleSaveAll() {
    setIsSaving(true);
    try {
      // Save each field in sequence to maintain order
      for (const field of fields) {
        await fetch('/api/admin/review-schema', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(field)
        });
      }
      setError('');
      setToastData({
        title: 'Changes saved',
        description: 'All changes have been successfully saved.',
        type: 'success'
      });
      setOpen(true);
    } catch (error) {
      setError('Failed to save all fields');
      console.error(error);
      setToastData({
        title: 'Error saving changes',
        description: 'There was a problem saving your changes. Please try again.',
        type: 'error'
      });
      setOpen(true);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Toast.Provider swipeDirection="right">
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Review Form Structure</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg">
                {error}
              </div>
            )}

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={fields.map(f => f.id)}
                strategy={verticalListSortingStrategy}
              >
                {fields.map((field) => (
                  <SortableItem
                    key={field.id}
                    id={field.id}
                    field={field}
                    onUpdate={handleUpdateField}
                    onDelete={handleDeleteField}
                  />
                ))}
              </SortableContext>
            </DndContext>

            <Button onClick={handleAddField} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>

            <div className="flex justify-end mt-6">
              <Button 
                onClick={handleSaveAll} 
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save All Changes'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Toast.Root
          className={`${
            toastData.type === 'success' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
          } fixed bottom-4 right-4 rounded-lg border p-4 shadow-lg`}
          open={open}
          onOpenChange={setOpen}
        >
          <div className="flex items-center gap-3">
            <div className={`${
              toastData.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            } rounded-full p-1`}>
              {toastData.type === 'success' ? (
                <Check className="h-4 w-4 text-white" />
              ) : (
                <X className="h-4 w-4 text-white" />
              )}
            </div>
            <div>
              <Toast.Title className="mb-1 font-medium">
                {toastData.title}
              </Toast.Title>
              <Toast.Description className="text-sm text-gray-500">
                {toastData.description}
              </Toast.Description>
            </div>
          </div>
        </Toast.Root>
        <Toast.Viewport />
      </div>
    </Toast.Provider>
  );
}
