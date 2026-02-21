import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL

    if (!GOOGLE_SCRIPT_URL) {
      console.error('GOOGLE_SCRIPT_URL is not set')
      return NextResponse.json(
        { error: 'Google Script URL not configured' },
        { status: 500 }
      )
    }

    console.log('Submitting to:', GOOGLE_SCRIPT_URL)

    const payload = {
      studentName: data.studentName,
      studentId: data.studentId,
      major: data.major,
      otherMajor: data.otherMajor || '',
      project: data.project,
      acknowledged: data.acknowledged ? 'Yes' : 'No',
      signature: data.signature,
      timestamp: new Date().toISOString(),
    }

    // Google Apps Script Web Apps always redirect (302) on POST.
    // Using redirect: 'manual' lets us detect the redirect as success
    // without following it (which can cause issues with method changes).
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
      redirect: 'manual',
    })

    console.log('Response status:', response.status)

    // A 302 redirect means Google Apps Script received and processed it
    if (response.status === 302 || response.status === 200 || response.status === 201) {
      return NextResponse.json({ success: true })
    }

    // If we get here, something unexpected happened
    const text = await response.text().catch(() => 'Could not read response')
    console.error('Unexpected response:', response.status, text)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Submission error:', error)
    return NextResponse.json(
      { error: 'Failed to submit form' },
      { status: 500 }
    )
  }
}
