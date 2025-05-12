"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import PdfViewer from "@/components/pdf-viewer"
import SimplePdfViewer from "@/components/simple-pdf-viewer"
import IframePdfViewer from "@/components/iframe-pdf-viewer"
import ObjectIframeViewer from "@/components/object-iframe-viewer"
import type { ContractObject } from "@/lib/types"

interface FallbackManagerProps {
  file: File
  objects: ContractObject[]
  currentPage: number
  setCurrentPage: (page: number) => void
  onPageChange: (page: number) => void
  onSetNumPages: (pages: number) => void
  onObjectMove: (id: string, position: { x: number; y: number }) => void
  onObjectResize: (id: string, size: { width: number; height: number }) => void
}

export default function FallbackManager({
  file,
  objects,
  currentPage,
  setCurrentPage,
  onPageChange,
  onSetNumPages,
  onObjectMove,
  onObjectResize,
}: FallbackManagerProps) {
  const [viewerType, setViewerType] = useState<"pdf" | "iframe" | "object-iframe" | "simple">("object-iframe")
  const [error, setError] = useState<string | null>(null)

  // Try to determine the best viewer to use
  useEffect(() => {
    const testViewers = async () => {
      try {
        // First try the iframe approach which is most reliable
        setViewerType("object-iframe")
      } catch (err) {
        console.error("Error with object-iframe viewer:", err)
        setError("Using simplified PDF viewer due to compatibility issues.")
        setViewerType("simple")
      }
    }

    testViewers()
  }, [])

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <Alert className="bg-amber-950/50 border-amber-500/50 text-white">
          <AlertTitle className="text-amber-300">PDF Viewer Notice</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {viewerType === "pdf" && (
        <PdfViewer
          file={file}
          objects={objects}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          onPageChange={onPageChange}
          onSetNumPages={onSetNumPages}
          onObjectMove={onObjectMove}
          onObjectResize={onObjectResize}
        />
      )}

      {viewerType === "iframe" && (
        <IframePdfViewer
          file={file}
          objects={objects}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          onPageChange={onPageChange}
          onSetNumPages={onSetNumPages}
        />
      )}

      {viewerType === "object-iframe" && (
        <ObjectIframeViewer
          file={file}
          objects={objects}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          onPageChange={onPageChange}
          onSetNumPages={onSetNumPages}
          onObjectMove={onObjectMove}
          onObjectResize={onObjectResize}
        />
      )}

      {viewerType === "simple" && (
        <SimplePdfViewer
          file={file}
          objects={objects}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          onPageChange={onPageChange}
          onSetNumPages={onSetNumPages}
          onObjectMove={onObjectMove}
          onObjectResize={onObjectResize}
        />
      )}
    </div>
  )
}
