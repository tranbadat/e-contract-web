"use client"

import { useState, useEffect } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, AlertCircle, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import DraggableObject from "@/components/draggable-object"
import type { ContractObject } from "@/lib/types"

// Don't set the worker source here - we'll handle it differently

interface ContractViewerProps {
  file: File
  objects: ContractObject[]
  onObjectMove: (id: string, position: { x: number; y: number }) => void
  onObjectResize: (id: string, size: { width: number; height: number }) => void
  onObjectUpdate: (id: string, updates: Partial<ContractObject>) => void
  setNumPages: (num: number) => void
  currentPage: number
  setCurrentPage: (page: number) => void
  onError: (error: string) => void
}

export default function ContractViewer({
  file,
  objects,
  onObjectMove,
  onObjectResize,
  onObjectUpdate,
  setNumPages,
  currentPage,
  setCurrentPage,
  onError,
}: ContractViewerProps) {
  const [scale, setScale] = useState(1)
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(1)
  const [workerInitialized, setWorkerInitialized] = useState(false)

  // Initialize PDF.js worker
  useEffect(() => {
    const initializeWorker = async () => {
      try {
        // Get the version of PDF.js that react-pdf is using
        const pdfJsVersion = pdfjs.version
        console.log("PDF.js version:", pdfJsVersion)

        // Set the worker source to match the exact version
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfJsVersion}/build/pdf.worker.min.js`

        setWorkerInitialized(true)
      } catch (err) {
        console.error("Failed to load PDF.js worker:", err)
        setError("Failed to initialize PDF viewer. Please try again later.")
        onError("PDF viewer initialization failed")
      }
    }

    initializeWorker()
  }, [onError])

  useEffect(() => {
    // Reset states when file changes
    setLoading(true)
    setError(null)

    if (!file) return

    try {
      // Create a URL for the file
      const url = URL.createObjectURL(file)
      setFileUrl(url)

      // Clean up the URL when component unmounts
      return () => {
        if (url) URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error("Error creating object URL:", err)
      setError("Could not process the uploaded file")
      setLoading(false)
      onError("Failed to process the uploaded file")
    }
  }, [file, onError])

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setTotalPages(numPages)
    setLoading(false)
    setError(null)
  }

  const onDocumentLoadError = (err: Error) => {
    console.error("Error loading PDF:", err)
    const errorMessage = `Failed to load the PDF file: ${err.message}`
    setError(errorMessage)
    setLoading(false)
    onError(errorMessage)
  }

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

  const zoomIn = () => {
    setScale(Math.min(scale + 0.1, 2))
  }

  const zoomOut = () => {
    setScale(Math.max(scale - 0.1, 0.5))
  }

  // Fallback content when there's an error
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-black/30 rounded-xl backdrop-blur-sm border border-red-500/30 text-white">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Document Error</h3>
        <p className="text-center mb-4">{error}</p>
        <div className="flex flex-col space-y-2 w-full max-w-xs">
          <p className="text-sm text-gray-400 text-center mb-2">
            Try uploading a different PDF file or check if the file is corrupted.
          </p>
          <div className="h-40 w-full bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-lg flex items-center justify-center">
            <FileText className="h-16 w-16 text-purple-400/50" />
          </div>
        </div>
      </div>
    )
  }

  // Show loading state while worker is initializing
  if (!workerInitialized) {
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
          <p>Initializing PDF viewer...</p>
        </motion.div>
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
            Zoom -
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={zoomIn}
            className="bg-black/50 border-purple-500/50 text-white hover:bg-purple-950"
          >
            Zoom +
          </Button>
        </div>
        <div className="text-white">
          Page {currentPage} of {totalPages}
        </div>
      </div>

      <div
        ref={setContainerRef}
        className="relative overflow-auto max-h-[70vh] w-full border border-purple-500/20 rounded-lg"
      >
        {fileUrl && (
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex justify-center items-center h-[500px] bg-black/20">
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
            }
            className="flex justify-center"
          >
            <div className="relative">
              <Page
                pageNumber={currentPage}
                scale={scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="shadow-xl"
                error={
                  <div className="flex flex-col items-center justify-center h-[500px] bg-black/20 text-red-400 p-4">
                    <AlertCircle className="h-8 w-8 mb-2" />
                    <p>Error loading page {currentPage}</p>
                  </div>
                }
              />

              {objects.map((object) => (
                <DraggableObject
                  key={object.id}
                  object={object}
                  containerRef={containerRef}
                  onMove={onObjectMove}
                  onResize={onObjectResize}
                  onUpdate={onObjectUpdate}
                  scale={scale}
                />
              ))}
            </div>
          </Document>
        )}
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
