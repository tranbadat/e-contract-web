"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, AlertCircle, ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ContractObject } from "@/lib/types"

interface PdfViewerProps {
  file: File
  objects: ContractObject[]
  currentPage: number
  setCurrentPage: (page: number) => void
  onPageChange?: (page: number) => void
  onSetNumPages?: (pages: number) => void
  onObjectMove?: (id: string, position: { x: number; y: number }) => void
  onObjectResize?: (id: string, size: { width: number; height: number }) => void
}

export default function PdfViewer({
  file,
  objects,
  currentPage,
  setCurrentPage,
  onPageChange,
  onSetNumPages,
  onObjectMove,
  onObjectResize,
}: PdfViewerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(1)
  const [scale, setScale] = useState(1)
  const [pdfData, setPdfData] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [draggingObject, setDraggingObject] = useState<string | null>(null)
  const [resizingObject, setResizingObject] = useState<string | null>(null)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [startSize, setStartSize] = useState({ width: 0, height: 0 })
  const [pdfDocument, setPdfDocument] = useState<any>(null)
  const [renderedPage, setRenderedPage] = useState<number | null>(null)

  // Load the PDF.js library dynamically
  useEffect(() => {
    const loadPdfJs = async () => {
      try {
        // Try to load PDF.js from CDN
        const pdfjsLib = await import("https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/+esm")

        // Set the worker source
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.worker.min.js"

        return pdfjsLib
      } catch (err) {
        console.error("Failed to load PDF.js:", err)
        setError("Could not load PDF viewer library")
        return null
      }
    }

    // Load the PDF file
    const loadPdf = async () => {
      setLoading(true)
      setError(null)

      try {
        // Create a URL for the file
        const url = URL.createObjectURL(file)
        setPdfData(url)

        const pdfjsLib = await loadPdfJs()
        if (!pdfjsLib) {
          throw new Error("PDF.js library could not be loaded")
        }

        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument(url)
        const pdf = await loadingTask.promise
        setPdfDocument(pdf)

        // Set total pages
        const numPages = pdf.numPages
        setTotalPages(numPages)
        if (onSetNumPages) {
          onSetNumPages(numPages)
        }

        setLoading(false)
      } catch (err) {
        console.error("Error loading PDF:", err)
        setError(`Could not load PDF: ${err instanceof Error ? err.message : String(err)}`)
        setLoading(false)
      }
    }

    loadPdf()

    // Clean up
    return () => {
      if (pdfData) {
        URL.revokeObjectURL(pdfData)
      }
    }
  }, [file, onSetNumPages])

  // Render the current page when it changes
  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDocument || !canvasRef.current || renderedPage === currentPage) return

      try {
        const page = await pdfDocument.getPage(currentPage)
        const viewport = page.getViewport({ scale })

        const canvas = canvasRef.current
        const context = canvas.getContext("2d")

        canvas.height = viewport.height
        canvas.width = viewport.width

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        }

        await page.render(renderContext).promise
        setRenderedPage(currentPage)
      } catch (err) {
        console.error("Error rendering page:", err)
      }
    }

    if (pdfDocument && !loading) {
      renderPage()
    }
  }, [pdfDocument, currentPage, scale, loading, renderedPage])

  // Re-render when scale changes
  useEffect(() => {
    setRenderedPage(null) // Force re-render
  }, [scale])

  const goToPrevPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1
      setCurrentPage(newPage)
      setRenderedPage(null) // Force re-render
      if (onPageChange) {
        onPageChange(newPage)
      }
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1
      setCurrentPage(newPage)
      setRenderedPage(null) // Force re-render
      if (onPageChange) {
        onPageChange(newPage)
      }
    }
  }

  const zoomIn = () => {
    setScale(Math.min(scale + 0.1, 2))
  }

  const zoomOut = () => {
    setScale(Math.max(scale - 0.1, 0.5))
  }

  const handleMouseDown = (e: React.MouseEvent, objectId: string, isResize = false) => {
    e.preventDefault()
    e.stopPropagation()

    if (isResize) {
      setResizingObject(objectId)
      setStartPos({ x: e.clientX, y: e.clientY })

      const object = objects.find((obj) => obj.id === objectId)
      if (object) {
        setStartSize({ width: object.size.width, height: object.size.height })
      }
    } else {
      setDraggingObject(objectId)
      setStartPos({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingObject && onObjectMove) {
      const deltaX = e.clientX - startPos.x
      const deltaY = e.clientY - startPos.y

      const object = objects.find((obj) => obj.id === draggingObject)
      if (object) {
        onObjectMove(draggingObject, {
          x: object.position.x + deltaX,
          y: object.position.y + deltaY,
        })
        setStartPos({ x: e.clientX, y: e.clientY })
      }
    } else if (resizingObject && onObjectResize) {
      const deltaX = e.clientX - startPos.x
      const deltaY = e.clientY - startPos.y

      const object = objects.find((obj) => obj.id === resizingObject)
      if (object) {
        onObjectResize(resizingObject, {
          width: Math.max(50, startSize.width + deltaX),
          height: Math.max(30, startSize.height + deltaY),
        })
      }
    }
  }

  const handleMouseUp = () => {
    setDraggingObject(null)
    setResizingObject(null)
  }

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp)
    return () => {
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [])

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
          className="text-purple-400 text-center"
        >
          <div className="h-16 w-16 rounded-full border-4 border-t-transparent border-purple-500 animate-spin mx-auto mb-4"></div>
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
        <div className="mt-4">
          <Button
            variant="outline"
            className="bg-black/50 border-purple-500 text-white hover:bg-purple-950"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      <div className="flex justify-between w-full mb-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={zoomOut}
            className="bg-black/50 border-purple-500/50 text-white hover:bg-purple-950"
          >
            <ZoomOut className="h-4 w-4 mr-1" />
            Zoom -
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={zoomIn}
            className="bg-black/50 border-purple-500/50 text-white hover:bg-purple-950"
          >
            <ZoomIn className="h-4 w-4 mr-1" />
            Zoom +
          </Button>
        </div>
        <div className="text-white">
          Page {currentPage} of {totalPages}
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative overflow-auto max-h-[70vh] w-full border border-purple-500/20 rounded-lg bg-white"
        onMouseMove={handleMouseMove}
      >
        <div className="relative flex items-center justify-center p-4">
          <div className="relative">
            <canvas ref={canvasRef} className="shadow-xl" />

            {/* Contract objects */}
            {objects.map((object) => (
              <div
                key={object.id}
                className={`absolute bg-white border ${
                  draggingObject === object.id ? "border-blue-500" : "border-purple-400"
                } rounded shadow-md p-2 cursor-move`}
                style={{
                  left: `${object.position.x}px`,
                  top: `${object.position.y}px`,
                  width: `${object.size.width}px`,
                  height: `${object.size.height}px`,
                  zIndex: draggingObject === object.id || resizingObject === object.id ? 100 : 10,
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
                  <div className="h-full flex items-center justify-center border-2 border-dashed border-purple-400 text-sm">
                    Signature
                  </div>
                )}

                {/* Resize handle */}
                <div
                  className="absolute bottom-0 right-0 w-4 h-4 bg-purple-500 cursor-se-resize rounded-tl-md"
                  onMouseDown={(e) => handleMouseDown(e, object.id, true)}
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
          className="bg-black/50 border-purple-500/50 text-white hover:bg-purple-950"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={goToNextPage}
          disabled={currentPage >= totalPages}
          className="bg-black/50 border-purple-500/50 text-white hover:bg-purple-950"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
