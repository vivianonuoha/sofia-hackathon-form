'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

/* ─── Signature Pad Component ─── */
function SignaturePad({
  onSignatureChange,
}: {
  onSignatureChange: (data: string | null) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    canvas.style.width = rect.width + 'px'
    canvas.style.height = rect.height + 'px'

    ctx.strokeStyle = '#1a1a2e'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    setIsDrawing(true)
    const { x, y } = getPos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return
    e.preventDefault()
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = getPos(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const endDraw = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    setHasSignature(true)
    const canvas = canvasRef.current
    if (canvas) {
      onSignatureChange(canvas.toDataURL('image/png'))
    }
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
    setHasSignature(false)
    onSignatureChange(null)
  }

  return (
    <div style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '160px',
          border: '2px dashed #c4b5a0',
          borderRadius: '12px',
          cursor: 'crosshair',
          background: '#fefcf9',
          touchAction: 'none',
        }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '16px',
          right: '16px',
          borderTop: '1px solid #d4c5b0',
          pointerEvents: 'none',
        }}
      />
      {hasSignature && (
        <button
          type="button"
          onClick={clearSignature}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'rgba(180,60,60,0.1)',
            color: '#b43c3c',
            border: 'none',
            borderRadius: '6px',
            padding: '4px 12px',
            fontSize: '12px',
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Clear
        </button>
      )}
      <p
        style={{
          textAlign: 'center',
          fontSize: '12px',
          color: '#9a8b7a',
          marginTop: '6px',
          fontFamily: 'Outfit, sans-serif',
        }}
      >
        Sign above using your mouse or finger
      </p>
    </div>
  )
}

/* ─── Main Form ─── */
const MAJORS = [
  'Chemistry',
  'Mathematics',
  'Biology',
  'Environmental Science',
  'Other',
]

const ACKNOWLEDGEMENT_TEXT = `I acknowledge that by participating in this hackathon, I am representing Sofia University. I understand and agree that any work, projects, prototypes, research, or intellectual property produced during this hackathon may be used by Sofia University for additional research, funding applications, publications, promotional materials, or other university-related purposes. I confirm that all information provided is accurate and that I am a currently enrolled student at Sofia University.`

type FormState = {
  studentName: string
  studentId: string
  major: string
  otherMajor: string
  project: string
  acknowledged: boolean
  signature: string | null
}

export default function HackathonForm() {
  const [form, setForm] = useState<FormState>({
    studentName: '',
    studentId: '',
    major: '',
    otherMajor: '',
    project: '',
    acknowledged: false,
    signature: null,
  })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  const updateField = (field: keyof FormState, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const validate = (): boolean => {
    const newErrors: typeof errors = {}
    if (!form.studentName.trim()) newErrors.studentName = 'Name is required'
    if (!form.studentId.trim()) newErrors.studentId = 'Student ID is required'
    if (!form.major) newErrors.major = 'Please select your major'
    if (form.major === 'Other' && !form.otherMajor.trim())
      newErrors.otherMajor = 'Please specify your major'
    if (!form.project.trim()) newErrors.project = 'Project name/description is required'
    if (!form.acknowledged)
      newErrors.acknowledged = 'You must acknowledge the terms to participate'
    if (!form.signature) newErrors.signature = 'Signature is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setStatus('submitting')
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <>
        <style jsx global>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Outfit', sans-serif;
            background: #f5f0e8;
            min-height: 100vh;
          }
        `}</style>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            background: 'linear-gradient(135deg, #f5f0e8 0%, #e8e0d0 100%)',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '24px',
              padding: '60px 48px',
              textAlign: 'center',
              maxWidth: '520px',
              boxShadow: '0 8px 40px rgba(0,0,0,0.06)',
            }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2d6a4f, #40916c)',
                margin: '0 auto 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '36px',
                color: '#fff',
              }}
            >
              ✓
            </div>
            <h2
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: '28px',
                color: '#1a1a2e',
                marginBottom: '12px',
              }}
            >
              Registration Complete
            </h2>
            <p style={{ color: '#6b5e50', lineHeight: 1.6 }}>
              Thank you for registering for the Sofia University Hackathon! Your
              entry has been recorded. Good luck!
            </p>
          </div>
        </div>
      </>
    )
  }

  const inputStyle = (hasError: boolean) => ({
    width: '100%',
    padding: '14px 16px',
    border: `2px solid ${hasError ? '#c0392b' : '#e0d6c8'}`,
    borderRadius: '12px',
    fontSize: '15px',
    fontFamily: 'Outfit, sans-serif',
    background: hasError ? '#fef5f5' : '#fefcf9',
    color: '#1a1a2e',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  })

  const labelStyle = {
    display: 'block',
    fontWeight: 600 as const,
    fontSize: '14px',
    color: '#3d3425',
    marginBottom: '8px',
    letterSpacing: '0.02em',
  }

  return (
    <>
      <style jsx global>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Outfit', sans-serif;
          background: #f5f0e8;
          min-height: 100vh;
        }
        input:focus, select:focus, textarea:focus {
          border-color: #2d6a4f !important;
          box-shadow: 0 0 0 3px rgba(45,106,79,0.12) !important;
        }
        input::placeholder, textarea::placeholder {
          color: #b8a99a;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f5f0e8 0%, #e8e0d0 100%)',
          padding: '40px 20px 80px',
        }}
      >
        {/* Header */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: '40px',
            animation: 'fadeUp 0.6s ease-out',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#2d6a4f',
              color: '#fff',
              padding: '6px 18px',
              borderRadius: '100px',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase' as const,
              marginBottom: '20px',
            }}
          >
            <span style={{ fontSize: '14px' }}>⚡</span> Hackathon 2026
          </div>
          <h1
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 'clamp(32px, 5vw, 48px)',
              color: '#1a1a2e',
              lineHeight: 1.1,
              marginBottom: '12px',
            }}
          >
            Sofia University
            <br />
            <span style={{ color: '#2d6a4f' }}>Hackathon Registration</span>
          </h1>
          <p
            style={{
              color: '#6b5e50',
              fontSize: '16px',
              maxWidth: '480px',
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            Complete the form below to register as a participant. All fields are
            required.
          </p>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          style={{
            maxWidth: '640px',
            margin: '0 auto',
            background: '#ffffff',
            borderRadius: '24px',
            padding: 'clamp(28px, 5vw, 48px)',
            boxShadow: '0 4px 32px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)',
            animation: 'fadeUp 0.6s ease-out 0.15s both',
          }}
        >
          {/* Student Name */}
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Student Name</label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={form.studentName}
              onChange={(e) => updateField('studentName', e.target.value)}
              style={inputStyle(!!errors.studentName)}
            />
            {errors.studentName && (
              <p style={{ color: '#c0392b', fontSize: '13px', marginTop: '6px' }}>
                {errors.studentName}
              </p>
            )}
          </div>

          {/* Student ID */}
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Student ID</label>
            <input
              type="text"
              placeholder="e.g. SU-2024-001"
              value={form.studentId}
              onChange={(e) => updateField('studentId', e.target.value)}
              style={inputStyle(!!errors.studentId)}
            />
            {errors.studentId && (
              <p style={{ color: '#c0392b', fontSize: '13px', marginTop: '6px' }}>
                {errors.studentId}
              </p>
            )}
          </div>

          {/* Major */}
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Major</label>
            <select
              value={form.major}
              onChange={(e) => updateField('major', e.target.value)}
              style={{
                ...inputStyle(!!errors.major),
                appearance: 'none' as const,
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b5e50' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 16px center',
                paddingRight: '40px',
                cursor: 'pointer',
                color: form.major ? '#1a1a2e' : '#b8a99a',
              }}
            >
              <option value="" disabled>
                Select your major
              </option>
              {MAJORS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            {errors.major && (
              <p style={{ color: '#c0392b', fontSize: '13px', marginTop: '6px' }}>
                {errors.major}
              </p>
            )}
          </div>

          {/* Other Major */}
          {form.major === 'Other' && (
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Specify Major</label>
              <input
                type="text"
                placeholder="Enter your major"
                value={form.otherMajor}
                onChange={(e) => updateField('otherMajor', e.target.value)}
                style={inputStyle(!!errors.otherMajor)}
              />
              {errors.otherMajor && (
                <p style={{ color: '#c0392b', fontSize: '13px', marginTop: '6px' }}>
                  {errors.otherMajor}
                </p>
              )}
            </div>
          )}

          {/* Project */}
          <div style={{ marginBottom: '32px' }}>
            <label style={labelStyle}>Project Name / Description</label>
            <textarea
              placeholder="Briefly describe your hackathon project"
              value={form.project}
              onChange={(e) => updateField('project', e.target.value)}
              rows={3}
              style={{
                ...inputStyle(!!errors.project),
                resize: 'vertical' as const,
                minHeight: '90px',
              }}
            />
            {errors.project && (
              <p style={{ color: '#c0392b', fontSize: '13px', marginTop: '6px' }}>
                {errors.project}
              </p>
            )}
          </div>

          {/* Divider */}
          <div
            style={{
              height: '1px',
              background: 'linear-gradient(to right, transparent, #d4c5b0, transparent)',
              margin: '8px 0 32px',
            }}
          />

          {/* Acknowledgement */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{ ...labelStyle, marginBottom: '12px' }}>
              Acknowledgement
            </label>
            <div
              style={{
                background: '#faf7f2',
                border: '1px solid #e0d6c8',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '16px',
              }}
            >
              <p
                style={{
                  fontSize: '13.5px',
                  color: '#5a4d3e',
                  lineHeight: 1.7,
                }}
              >
                {ACKNOWLEDGEMENT_TEXT}
              </p>
            </div>
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                cursor: 'pointer',
                userSelect: 'none' as const,
              }}
            >
              <input
                type="checkbox"
                checked={form.acknowledged}
                onChange={(e) => updateField('acknowledged', e.target.checked)}
                style={{
                  width: '20px',
                  height: '20px',
                  accentColor: '#2d6a4f',
                  marginTop: '2px',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: '14px', color: '#3d3425', lineHeight: 1.5 }}>
                I have read and agree to the above acknowledgement
              </span>
            </label>
            {errors.acknowledged && (
              <p style={{ color: '#c0392b', fontSize: '13px', marginTop: '8px' }}>
                {errors.acknowledged}
              </p>
            )}
          </div>

          {/* Signature */}
          <div style={{ marginBottom: '36px' }}>
            <label style={labelStyle}>Signature</label>
            <SignaturePad
              onSignatureChange={(data) => updateField('signature', data)}
            />
            {errors.signature && (
              <p style={{ color: '#c0392b', fontSize: '13px', marginTop: '6px' }}>
                {errors.signature}
              </p>
            )}
          </div>

          {/* Submit */}
          {status === 'error' && (
            <div
              style={{
                background: '#fef5f5',
                border: '1px solid #e8c4c4',
                borderRadius: '12px',
                padding: '14px 18px',
                marginBottom: '20px',
                color: '#9b2c2c',
                fontSize: '14px',
              }}
            >
              Something went wrong. Please try again.
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'submitting'}
            style={{
              width: '100%',
              padding: '16px',
              background:
                status === 'submitting'
                  ? '#8fbb9f'
                  : 'linear-gradient(135deg, #2d6a4f, #40916c)',
              color: '#fff',
              border: 'none',
              borderRadius: '14px',
              fontSize: '16px',
              fontWeight: 600,
              fontFamily: 'Outfit, sans-serif',
              cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
              letterSpacing: '0.02em',
              transition: 'transform 0.15s, box-shadow 0.15s',
              boxShadow: '0 4px 16px rgba(45,106,79,0.25)',
            }}
            onMouseEnter={(e) => {
              if (status !== 'submitting') {
                ;(e.target as HTMLElement).style.transform = 'translateY(-1px)'
                ;(e.target as HTMLElement).style.boxShadow =
                  '0 6px 24px rgba(45,106,79,0.3)'
              }
            }}
            onMouseLeave={(e) => {
              ;(e.target as HTMLElement).style.transform = 'translateY(0)'
              ;(e.target as HTMLElement).style.boxShadow =
                '0 4px 16px rgba(45,106,79,0.25)'
            }}
          >
            {status === 'submitting' ? 'Submitting...' : 'Submit Registration'}
          </button>
        </form>

        {/* Footer */}
        <p
          style={{
            textAlign: 'center',
            marginTop: '32px',
            fontSize: '13px',
            color: '#9a8b7a',
          }}
        >
          Sofia University Hackathon © 2026 — All entries are recorded securely.
        </p>
      </div>
    </>
  )
}
