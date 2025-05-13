"use client"

import type React from "react"

import { useState, useRef } from "react"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { motion } from "framer-motion"
import { Upload, Save, Download, FileText, ExternalLink } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import PdfObjectViewer from "@/components/pdf-object-viewer"
import Toolbar from "@/components/toolbar"
import ObjectList from "@/components/object-list"
import type { ContractObject, ContractObjectType } from "@/lib/types"

export default function ContractEditor() {
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [objects, setObjects] = useState<ContractObject[]>([])
  const [numPages, setNumPages] = useState<number>(1)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null)

    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]

      // Check if file is a PDF
      if (selectedFile.type !== "application/pdf") {
        setFileError("Please upload a PDF file. Other file types are not supported yet.")
        return
      }

      // Check file size (limit to 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setFileError("File is too large. Please upload a PDF smaller than 10MB.")
        return
      }

      setFile(selectedFile)

      // Create URL for external viewing
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }
      const url = URL.createObjectURL(selectedFile)
      setPdfUrl(url)

      // Reset objects when a new file is uploaded
      setObjects([])
      setCurrentPage(1)
    }
  }

  const handleAddObject = (type: ContractObjectType) => {
    const newObject: ContractObject = {
      id: `object-${Date.now()}`,
      type,
      position: { x: 100, y: 100 },
      size: { width: 150, height: type === "signature" ? 80 : 40 },
      page: currentPage,
      content: type === "text" ? "Edit this text" : "",
      properties: type === "signature" ? { name: "", email: "", phone: "" } : {},
    }

    setObjects([...objects, newObject])
  }

  const handleObjectMove = (id: string, position: { x: number; y: number }) => {
    setObjects(objects.map((obj) => (obj.id === id ? { ...obj, position } : obj)))
  }

  const handleObjectResize = (id: string, size: { width: number; height: number }) => {
    setObjects(objects.map((obj) => (obj.id === id ? { ...obj, size } : obj)))
  }

  const handleObjectUpdate = (id: string, updates: Partial<ContractObject>) => {
    setObjects(objects.map((obj) => (obj.id === id ? { ...obj, ...updates } : obj)))
  }

  const handleObjectDelete = (id: string) => {
    setObjects(objects.filter((obj) => obj.id !== id))
  }

  const handleCopyToAllPages = (id: string) => {
    const objectToCopy = objects.find((obj) => obj.id === id)
    if (!objectToCopy || objectToCopy.type !== "signature") return

    const newObjects = [...objects]

    for (let i = 1; i <= numPages; i++) {
      if (i !== objectToCopy.page) {
        newObjects.push({
          ...objectToCopy,
          id: `object-${Date.now()}-page-${i}`,
          page: i,
        })
      }
    }

    setObjects(newObjects)
  }

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const exportContract = () => {
    // This would be implemented with a PDF library to export the contract with all objects
    alert("Export functionality would be implemented with a PDF manipulation library")
  }

  const saveContract = () => {
    // This would save the current state of the contract
    alert("Contract saved successfully!")
  }

  const openPdfInNewTab = () => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank")
    }
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
          <header className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h1 className="text-3xl font-bold">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                Galaxy Contract Editor
              </span>
            </h1>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={triggerFileInput}
                className="bg-blue-600/80 border-blue-400 text-white hover:bg-blue-700"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Contract
              </Button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf" className="hidden" />

              {file && (
                <Button
                  variant="outline"
                  onClick={openPdfInNewTab}
                  className="bg-indigo-600/80 border-indigo-400 text-white hover:bg-indigo-700"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View PDF
                </Button>
              )}

              <Button
                variant="outline"
                onClick={saveContract}
                className="bg-indigo-600/80 border-indigo-400 text-white hover:bg-indigo-700"
                disabled={!file}
              >
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>

              <Button
                variant="outline"
                onClick={exportContract}
                className="bg-cyan-600/80 border-cyan-400 text-white hover:bg-cyan-700"
                disabled={!file}
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </header>

          {fileError && (
            <Alert variant="destructive" className="bg-red-950/50 border-red-500/50 text-white">
              <AlertTitle className="text-red-300">Error uploading file</AlertTitle>
              <AlertDescription>{fileError}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {file ? (
              <>
                <div className="lg:col-span-3 bg-gradient-to-br from-blue-900/40 to-indigo-900/40 rounded-xl p-4 backdrop-blur-sm border border-blue-500/30 shadow-lg">
                  <PdfObjectViewer
                    file={file}
                    objects={objects.filter((obj) => obj.page === currentPage)}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    onObjectMove={handleObjectMove}
                    onObjectResize={handleObjectResize}
                  />
                </div>

                <div className="lg:col-span-1 flex flex-col gap-6">
                  <Toolbar onAddObject={handleAddObject} />

                  <ObjectList
                    objects={objects.filter((obj) => obj.page === currentPage)}
                    onObjectDelete={handleObjectDelete}
                    onObjectUpdate={handleObjectUpdate}
                    onCopyToAllPages={handleCopyToAllPages}
                  />
                </div>
              </>
            ) : (
              <div className="lg:col-span-4 flex flex-col items-center justify-center p-20 bg-gradient-to-br from-blue-900/40 to-indigo-900/40 rounded-xl backdrop-blur-sm border border-blue-500/30">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 100,
                    delay: 0.2,
                  }}
                  className="text-center"
                >
                  <div className="mb-6">
                    <FileText className="mx-auto h-16 w-16 text-blue-400" />
                  </div>
                  <h2 className="text-2xl font-semibold text-white mb-4">Upload a Contract to Begin</h2>
                  <p className="text-gray-300 mb-6">Upload a PDF file to start editing your contract</p>
                  <Button
                    onClick={triggerFileInput}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Select PDF File
                  </Button>
                </motion.div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </DndProvider>
  )
}
