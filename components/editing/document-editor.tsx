"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { FileText, Type, CheckSquare, ImageIcon, Lock, AlertCircle, ZoomIn, ZoomOut, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { motion } from "framer-motion"
import { Document, Page, pdfjs } from "react-pdf"
import type { DocumentField, SignatureField } from "@/lib/types"

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

interface DocumentEditorProps {
  file: File | null
  pdfUrl: string | null
  pdfBase64: string | null
}

export default function DocumentEditor({ file, pdfUrl, pdfBase64 }: DocumentEditorProps) {
  const [fields, setFields] = useState<DocumentField[]>([])
  const [signatureFields, setSignatureFields] = useState<SignatureField[]>([])
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [numPages, setNumPages] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [loading, setLoading] = useState(true)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [activeResizeId, setActiveResizeId] = useState<string | null>(null)
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 })
  const [fieldStartPos, setFieldStartPos] = useState({ x: 0, y: 0 })
  const [fieldStartSize, setFieldStartSize] = useState({ width: 0, height: 0 })

  // Generate unique ID
  const generateUniqueId = useCallback(() => {
    return `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }, [])

  // Handle document load success
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setLoading(false)
  }

  // Handle document load error
  const onDocumentLoadError = (error: Error) => {
    console.error("Error loading PDF:", error)
    setError(`Failed to load PDF: ${error.message}`)
    setLoading(false)
  }

  // Update the handleAddField function to ensure unique IDs
  const handleAddField = useCallback(
    (type: string) => {
      const newField: DocumentField = {
        id: generateUniqueId(),
        type,
        position: { x: 100, y: 100 },
        size: {
          width: type === "checkbox" ? 40 : 150,
          height: type === "checkbox" ? 40 : 40,
        },
        page: currentPage,
        content: type === "text" ? "Edit this text" : "",
      }

      setFields((prevFields) => [...prevFields, newField])
      setSelectedTool(null)
    },
    [currentPage, generateUniqueId],
  )

  // Handle field move with laggy effect
  const handleFieldMove = useCallback((id: string, position: { x: number; y: number }) => {
    // Add a slight delay for laggy effect
    setTimeout(() => {
      setFields((prevFields) => prevFields.map((field) => (field.id === id ? { ...field, position } : field)))
    }, 50) // 50ms delay for laggy effect
  }, [])

  // Handle field resize with laggy effect
  const handleFieldResize = useCallback((id: string, size: { width: number; height: number }) => {
    // Add a slight delay for laggy effect
    setTimeout(() => {
      setFields((prevFields) => prevFields.map((field) => (field.id === id ? { ...field, size } : field)))
    }, 50) // 50ms delay for laggy effect
  }, [])

  // Handle mouse down for dragging or resizing
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, fieldId: string, isResize = false) => {
      e.preventDefault()
      e.stopPropagation()

      const field = fields.find((f) => f.id === fieldId)
      if (!field) return

      setDragStartPos({ x: e.clientX, y: e.clientY })
      setFieldStartPos({ ...field.position })
      setFieldStartSize({ ...field.size })

      if (isResize) {
        setActiveResizeId(fieldId)
      } else {
        setActiveDragId(fieldId)
      }
    },
    [fields],
  )

  // Handle mouse move for dragging or resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (activeDragId) {
        const deltaX = (e.clientX - dragStartPos.x) / scale
        const deltaY = (e.clientY - dragStartPos.y) / scale

        handleFieldMove(activeDragId, {
          x: fieldStartPos.x + deltaX,
          y: fieldStartPos.y + deltaY,
        })
      } else if (activeResizeId) {
        const deltaX = (e.clientX - dragStartPos.x) / scale
        const deltaY = (e.clientY - dragStartPos.y) / scale

        handleFieldResize(activeResizeId, {
          width: Math.max(50, fieldStartSize.width + deltaX),
          height: Math.max(30, fieldStartSize.height + deltaY),
        })
      }
    }

    const handleMouseUp = () => {
      setActiveDragId(null)
      setActiveResizeId(null)
    }

    if (activeDragId || activeResizeId) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [
    activeDragId,
    activeResizeId,
    dragStartPos,
    fieldStartPos,
    fieldStartSize,
    handleFieldMove,
    handleFieldResize,
    scale,
  ])

  const handleOpenPdfInNewTab = () => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank")
    } else if (pdfBase64) {
      const newWindow = window.open()
      if (newWindow) {
        newWindow.document.write(`
          <iframe width="100%" height="100%" src="${pdfBase64}"></iframe>
        `)
      }
    }
  }

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.1, 2))
  }

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.1, 0.5))
  }

  const handleDocumentClick = useCallback(
    (e: React.MouseEvent) => {
      if (selectedTool && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const x = (e.clientX - rect.left) / scale
        const y = (e.clientY - rect.top) / scale

        console.log("Click detected at:", { x, y })

        // Check if we're trying to place a field over a signature field
        const isOverSignatureField = signatureFields
          .filter((f) => f.page === currentPage)
          .some((field) => {
            return (
              x >= field.position.x &&
              x <= field.position.x + field.size.width &&
              y >= field.position.y &&
              y <= field.position.y + field.size.height
            )
          })

        if (isOverSignatureField) {
          setError("Cannot place fields over signature areas")
          setTimeout(() => setError(null), 3000)
          return
        }

        handleAddField(selectedTool)
      }
    },
    [selectedTool, currentPage, signatureFields, handleAddField, scale],
  )

  // Render loading state
  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center h-full bg-gray-100/50">
      <Loader2 className="h-12 w-12 text-emerald-600 animate-spin mb-4" />
      <p className="text-emerald-800">Loading document...</p>
    </div>
  )

  // Render error state
  const renderError = () => (
    <div className="flex flex-col items-center justify-center h-full bg-red-100/30">
      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      <h3 className="text-lg font-medium text-red-800 mb-2">Failed to load PDF</h3>
      <p className="text-red-700 text-center max-w-md mb-4">{error}</p>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpenPdfInNewTab}
        className="bg-emerald-700 border-emerald-600 text-white hover:bg-emerald-800 rounded-lg"
      >
        Open PDF in New Tab
      </Button>
    </div>
  )

  return (
    <div className="flex flex-col">
      {error && !loading && (
        <Alert variant="destructive" className="mb-6 bg-red-700/20 border-red-700/30 text-white rounded-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tools panel */}
        <div className="lg:w-64 earth-card">
          <h3 className="text-lg font-medium text-amber-800 mb-4">Editing Tools</h3>

          <div className="space-y-3">
            <Button
              variant="outline"
              className={`w-full justify-start rounded-lg ${
                selectedTool === "text"
                  ? "bg-emerald-700/50 border-emerald-600 text-white"
                  : "bg-emerald-800/20 border-emerald-700/30 text-white hover:bg-emerald-800/30"
              }`}
              onClick={() => setSelectedTool(selectedTool === "text" ? null : "text")}
            >
              <Type className="h-4 w-4 mr-2" />
              Text Field
            </Button>

            <Button
              variant="outline"
              className={`w-full justify-start rounded-lg ${
                selectedTool === "checkbox"
                  ? "bg-emerald-700/50 border-emerald-600 text-white"
                  : "bg-emerald-800/20 border-emerald-700/30 text-white hover:bg-emerald-800/30"
              }`}
              onClick={() => setSelectedTool(selectedTool === "checkbox" ? null : "checkbox")}
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              Checkbox
            </Button>

            <Button
              variant="outline"
              className={`w-full justify-start rounded-lg ${
                selectedTool === "image"
                  ? "bg-emerald-700/50 border-emerald-600 text-white"
                  : "bg-emerald-800/20 border-emerald-700/30 text-white hover:bg-emerald-800/30"
              }`}
              onClick={() => setSelectedTool(selectedTool === "image" ? null : "image")}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Image
            </Button>
          </div>

          {selectedTool && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-emerald-700/20 rounded-lg border border-emerald-700/30"
            >
              <p className="text-sm text-emerald-300 mb-2">
                <span className="font-medium">Selected:</span>{" "}
                {selectedTool.charAt(0).toUpperCase() + selectedTool.slice(1)}
              </p>
              <p className="text-xs text-emerald-200/70">Click on the document to place the field</p>
            </motion.div>
          )}

          <div className="mt-6">
            <h4 className="text-sm font-medium text-amber-800 mb-2">Fields on Page {currentPage}</h4>
            {fields.filter((f) => f.page === currentPage).length === 0 &&
            signatureFields.filter((f) => f.page === currentPage).length === 0 ? (
              <p className="text-xs text-amber-700">No fields added yet</p>
            ) : (
              <div className="space-y-2">
                {signatureFields
                  .filter((f) => f.page === currentPage)
                  .map((field) => (
                    <div
                      key={field.id}
                      className="bg-amber-800/20 p-2 rounded-lg border border-amber-700/30 text-xs text-amber-100 flex items-center"
                    >
                      <Lock className="h-3 w-3 mr-1 text-amber-400" />
                      Signature Field (Locked)
                    </div>
                  ))}
                {fields
                  .filter((f) => f.page === currentPage)
                  .map((field) => (
                    <div
                      key={field.id}
                      className="bg-emerald-800/20 p-2 rounded-lg border border-emerald-700/30 text-xs text-emerald-100"
                    >
                      {field.type.charAt(0).toUpperCase() + field.type.slice(1)} Field
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Document preview */}
        <div className="flex-1 earth-card">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={zoomOut}
                className="bg-emerald-800/20 border-emerald-700/30 text-emerald-100 hover:bg-emerald-800/30 rounded-lg"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-emerald-800">{Math.round(scale * 100)}%</span>
              <Button
                variant="outline"
                size="sm"
                onClick={zoomIn}
                className="bg-emerald-800/20 border-emerald-700/30 text-emerald-100 hover:bg-emerald-800/30 rounded-lg"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            <h3 className="text-lg font-medium text-amber-800">Document Preview</h3>

            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenPdfInNewTab}
              className="bg-emerald-800/20 border-emerald-700/30 text-emerald-100 hover:bg-emerald-800/30 rounded-lg"
            >
              <FileText className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
          </div>

          <div
            ref={containerRef}
            className="relative w-full border border-amber-700/30 rounded-lg shadow-lg overflow-auto bg-white"
            style={{ height: "70vh" }}
            onClick={selectedTool ? handleDocumentClick : undefined}
          >
            {/* PDF Viewer using react-pdf */}
            <div className="relative" style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
              {(pdfUrl || pdfBase64) && (
                <Document
                  file={pdfUrl || pdfBase64}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={renderLoading}
                  error={renderError}
                >
                  <Page
                    pageNumber={currentPage}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    className="shadow-md"
                    width={containerRef.current?.clientWidth ? containerRef.current.clientWidth / scale : undefined}
                  />
                </Document>
              )}

              {/* Fields overlay */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Signature fields (locked) */}
                {signatureFields
                  .filter((field) => field.page === currentPage)
                  .map((field) => (
                    <div
                      key={field.id}
                      className="absolute bg-gray-100/90 border-2 border-gray-400 rounded-lg shadow-md p-2 pointer-events-none"
                      style={{
                        left: `${field.position.x}px`,
                        top: `${field.position.y}px`,
                        width: `${field.size.width}px`,
                        height: `${field.size.height}px`,
                      }}
                    >
                      <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-400 text-sm relative">
                        <div className="absolute top-1 right-1 bg-gray-300 p-1 rounded-full">
                          <Lock className="h-3 w-3 text-gray-600" />
                        </div>
                        <div className="text-gray-500">Signature Field (Locked)</div>
                      </div>
                    </div>
                  ))}

                {/* Editable fields */}
                {fields
                  .filter((field) => field.page === currentPage)
                  .map((field) => (
                    <motion.div
                      key={field.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        x: field.position.x,
                        y: field.position.y,
                        width: field.size.width,
                        height: field.size.height,
                      }}
                      transition={{
                        type: "spring",
                        damping: 15, // Lower damping for more oscillation (laggy effect)
                        stiffness: 100, // Lower stiffness for slower movement
                        mass: 1.5, // Higher mass for more inertia
                      }}
                      className={`absolute bg-white/90 border-2 ${
                        activeDragId === field.id || activeResizeId === field.id
                          ? "border-emerald-500 shadow-lg"
                          : "border-emerald-700"
                      } rounded-lg shadow-md p-2 pointer-events-auto cursor-move`}
                      onMouseDown={(e) => handleMouseDown(e, field.id)}
                    >
                      {field.type === "text" && (
                        <div className="h-full flex items-center overflow-hidden text-sm">
                          <Type className="h-4 w-4 text-emerald-700 mr-2" />
                          Text Field
                        </div>
                      )}
                      {field.type === "checkbox" && (
                        <div className="h-full flex items-center justify-center">
                          <CheckSquare className="h-5 w-5 text-emerald-700" />
                        </div>
                      )}
                      {field.type === "image" && (
                        <div className="h-full flex items-center justify-center bg-gray-100 text-sm">
                          <ImageIcon className="h-5 w-5 text-emerald-700" />
                        </div>
                      )}

                      {/* Resize handle */}
                      <div
                        className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-700 cursor-se-resize rounded-tl-md pointer-events-auto"
                        onMouseDown={(e) => {
                          e.stopPropagation()
                          handleMouseDown(e, field.id, true)
                        }}
                      />
                    </motion.div>
                  ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="bg-emerald-800/20 border-emerald-700/30 text-emerald-100 hover:bg-emerald-800/30 rounded-lg"
            >
              Previous Page
            </Button>
            <div className="text-amber-800">
              Page {currentPage} of {numPages || 1}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
              disabled={currentPage >= numPages}
              className="bg-emerald-800/20 border-emerald-700/30 text-emerald-100 hover:bg-emerald-800/30 rounded-lg"
            >
              Next Page
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
