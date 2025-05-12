"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, AlertCircle, FileText, Move, ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ContractObject } from "@/lib/types"

interface SimplePdfViewerProps {
  file: File
  objects: ContractObject[]
  currentPage: number
  setCurrentPage: (page: number) => void
  onPageChange?: (page: number) => void
  onSetNumPages?: (pages: number) => void
  onObjectMove?: (id: string, position: { x: number; y: number }) => void
  onObjectResize?: (id: string, size: { width: number; height: number }) => void
}

export default function SimplePdfViewer({
  file,
  objects,
  currentPage,
  setCurrentPage,
  onPageChange,
  onSetNumPages,
  onObjectMove,
  onObjectResize,
}: SimplePdfViewerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(5) // Default to 5 pages for demo
  const [scale, setScale] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)
  const [draggingObject, setDraggingObject] = useState<string | null>(null)
  const [resizingObject, setResizingObject] = useState<string | null>(null)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [startSize, setStartSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    // Simulate loading and page counting
    const timer = setTimeout(() => {
      setLoading(false)
      // In a real implementation, we would count pages from the PDF
      // For now, we'll just use a random number between 1-10
      const estimatedPages = Math.max(1, Math.floor(Math.random() * 10) + 1)
      setTotalPages(estimatedPages)
      if (onSetNumPages) {
        onSetNumPages(estimatedPages)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [file, onSetNumPages])

  const goToPrevPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1
      setCurrentPage(newPage)
      if (onPageChange) {
        onPageChange(newPage)
      }
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1
      setCurrentPage(newPage)
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
        <div
          className="relative flex items-center justify-center p-8"
          style={{ transform: `scale(${scale})`, transformOrigin: "center top" }}
        >
          <div className="bg-gray-100 w-full aspect-[1/1.4] rounded-lg shadow-xl flex flex-col items-center justify-center relative">
            {/* Page content placeholder */}
            <div className="absolute inset-0 p-8">
              <div className="w-full h-8 bg-gray-200 rounded mb-4"></div>
              <div className="w-3/4 h-8 bg-gray-200 rounded mb-8"></div>

              <div className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="w-full h-4 bg-gray-200 rounded"></div>
                ))}
              </div>

              <div className="mt-8 space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="w-full h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>

            <div className="z-10">
              <FileText className="h-16 w-16 text-gray-400 mb-4 opacity-20" />
              <p className="text-gray-500 text-center">
                <span className="text-sm">Page {currentPage}</span>
              </p>
            </div>

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

                {draggingObject === object.id && (
                  <div className="absolute top-0 right-0 -mt-6 -mr-2 bg-blue-500 text-white rounded-full p-1">
                    <Move className="h-3 w-3" />
                  </div>
                )}
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
