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

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const result = await db.execute({
      sql: `SELECT * FROM entities WHERE id = ?`,
      args: [params.id]
    })

    const entity = result.rows?.[0]

    if (!entity) {
      return NextResponse.json(
        { error: "Content type not found" },
        { status: 404 }
      )
    }

    // Parse the fields JSON
    return NextResponse.json({
      ...entity,
      fields: JSON.parse(String(entity.fields || '[]'))
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const json = await req.json()
    const body = entitySchema.parse(json)

    const result = await db.execute({
      sql: `UPDATE entities 
            SET name = ?, 
                description = ?, 
                fields = ?
            WHERE id = ?
            RETURNING *`,
      args: [body.name, body.description, JSON.stringify(body.fields), params.id]
    })

    const entity = result.rows?.[0]

    if (!entity) {
      return NextResponse.json(
        { error: "Content type not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(entity)
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

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if there are any records for this entity
    const recordsResult = await db.execute({
      sql: `SELECT COUNT(*) as count FROM entity_records WHERE entity_id = ?`,
      args: [params.id]
    })

    const count = recordsResult.rows?.[0]?.count || 0

    if (count > 0) {
      return NextResponse.json(
        { error: "Cannot delete content type with existing records" },
        { status: 400 }
      )
    }

    const result = await db.execute({
      sql: `DELETE FROM entities WHERE id = ? RETURNING *`,
      args: [params.id]
    })

    if (!result.rows?.[0]) {
      return NextResponse.json(
        { error: "Content type not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
