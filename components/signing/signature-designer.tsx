"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  FilePenLineIcon as Signature,
  FileText,
  Calendar,
  Type,
  AlertCircle,
  User,
  ZoomIn,
  ZoomOut,
  Loader2,
  X,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { motion } from "framer-motion"
import { Document, Page, pdfjs } from "react-pdf"
import type { Signer, SignatureField } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

interface SignatureDesignerProps {
  file: File | null
  pdfUrl: string | null
  pdfBase64: string | null
  currentSigner: Signer | null
  onAddField: (field: SignatureField) => void
  existingFields: SignatureField[]
}

export default function SignatureDesigner({
  file,
  pdfUrl,
  pdfBase64,
  currentSigner,
  onAddField,
  existingFields,
}: SignatureDesignerProps) {
  const [fields, setFields] = useState<SignatureField[]>([])
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [numPages, setNumPages] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [loading, setLoading] = useState(true)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [activeResizeId, setActiveResizeId] = useState<string | null>(null)
  const initializedRef = useRef(false)
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 })
  const [fieldStartPos, setFieldStartPos] = useState({ x: 0, y: 0 })
  const [fieldStartSize, setFieldStartSize] = useState({ width: 0, height: 0 })
  const [hoveredFieldId, setHoveredFieldId] = useState<string | null>(null)
  const [showClearDialog, setShowClearDialog] = useState(false)
  const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 })

  // Initialize fields from existing fields only once
  useEffect(() => {
    if (!initializedRef.current) {
      setFields(existingFields)
      initializedRef.current = true
    }
  }, [existingFields])

  // Use a memoized function to generate unique IDs
  const generateUniqueId = useCallback(() => {
    return `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }, [])

  // Handle document load success
  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setLoading(false)
  }, [])

  // Handle page load success to get dimensions
  const onPageLoadSuccess = useCallback(({ width, height }: { width: number; height: number }) => {
    setPdfDimensions({ width, height })
  }, [])

  // Handle document load error
  const onDocumentLoadError = useCallback((error: Error) => {
    console.error("Error loading PDF:", error)
    setError(`Failed to load PDF: ${error.message}`)
    setLoading(false)
  }, [])

  // Handle document click to add a new field
  const handleDocumentClick = useCallback(
    (e: React.MouseEvent) => {
      if (selectedTool && containerRef.current && currentSigner) {
        const rect = containerRef.current.getBoundingClientRect()
        const x = (e.clientX - rect.left) / scale
        const y = (e.clientY - rect.top) / scale

        console.log("Click detected at:", { x, y })

        // Create the field object
        const newField: SignatureField = {
          id: generateUniqueId(),
          type: selectedTool,
          position: { x, y },
          size: { width: selectedTool === "signature" ? 200 : 150, height: selectedTool === "signature" ? 80 : 40 },
          page: currentPage,
          signerId: currentSigner.id,
        }

        // Update local state
        setFields((prevFields) => [...prevFields, newField])

        // Notify parent component
        onAddField(newField)
        setSelectedTool(null)
      }
    },
    [selectedTool, currentPage, currentSigner, generateUniqueId, onAddField, scale],
  )

  // Handle field move with laggy effect
  const handleFieldMove = useCallback(
    (id: string, position: { x: number; y: number }) => {
      // Add a slight delay for laggy effect
      setTimeout(() => {
        setFields((prevFields) => {
          const updatedFields = prevFields.map((field) => (field.id === id ? { ...field, position } : field))
          return updatedFields
        })

        // Find the field and notify parent
        const fieldToUpdate = fields.find((field) => field.id === id)
        if (fieldToUpdate) {
          const updatedField = { ...fieldToUpdate, position }
          onAddField(updatedField)
        }
      }, 50) // 50ms delay for laggy effect
    },
    [fields, onAddField],
  )

  // Handle field resize with laggy effect
  const handleFieldResize = useCallback(
    (id: string, size: { width: number; height: number }) => {
      // Add a slight delay for laggy effect
      setTimeout(() => {
        setFields((prevFields) => {
          const updatedFields = prevFields.map((field) => (field.id === id ? { ...field, size } : field))
          return updatedFields
        })

        // Find the field and notify parent
        const fieldToUpdate = fields.find((field) => field.id === id)
        if (fieldToUpdate) {
          const updatedField = { ...fieldToUpdate, size }
          onAddField(updatedField)
        }
      }, 50) // 50ms delay for laggy effect
    },
    [fields, onAddField],
  )

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

  const handleOpenPdfInNewTab = useCallback(() => {
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
  }, [pdfUrl, pdfBase64])

  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.1, 2))
  }, [])

  const zoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev - 0.1, 0.5))
  }, [])

  // Delete a field
  const handleDeleteField = useCallback(
    (id: string) => {
      setFields((prevFields) => prevFields.filter((field) => field.id !== id))

      // Notify parent component about the deletion
      // We can use the same onAddField function but with a special flag or just remove it from the parent's state
      const fieldToDelete = fields.find((field) => field.id === id)
      if (fieldToDelete) {
        // Mark the field for deletion (you might need to modify your parent component to handle this)
        onAddField({ ...fieldToDelete, isDeleted: true })
      }
    },
    [fields, onAddField],
  )

  // Clear all fields
  const handleClearAllFields = useCallback(() => {
    // Clear all fields for the current signer
    setFields((prevFields) => prevFields.filter((field) => field.signerId !== currentSigner?.id))
    setShowClearDialog(false)

    // Notify parent component about clearing all fields
    if (currentSigner) {
      existingFields
        .filter((field) => field.signerId === currentSigner.id)
        .forEach((field) => {
          onAddField({ ...field, isDeleted: true })
        })
    }
  }, [currentSigner, existingFields, onAddField])

  // Render loading state
  const renderLoading = useCallback(
    () => (
      <div className="flex flex-col items-center justify-center h-full bg-gray-100/50">
        <Loader2 className="h-12 w-12 text-amber-600 animate-spin mb-4" />
        <p className="text-amber-800">Loading document...</p>
      </div>
    ),
    [],
  )

  // Render error state
  const renderError = useCallback(
    () => (
      <div className="flex flex-col items-center justify-center h-full bg-red-100/30">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-red-800 mb-2">Failed to load PDF</h3>
        <p className="text-red-700 text-center max-w-md mb-4">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenPdfInNewTab}
          className="bg-amber-700 border-amber-600 text-white hover:bg-amber-800 rounded-lg"
        >
          Open PDF in New Tab
        </Button>
      </div>
    ),
    [error, handleOpenPdfInNewTab],
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
          <h3 className="text-lg font-medium text-amber-800 mb-4">Signature Tools</h3>

          <div className="space-y-3">
            <Button
              variant="outline"
              className={`w-full justify-start rounded-lg ${
                selectedTool === "signature"
                  ? "bg-amber-700/50 border-amber-600 text-white"
                  : "bg-amber-800/20 border-amber-700/30 text-white hover:bg-amber-800/30"
              }`}
              onClick={() => setSelectedTool(selectedTool === "signature" ? null : "signature")}
            >
              <Signature className="h-4 w-4 mr-2" />
              Signature
            </Button>

            <Button
              variant="outline"
              className={`w-full justify-start rounded-lg ${
                selectedTool === "date"
                  ? "bg-amber-700/50 border-amber-600 text-white"
                  : "bg-amber-800/20 border-amber-700/30 text-white hover:bg-amber-800/30"
              }`}
              onClick={() => setSelectedTool(selectedTool === "date" ? null : "date")}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Date
            </Button>

            <Button
              variant="outline"
              className={`w-full justify-start rounded-lg ${
                selectedTool === "text"
                  ? "bg-amber-700/50 border-amber-600 text-white"
                  : "bg-amber-800/20 border-amber-700/30 text-white hover:bg-amber-800/30"
              }`}
              onClick={() => setSelectedTool(selectedTool === "text" ? null : "text")}
            >
              <Type className="h-4 w-4 mr-2" />
              Text
            </Button>
          </div>

          {selectedTool && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-amber-700/20 rounded-lg border border-amber-700/30"
            >
              <p className="text-sm text-amber-300 mb-2">
                <span className="font-medium">Selected:</span>{" "}
                {selectedTool.charAt(0).toUpperCase() + selectedTool.slice(1)}
              </p>
              <p className="text-xs text-amber-200/70">Click on the document to place the field</p>
            </motion.div>
          )}

          <div className="mt-6">
            <h4 className="text-sm font-medium text-amber-800 mb-2">Current Signer</h4>
            {currentSigner && (
              <div className="bg-amber-800/20 p-3 rounded-lg border border-amber-700/30">
                <div className="flex items-center">
                  <div className="bg-amber-700/30 p-2 rounded-full mr-2">
                    <User className="h-3 w-3 text-amber-700" />
                  </div>
                  <div>
                    <p className="text-sm text-amber-800">{currentSigner.name}</p>
                    <p className="text-xs text-amber-700">{currentSigner.email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-amber-800">Fields on Page {currentPage}</h4>

              {fields.filter((f) => f.page === currentPage && f.signerId === currentSigner?.id).length > 0 && (
                <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-red-800/20 border-red-700/30 text-red-100 hover:bg-red-800/30 rounded-lg h-7 px-2"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Clear All
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-amber-50 border-amber-300">
                    <DialogHeader>
                      <DialogTitle className="text-amber-900">Clear All Fields</DialogTitle>
                    </DialogHeader>
                    <p className="text-amber-800">
                      Are you sure you want to remove all signature fields? This action cannot be undone.
                    </p>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowClearDialog(false)}
                        className="bg-amber-800/20 border-amber-700/30 text-amber-100 hover:bg-amber-800/30 rounded-lg"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleClearAllFields}
                        className="bg-red-600 hover:bg-red-700 rounded-lg"
                      >
                        Clear All Fields
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {fields.filter((f) => f.page === currentPage && f.signerId === currentSigner?.id).length === 0 ? (
              <p className="text-xs text-amber-700">No fields added yet</p>
            ) : (
              <div className="space-y-2">
                {fields
                  .filter((f) => f.page === currentPage && f.signerId === currentSigner?.id)
                  .map((field) => (
                    <div
                      key={field.id}
                      className={`bg-amber-100 p-2 rounded-lg border ${
                        hoveredFieldId === field.id ? "border-amber-500" : "border-amber-300"
                      } text-xs flex justify-between items-center`}
                      onMouseEnter={() => setHoveredFieldId(field.id)}
                      onMouseLeave={() => setHoveredFieldId(null)}
                    >
                      <span className="text-amber-800">
                        {field.type.charAt(0).toUpperCase() + field.type.slice(1)} Field
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteField(field.id)}
                        className="h-5 w-5 p-0 text-amber-700 hover:text-red-600 hover:bg-red-100 rounded-full"
                      >
                        <X className="h-3 w-3" />
                      </Button>
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
                className="bg-amber-800/20 border-amber-700/30 text-amber-100 hover:bg-amber-800/30 rounded-lg"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-amber-800">{Math.round(scale * 100)}%</span>
              <Button
                variant="outline"
                size="sm"
                onClick={zoomIn}
                className="bg-amber-800/20 border-amber-700/30 text-amber-100 hover:bg-amber-800/30 rounded-lg"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            <h3 className="text-lg font-medium text-amber-800">Document Preview</h3>

            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenPdfInNewTab}
              className="bg-amber-800/20 border-amber-700/30 text-amber-100 hover:bg-amber-800/30 rounded-lg"
            >
              <FileText className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
          </div>

          <div
            ref={containerRef}
            className="relative w-full border border-amber-700/30 rounded-lg shadow-lg overflow-auto bg-white"
            style={{ height: "70vh" }}
          >
            {/* PDF Viewer using react-pdf */}
            <div
              className="relative"
              style={{
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
              onClick={selectedTool ? handleDocumentClick : undefined}
            >
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
                    onLoadSuccess={onPageLoadSuccess}
                  />
                </Document>
              )}

              {/* Signature fields overlay */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Current signer's fields */}
                {fields
                  .filter((field) => field.page === currentPage && field.signerId === currentSigner?.id)
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
                        damping: 15,
                        stiffness: 100,
                        mass: 1.5,
                      }}
                      className={`absolute bg-white/90 border-2 ${
                        activeDragId === field.id || activeResizeId === field.id || hoveredFieldId === field.id
                          ? "border-amber-500 shadow-lg"
                          : "border-amber-700"
                      } rounded-lg shadow-md p-2 pointer-events-auto cursor-move`}
                      onMouseDown={(e) => handleMouseDown(e, field.id)}
                    >
                      {field.type === "signature" && (
                        <div className="h-full flex items-center justify-center border-2 border-dashed border-amber-600 text-sm">
                          <Signature className="h-5 w-5 text-amber-700 mr-2" />
                          <span className="text-amber-800">Signature</span>
                        </div>
                      )}
                      {field.type === "date" && (
                        <div className="h-full flex items-center text-sm">
                          <Calendar className="h-4 w-4 text-amber-700 mr-2" />
                          <span className="text-amber-800">Date: {new Date().toLocaleDateString()}</span>
                        </div>
                      )}
                      {field.type === "text" && (
                        <div className="h-full flex items-center overflow-hidden text-sm">
                          <Type className="h-4 w-4 text-amber-700 mr-2" />
                          <span className="text-amber-800">Text Field</span>
                        </div>
                      )}

                      {/* Resize handle */}
                      <div
                        className="absolute bottom-0 right-0 w-4 h-4 bg-amber-700 cursor-se-resize rounded-tl-md pointer-events-auto"
                        onMouseDown={(e) => {
                          e.stopPropagation()
                          handleMouseDown(e, field.id, true)
                        }}
                      />
                    </motion.div>
                  ))}

                {/* Other signers' fields (shown as locked) */}
                {fields
                  .filter((field) => field.page === currentPage && field.signerId !== currentSigner?.id)
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
                      <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-400 text-sm">
                        {field.type === "signature" && (
                          <>
                            <Signature className="h-5 w-5 text-gray-500 mr-2" />
                            <span className="text-gray-700">Other Signer's Field</span>
                          </>
                        )}
                        {field.type === "date" && (
                          <>
                            <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                            <span className="text-gray-700">Other Signer's Date</span>
                          </>
                        )}
                        {field.type === "text" && (
                          <>
                            <Type className="h-4 w-4 text-gray-500 mr-2" />
                            <span className="text-gray-700">Other Signer's Text</span>
                          </>
                        )}
                      </div>
                    </div>
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
              className="bg-amber-800/20 border-amber-700/30 text-amber-100 hover:bg-amber-800/30 rounded-lg"
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
              className="bg-amber-800/20 border-amber-700/30 text-amber-100 hover:bg-amber-800/30 rounded-lg"
            >
              Next Page
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
