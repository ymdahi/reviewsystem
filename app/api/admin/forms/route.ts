import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"
import { nanoid } from 'nanoid'

const formSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  fields: z.array(z.object({
    name: z.string().min(1),
    type: z.enum(["text", "textarea", "number", "email", "star-rating"]),
    description: z.string().optional(),
    required: z.boolean(),
    placeholder: z.string().optional(),
  }))
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validatedData = formSchema.parse(body)
    const id = nanoid()

    const result = await db.execute({
      sql: `INSERT INTO forms (id, title, description, fields) VALUES (?, ?, ?, ?)`,
      args: [
        id,
        validatedData.title,
        validatedData.description || null,
        JSON.stringify(validatedData.fields),
      ],
    })

    // Return the created form
    return NextResponse.json({
      id,
      ...validatedData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error creating form:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid form data", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const result = await db.execute(`
      SELECT id, title, description, fields, created_at, updated_at 
      FROM forms 
      ORDER BY created_at DESC
    `)

    // Parse the fields JSON for each form
    const forms = result.rows?.map(form => ({
      ...form,
      fields: JSON.parse(String(form.fields || '[]'))
    })) || []

    return NextResponse.json(forms)
  } catch (error) {
    console.error('Error fetching forms:', error)
    return NextResponse.json(
      { error: "Failed to fetch forms" },
      { status: 500 }
    )
  }
}
