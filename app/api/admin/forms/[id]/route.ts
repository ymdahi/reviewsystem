import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"

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

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!params.id || params.id === 'null') {
      return NextResponse.json(
        { error: "Invalid form ID" },
        { status: 400 }
      )
    }

    const result = await db.execute({
      sql: `SELECT * FROM forms WHERE id = ?`,
      args: [params.id]
    })

    const form = result.rows?.[0]

    if (!form) {
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404 }
      )
    }

    // Parse the fields JSON
    return NextResponse.json({
      ...form,
      fields: JSON.parse(String(form.fields || '[]'))
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
    if (!params.id || params.id === 'null') {
      return NextResponse.json(
        { error: "Invalid form ID" },
        { status: 400 }
      )
    }

    const body = await req.json()
    const validatedData = formSchema.parse(body)

    const result = await db.execute({
      sql: `UPDATE forms SET title = ?, description = ?, fields = ? WHERE id = ?`,
      args: [
        validatedData.title,
        validatedData.description || null,
        JSON.stringify(validatedData.fields),
        params.id
      ],
    })

    if (result.rowsAffected === 0) {
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
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

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!params.id || params.id === 'null') {
      return NextResponse.json(
        { error: "Invalid form ID" },
        { status: 400 }
      )
    }

    const result = await db.execute({
      sql: `DELETE FROM forms WHERE id = ?`,
      args: [params.id],
    })

    if (result.rowsAffected === 0) {
      return NextResponse.json(
        { error: "Form not found" },
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
