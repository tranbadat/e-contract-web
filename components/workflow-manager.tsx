"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import UploadDocument from "@/components/steps/upload-document"
import ActionSelection from "@/components/steps/action-selection"
import SignDocument from "@/components/steps/sign-document"
import EditDocument from "@/components/steps/edit-document"
import type { Signer } from "@/lib/types"

type WorkflowStep = "upload" | "action" | "sign" | "edit"

export default function WorkflowManager() {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>("upload")
  const [file, setFile] = useState<File | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfBase64, setPdfBase64] = useState<string | null>(null)
  const [signers, setSigners] = useState<Signer[]>([])
  const [currentSigner, setCurrentSigner] = useState<Signer | null>(null)

  const handleFileUpload = (uploadedFile: File) => {
    // Clean up previous URL if it exists
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl)
    }

    setFile(uploadedFile)

    // Log file information
    console.log("File uploaded:", {
      name: uploadedFile.name,
      type: uploadedFile.type,
      size: uploadedFile.size,
    })

    try {
      // Create URL for external viewing
      const url = URL.createObjectURL(uploadedFile)
      console.log("PDF URL created:", url)
      setPdfUrl(url)

      // Convert file to base64 for more reliable preview
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === "string") {
          const base64 = e.target.result
          console.log("PDF converted to base64, length:", base64.length)
          setPdfBase64(base64)
        }
      }
      reader.onerror = (error) => {
        console.error("Error converting PDF to base64:", error)
      }
      reader.readAsDataURL(uploadedFile)
    } catch (error) {
      console.error("Error processing file:", error)
    }

    setCurrentStep("action")
  }

  const handleActionSelect = (action: "sign" | "edit") => {
    setCurrentStep(action)
  }

  const handleAddSigner = (signer: Signer) => {
    setSigners([...signers, signer])
  }

  const handleSelectSigner = (signer: Signer) => {
    setCurrentSigner(signer)
  }

  const handleRemoveSigner = (signerId: string) => {
    // Remove the signer from the signers array
    setSigners(signers.filter((signer) => signer.id !== signerId))

    // If the current signer is being removed, set currentSigner to null or to another signer
    if (currentSigner?.id === signerId) {
      const remainingSigners = signers.filter((signer) => signer.id !== signerId)
      setCurrentSigner(remainingSigners.length > 0 ? remainingSigners[0] : null)
    }
  }

  const handleBack = () => {
    if (currentStep === "action") {
      setCurrentStep("upload")
    } else if (currentStep === "sign" || currentStep === "edit") {
      setCurrentStep("action")
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-white">
      <AnimatePresence mode="wait">
        {currentStep === "upload" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <UploadDocument onUpload={handleFileUpload} />
          </motion.div>
        )}

        {currentStep === "action" && (
          <motion.div
            key="action"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ActionSelection onSelect={handleActionSelect} onBack={handleBack} fileName={file?.name || "Document"} />
          </motion.div>
        )}

        {currentStep === "sign" && (
          <motion.div
            key="sign"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <SignDocument
              file={file}
              pdfUrl={pdfUrl}
              pdfBase64={pdfBase64}
              signers={signers}
              currentSigner={currentSigner}
              onAddSigner={handleAddSigner}
              onSelectSigner={handleSelectSigner}
              onRemoveSigner={handleRemoveSigner}
              onBack={handleBack}
            />
          </motion.div>
        )}

        {currentStep === "edit" && (
          <motion.div
            key="edit"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <EditDocument file={file} pdfUrl={pdfUrl} pdfBase64={pdfBase64} onBack={handleBack} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
