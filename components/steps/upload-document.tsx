"use client"

import type React from "react"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { Upload, FileText, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface UploadDocumentProps {
  onUpload: (file: File) => void
}

export default function UploadDocument({ onUpload }: UploadDocumentProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndUpload(e.target.files[0])
    }
  }

  const validateAndUpload = (file: File) => {
    setError(null)

    // Check if file is a PDF
    if (file.type !== "application/pdf" && !file.type.startsWith("image/")) {
      setError("Please upload a PDF or image file.")
      return
    }

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File is too large. Please upload a file smaller than 10MB.")
      return
    }

    onUpload(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndUpload(e.dataTransfer.files[0])
    }
  }

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className="flex flex-col items-center">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-amber-100 mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-600">
              Earth Contract Manager
            </span>
          </h1>
          <p className="text-amber-200/70">Upload a document to get started</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-700/20 border-red-700/30 text-white rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors earth-shadow bg-white ${
            isDragging ? "border-amber-400 bg-amber-50" : "border-amber-300 hover:bg-amber-50 hover:border-amber-400"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFileInput}
        >
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,image/*" className="hidden" />

          <div className="flex flex-col items-center">
            <div className="mb-4 p-4 rounded-full bg-amber-100">
              <FileText className="h-10 w-10 text-amber-700" />
            </div>
            <h2 className="text-xl font-semibold text-amber-900 mb-2">Drag & Drop your document here</h2>
            <p className="text-amber-700 mb-6">or click to browse your files</p>
            <Button className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 rounded-lg">
              <Upload className="mr-2 h-4 w-4" />
              Select Document
            </Button>
            <p className="mt-4 text-sm text-amber-500">Supported formats: PDF, JPG, PNG</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
