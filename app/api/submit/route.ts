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

    // Google Apps Script returns a 302 redirect on POST.
    // We use redirect: 'follow' and accept any non-500 response.
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      redirect: 'follow',
      body: JSON.stringify({
        studentName: data.studentName,
        studentId: data.studentId,
        major: data.major,
        otherMajor: data.otherMajor || '',
        project: data.project,
        acknowledged: data.acknowledged ? 'Yes' : 'No',
        signature: data.signature,
        timestamp: new Date().toISOString(),
      }),
    })

    if (response.status >= 500) {
      throw new Error('Google Apps Script returned an error')
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
