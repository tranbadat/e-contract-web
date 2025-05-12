"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ContractObject } from "@/lib/types"

interface IframePdfViewerProps {
  file: File
  objects: ContractObject[]
  currentPage: number
  setCurrentPage: (page: number) => void
  onPageChange?: (page: number) => void
  onSetNumPages?: (pages: number) => void
}

export default function IframePdfViewer({
  file,
  objects,
  currentPage,
  setCurrentPage,
  onPageChange,
  onSetNumPages,
}: IframePdfViewerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  useEffect(() => {
    // Create a URL for the file
    try {
      const url = URL.createObjectURL(file)
      setPdfUrl(url)
      setLoading(false)

      // Simulate setting number of pages
      if (onSetNumPages) {
        // This is just a placeholder - in a real implementation
        // we would determine the actual number of pages
        onSetNumPages(5)
      }

      // Clean up the URL when component unmounts
      return () => {
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error("Error creating object URL:", err)
      setError("Could not process the uploaded file")
      setLoading(false)
    }
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
    if (currentPage < 5) {
      // Hardcoded for demo
      const newPage = currentPage + 1
      setCurrentPage(newPage)
      if (onPageChange) {
        onPageChange(newPage)
      }
    }
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
        <div></div>
        <div className="text-white">Page {currentPage} of 5</div>
      </div>

      <div className="relative overflow-auto max-h-[70vh] w-full border border-purple-500/20 rounded-lg bg-white">
        {pdfUrl && <iframe src={`${pdfUrl}#page=${currentPage}`} className="w-full h-[70vh]" title="PDF Viewer" />}

        {/* We can't easily overlay objects on the iframe, so we'd need a different approach for a real implementation */}
        <div className="absolute top-2 right-2 bg-purple-600 text-white px-3 py-1 rounded-md text-sm">
          {objects.length} objects on this page
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
          disabled={currentPage >= 5}
          className="bg-black/50 border-purple-500/50 text-white hover:bg-purple-950"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
