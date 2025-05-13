"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { FilePenLineIcon as Signature, FileText, Calendar, Type, AlertCircle, User } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { motion } from "framer-motion"
import type { Signer, SignatureField } from "@/lib/types"
import { v4 as uuidv4 } from "uuid"

interface SignatureDesignerProps {
  file: File | null
  pdfUrl: string | null
  currentSigner: Signer | null
  onAddField: (field: SignatureField) => void
  existingFields: SignatureField[]
}

export default function SignatureDesigner({
  file,
  pdfUrl,
  currentSigner,
  onAddField,
  existingFields,
}: SignatureDesignerProps) {
  const [fields, setFields] = useState<SignatureField[]>([])
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [viewMode, setViewMode] = useState<"object" | "embed" | "iframe" | "fallback">("object")
  const initializedRef = useRef(false)

  // Initialize fields from existing fields only once
  useEffect(() => {
    if (!initializedRef.current) {
      setFields(existingFields)
      initializedRef.current = true
    }
  }, [existingFields])

  // Try different PDF viewing methods
  useEffect(() => {
    if (!pdfUrl) return

    const tryViewModes = async () => {
      // Start with object tag
      setViewMode("object")

      // If object tag doesn't work after 2 seconds, try embed
      const timer1 = setTimeout(() => {
        setViewMode("embed")
      }, 2000)

      // If embed doesn't work after another 2 seconds, try iframe
      const timer2 = setTimeout(() => {
        setViewMode("iframe")
      }, 4000)

      // If iframe doesn't work after another 2 seconds, use fallback
      const timer3 = setTimeout(() => {
        setViewMode("fallback")
      }, 6000)

      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
        clearTimeout(timer3)
      }
    }

    tryViewModes()
  }, [pdfUrl])

  // Use a memoized function to generate unique IDs
  const generateUniqueId = useCallback(() => {
    return `field-${uuidv4()}`
  }, [])

  // Handle document click to add a new field
  const handleDocumentClick = useCallback(
    (e: React.MouseEvent) => {
      if (selectedTool && containerRef.current && currentSigner) {
        const rect = containerRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

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

        // Notify parent component (in an event handler, not during render)
        onAddField(newField)
        setSelectedTool(null)
      }
    },
    [selectedTool, currentPage, currentSigner, generateUniqueId, onAddField]
  )

  const handleFieldMove = useCallback(
    (id: string, position: { x: number; y: number }) => {
      setFields((prevFields) => {
        const updatedFields = prevFields.map((field) => (field.id === id ? { ...field, position } : field))
        return updatedFields
      })

      // Find the field and notify parent (separate from the state update)
      const fieldToUpdate = fields.find((field) => field.id === id)
      if (fieldToUpdate) {
        const updatedField = { ...fieldToUpdate, position }
        onAddField(updatedField)
      }
    },
    [fields, onAddField]
  )

  const handleFieldResize = useCallback(
    (id: string, size: { width: number; height: number }) => {
      setFields((prevFields) => {
        const updatedFields = prevFields.map((field) => (field.id === id ? { ...field, size } : field))
        return updatedFields
      })

      // Find the field and notify parent (separate from the state update)
      const fieldToUpdate = fields.find((field) => field.id === id)
      if (fieldToUpdate) {
        const updatedField = { ...fieldToUpdate, size }
        onAddField(updatedField)
      }
    },
    [fields, onAddField]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, fieldId: string, isResize = false) => {
      e.preventDefault()

      const startX = e.clientX
      const startY = e.clientY

      const field = fields.find((f) => f.id === fieldId)
      if (!field) return

      const startPosition = { ...field.position }
      const startSize = { ...field.size }

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (isResize) {
          // Handle resize
          const deltaX = moveEvent.clientX - startX
          const deltaY = moveEvent.clientY - startY

          handleFieldResize(fieldId, {
            width: Math.max(50, startSize.width + deltaX),
            height: Math.max(30, startSize.height + deltaY),
          })
        } else {
          // Handle move
          const deltaX = moveEvent.clientX - startX
          const deltaY = moveEvent.clientY - startY

          handleFieldMove(fieldId, {
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
    },
    [fields, handleFieldMove, handleFieldResize]
  )

  const handleOpenPdfInNewTab = () => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank")
    }
  }

  const renderPdfViewer = () => {
    if (!pdfUrl) return null

    switch (viewMode) {
      case "object":
        return (
          <object data={pdfUrl} type="application/pdf" className="w-full h-full" onError={() => setViewMode("embed")}>
            <p>Your browser cannot display the PDF. Trying alternative method...</p>
          </object>
        )
      case "embed":
        return (
          <embed src={pdfUrl} type="application/pdf" className="w-full h-full" onError={() => setViewMode("iframe")} />
        )
      case "iframe":
        return <iframe src={pdfUrl} className="w-full h-full" onError={() => setViewMode("fallback")} />
      case "fallback":
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
            <FileText className="h-16 w-16 text-amber-700 mb-4" />
            <p className="text-gray-600 mb-2">PDF preview not available in your browser</p>
            <p className="text-gray-500 text-sm mb-4">Using simplified mode</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenPdfInNewTab}
              className="bg-amber-700 border-amber-600 text-white hover:bg-amber-800 rounded-lg"
            >
              Open PDF in New Tab
            </Button>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col">
      {error && (
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
            <h4 className="text-sm font-medium text-amber-800 mb-2">Fields on Page {currentPage}</h4>
            {fields.filter((f) => f.page === currentPage && f.signerId === currentSigner?.id).length === 0 ? (
              <p className="text-xs text-amber-700">No fields added yet</p>
            ) : (
              <div className="space-y-2">
                {fields
                  .filter((f) => f.page === currentPage && f.signerId === currentSigner?.id)
                  .map((field) => (
                    <div
                      key={field.id}
                      className="bg-amber-100 p-2 rounded-lg border border-amber-300 text-xs text-amber-800"
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
            className="relative w-full border border-amber-700/30 rounded-lg shadow-lg overflow-hidden bg-white"
            style={{ height: "70vh" }}
            onClick={handleDocumentClick}
          >
            {/* PDF Viewer */}
            {renderPdfViewer()}

            {/* Signature fields overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="relative w-full h-full">
                {/* Current signer's fields */}
                {fields
                  .filter((field) => field.page === currentPage && field.signerId === currentSigner?.id)
                  .map((field) => (
                    <motion.div
                      key={field.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute bg-white/90 border-2 border-amber-700 rounded-lg shadow-md p-2 pointer-events-auto cursor-move"
                      style={{
                        left: `${field.position.x}px`,
                        top: `${field.position.y}px`,
                        width: `${field.size.width}px`,
                        height: `${field.size.height}px`,
                        zIndex: 10,
                      }}
                      onMouseDown={(e) => handleMouseDown(e, field.id)}
                    >
                      {field.type === "signature" && (
                        <div className="h-full flex items-center justify-center border-2 border-dashed border-amber-600 text-sm">
                          <Signature className="h-5 w-5 text-amber-700 mr-2" />
                          Signature
                        </div>
                      )}
                      {field.type === "date" && (
                        <div className="h-full flex items-center text-sm">
                          <Calendar className="h-4 w-4 text-amber-700 mr-2" />
                          Date: {new Date().toLocaleDateString()}
                        </div>
                      )}
                      {field.type === "text" && (
                        <div className="h-full flex items-center overflow-hidden text-sm">
                          <Type className="h-4 w-4 text-amber-700 mr-2" />
                          Text Field
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
                        zIndex: 5,
                      }}
                    >
                      <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-400 text-sm">
                        {field.type === "signature" && (
                          <>
                            <Signature className="h-5 w-5 text-gray-500 mr-2" />
                            <span className="text-gray-500">Other Signer's Field</span>
                          </>
                        )}
                        {field.type === "date" && (
                          <>
                            <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                            <span className="text-gray-500">Other Signer's Date</span>
                          </>
                        )}
                        {field.type === "text" && (
                          <>
                            <Type className="h-4 w-4 text-gray-500 mr-2" />
                            <span className="text-gray-500">Other Signer's Text</span>
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
            <div className="text-amber-800">Page {currentPage}</div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
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
