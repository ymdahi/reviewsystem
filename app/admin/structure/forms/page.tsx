'use client'

import { FormManager } from "./components/form-manager"

export default function FormsPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Form Management</h1>
      <p className="text-gray-600 mb-8">
        Create and manage forms with custom fields for collecting user input.
      </p>

      <FormManager />
    </div>
  )
}
