"use client"

import { useState, useEffect, useRef } from "react"
import { AlertCircle } from "lucide-react"
import type { ContractObject } from "@/lib/types"

interface FallbackViewerProps {
  file: File
  objects: ContractObject[]
  currentPage: number
}

export default function FallbackViewer({ file, objects, currentPage }: FallbackViewerProps) {
  const [error, setError] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // Only attempt to render the first page as a fallback
    if (!file || file.type !== "application/pdf") {
      setError("Only PDF files are supported")
      return
    }

    // Create a URL for the file
    const url = URL.createObjectURL(file)

    // Create a simple preview by rendering the first page to a canvas
    const renderPreview = async () => {
      try {
        // This is a very basic fallback that just shows a placeholder
        // In a real implementation, you might use a different PDF library
        // or server-side rendering to generate previews

        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext("2d")
          if (ctx) {
            // Clear canvas
            ctx.fillStyle = "#ffffff"
            ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height)

            // Draw a placeholder
            ctx.fillStyle = "#f0f0f0"
            ctx.fillRect(50, 50, canvasRef.current.width - 100, canvasRef.current.height - 100)

            // Add some text
            ctx.fillStyle = "#666666"
            ctx.font = "16px Arial"
            ctx.textAlign = "center"
            ctx.fillText("PDF Preview Unavailable", canvasRef.current.width / 2, canvasRef.current.height / 2)
            ctx.font = "14px Arial"
            ctx.fillText(file.name, canvasRef.current.width / 2, canvasRef.current.height / 2 + 30)
          }
        }
      } catch (err) {
        console.error("Error creating preview:", err)
        setError("Could not create document preview")
      }
    }

    renderPreview()

    // Clean up
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [file])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-black/30 rounded-xl backdrop-blur-sm border border-red-500/30 text-white">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Document Error</h3>
        <p className="text-center mb-4">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative overflow-auto max-h-[70vh] w-full border border-purple-500/20 rounded-lg bg-white">
        <div className="relative">
          <canvas ref={canvasRef} width={800} height={1100} className="mx-auto shadow-xl" />

          {/* We would render objects here in a real implementation */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/70 text-white px-4 py-2 rounded-lg">
              <p className="text-center">
                PDF viewer is currently unavailable.
                <br />
                Using simplified preview mode.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
