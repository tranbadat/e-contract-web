"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ContractObject } from "@/lib/types"

interface SimpleIframeViewerProps {
  file: File
  objects: ContractObject[]
  currentPage: number
  setCurrentPage: (page: number) => void
  onObjectMove: (id: string, position: { x: number; y: number }) => void
  onObjectResize: (id: string, size: { width: number; height: number }) => void
}

export default function SimpleIframeViewer({
  file,
  objects,
  currentPage,
  setCurrentPage,
  onObjectMove,
  onObjectResize,
}: SimpleIframeViewerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(5) // Default estimate

  // Create object URL for the PDF
  useEffect(() => {
    try {
      const url = URL.createObjectURL(file)
      setPdfUrl(url)
      setLoading(false)

      // Clean up
      return () => {
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error("Error creating object URL:", err)
      setError("Could not process the uploaded file")
      setLoading(false)
    }
  }, [file])

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  // Handle object dragging
  const handleMouseDown = (e: React.MouseEvent, objectId: string, isResize = false) => {
    e.preventDefault()

    const startX = e.clientX
    const startY = e.clientY

    const object = objects.find((obj) => obj.id === objectId)
    if (!object) return

    const startPosition = { ...object.position }
    const startSize = { ...object.size }

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (isResize) {
        // Handle resize
        const deltaX = moveEvent.clientX - startX
        const deltaY = moveEvent.clientY - startY

        onObjectResize(objectId, {
          width: Math.max(50, startSize.width + deltaX),
          height: Math.max(30, startSize.height + deltaY),
        })
      } else {
        // Handle move
        const deltaX = moveEvent.clientX - startX
        const deltaY = moveEvent.clientY - startY

        onObjectMove(objectId, {
          x: startPosition.x + deltaX,
          y: startPosition.y + deltaY,
        })
      }
    }

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[500px] bg-black/20 rounded-xl">
        <motion.div
          animate={{
            opacity: [0.5, 1, 0.5],
            scale: [0.98, 1, 0.98],
          }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: 1.5,
          }}
          className="text-blue-400 text-center"
        >
          <div className="h-16 w-16 rounded-full border-4 border-t-transparent border-blue-500 animate-spin mx-auto mb-4"></div>
          <p>Loading document...</p>
        </motion.div>
      </div>
    )
  }

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
      <div className="flex justify-between w-full mb-4">
        <div></div>
        <div className="text-white font-medium">Page {currentPage}</div>
      </div>

      <div className="relative w-full border border-blue-400/30 rounded-lg shadow-lg overflow-hidden bg-white">
        {/* PDF Viewer */}
        <div className="relative" style={{ height: "70vh" }}>
          {pdfUrl && <iframe src={pdfUrl} className="w-full h-full" title="PDF Viewer" style={{ border: "none" }} />}

          {/* Overlay for objects */}
          <div className="absolute inset-0 pointer-events-none">
            {objects.map((object) => (
              <div
                key={object.id}
                className="absolute bg-white/90 border border-blue-400 rounded shadow-md p-2 pointer-events-auto cursor-move"
                style={{
                  left: `${object.position.x}px`,
                  top: `${object.position.y}px`,
                  width: `${object.size.width}px`,
                  height: `${object.size.height}px`,
                  zIndex: 10,
                }}
                onMouseDown={(e) => handleMouseDown(e, object.id)}
              >
                {object.type === "text" && (
                  <div className="h-full flex items-center overflow-hidden text-sm">{object.content || "Text"}</div>
                )}
                {object.type === "date" && (
                  <div className="h-full flex items-center text-sm">{new Date().toLocaleDateString()}</div>
                )}
                {object.type === "photo" && (
                  <div className="h-full flex items-center justify-center bg-gray-100 text-sm">Image</div>
                )}
                {object.type === "signature" && (
                  <div className="h-full flex items-center justify-center border-2 border-dashed border-blue-400 text-sm">
                    Signature
                  </div>
                )}

                {/* Resize handle */}
                <div
                  className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-se-resize rounded-tl-md pointer-events-auto"
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    handleMouseDown(e, object.id, true)
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-4 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={goToPrevPage}
          disabled={currentPage <= 1}
          className="bg-blue-600/80 border-blue-400 text-white hover:bg-blue-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={goToNextPage}
          className="bg-blue-600/80 border-blue-400 text-white hover:bg-blue-700"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
