import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import QRCode from 'qrcode'

function leaderboardUrl(): string {
  return `${window.location.origin}${window.location.pathname}#/leaderboard`
}

export function SharePage() {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const url = leaderboardUrl()

  useEffect(() => {
    QRCode.toDataURL(url, { width: 280, margin: 1, color: { dark: '#1a2b5e' } }).then(
      setQrDataUrl,
    )
  }, [url])

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="text-3xl font-bold text-[#1a2b5e] relative inline-block">
          Share
          <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-[#c8102e]" />
        </h1>
        <Link
          to="/leaderboard"
          className="text-xs font-semibold tracking-widest text-gray-400 uppercase hover:text-gray-600"
        >
          Back
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
        <p className="text-sm text-gray-500 mb-5">
          Scan the code or share the link to invite someone to the leaderboard.
        </p>

        <div className="flex justify-center mb-5">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="QR code linking to the leaderboard"
              className="rounded-lg border border-gray-100"
            />
          ) : (
            <div className="w-[280px] h-[280px] flex items-center justify-center text-gray-400 text-sm">
              Generating QR code…
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
          <span className="flex-1 text-sm text-gray-600 truncate text-left">{url}</span>
          <button
            onClick={handleCopy}
            className="shrink-0 px-3 py-1.5 text-xs font-semibold bg-[#1a2b5e] hover:bg-[#142248] text-white rounded-lg transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  )
}
