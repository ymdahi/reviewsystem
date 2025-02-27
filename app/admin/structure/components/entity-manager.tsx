'use client'

import { useToast } from "@/hooks/use-toast"
import { EntityList } from "./entity-list"
import { useState, useEffect } from "react"
import { Entity } from "../types"

export function EntityManager() {
  const { toast } = useToast()
  const [entities, setEntities] = useState<Entity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEntities()
  }, [])

  const fetchEntities = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/entities')
      if (!response.ok) {
        throw new Error('Failed to fetch entities')
      }
      const data = await response.json()
      // Ensure data is an array
      setEntities(Array.isArray(data) ? data : [])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch entities. Please try again.",
        variant: "destructive",
      })
      setEntities([])
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEntity = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/entities/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete entity")
      }

      toast({
        title: "Entity deleted",
        description: "The entity has been successfully deleted.",
      })
      
      // Refresh the entities list
      fetchEntities()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete entity. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <EntityList 
      entities={entities}
      onDelete={handleDeleteEntity}
    />
  )
}
