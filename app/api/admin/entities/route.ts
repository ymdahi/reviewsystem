import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"

const entitySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  fields: z.array(z.object({
    name: z.string().min(1),
    type: z.enum(["text", "number", "date", "boolean", "file", "relation", "select", "email", "url"]),
    description: z.string().optional(),
    required: z.boolean(),
    defaultValue: z.any().optional(),
    placeholder: z.string().optional(),
    validationRules: z.array(z.object({
      type: z.string(),
      value: z.any(),
      message: z.string()
    })).optional(),
    options: z.array(z.object({
      label: z.string(),
      value: z.any()
    })).optional(),
    relation: z.object({
      entityId: z.string(),
      displayField: z.string()
    }).optional()
  }))
})

export async function POST(req: Request) {
  try {
    const json = await req.json()
    const body = entitySchema.parse(json)

    const result = await db.execute({
      sql: `INSERT INTO entities (name, description, fields)
            VALUES (?, ?, ?)
            RETURNING *`,
      args: [body.name, body.description, JSON.stringify(body.fields)]
    })

    return NextResponse.json(result.rows?.[0] || null)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const result = await db.execute({
      sql: `SELECT * FROM entities ORDER BY created_at DESC`
    })

    // Parse the fields JSON for each entity
    const entities = result.rows.map(entity => ({
      ...entity,
      fields: JSON.parse(entity.fields || '[]')
    }))

    return NextResponse.json(entities)
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
