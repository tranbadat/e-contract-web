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
  const [signers, setSigners] = useState<Signer[]>([])
  const [currentSigner, setCurrentSigner] = useState<Signer | null>(null)

  const handleFileUpload = (uploadedFile: File) => {
    // Clean up previous URL if it exists
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl)
    }

    setFile(uploadedFile)
    const url = URL.createObjectURL(uploadedFile)
    setPdfUrl(url)
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
              signers={signers}
              currentSigner={currentSigner}
              onAddSigner={handleAddSigner}
              onSelectSigner={handleSelectSigner}
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
            <EditDocument file={file} pdfUrl={pdfUrl} onBack={handleBack} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
