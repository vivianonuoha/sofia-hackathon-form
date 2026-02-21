import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL

    if (!GOOGLE_SCRIPT_URL) {
      return NextResponse.json(
        { error: 'Google Script URL not configured' },
        { status: 500 }
      )
    }

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentName: data.studentName,
        studentId: data.studentId,
        major: data.major,
        otherMajor: data.otherMajor || '',
        project: data.project,
        acknowledged: data.acknowledged ? 'Yes' : 'No',
        signature: data.signature, // base64 image data
        timestamp: new Date().toISOString(),
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to submit to Google Sheets')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Submission error:', error)
    return NextResponse.json(
      { error: 'Failed to submit form' },
      { status: 500 }
    )
  }
}
