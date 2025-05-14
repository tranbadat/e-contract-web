"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, User, ChevronRight, Save, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import SignerSelector from "@/components/signing/signer-selector"
import SignatureDesigner from "@/components/signing/signature-designer"
import type { Signer, SignatureField } from "@/lib/types"

interface SignDocumentProps {
  file: File | null
  pdfUrl: string | null
  pdfBase64: string | null
  signers: Signer[]
  currentSigner: Signer | null
  onAddSigner: (signer: Signer) => void
  onSelectSigner: (signer: Signer) => void
  onRemoveSigner: (signerId: string) => void
  onBack: () => void
}

export default function SignDocument({
  file,
  pdfUrl,
  pdfBase64,
  signers,
  currentSigner,
  onAddSigner,
  onSelectSigner,
  onRemoveSigner,
  onBack,
}: SignDocumentProps) {
  const [activeTab, setActiveTab] = useState("signers")
  const [signatureFields, setSignatureFields] = useState<SignatureField[]>([])
  const [allSignersValid, setAllSignersValid] = useState(false)

  // Check if all signers have at least one signature field
  useEffect(() => {
    if (signers.length === 0) {
      setAllSignersValid(false)
      return
    }

    const allValid = signers.every((signer) => signatureFields.some((field) => field.signerId === signer.id))

    setAllSignersValid(allValid)
  }, [signers, signatureFields])

  const handleContinueToDesign = () => {
    setActiveTab("design")
  }

  const handleSaveTemplate = () => {
    alert("Template saved successfully!")
  }

  const handleSendForSigning = () => {
    if (!allSignersValid) {
      setActiveTab("signers")
      return
    }
    alert("Document sent for signing!")
  }

  const handleAddSignatureField = (field: SignatureField) => {
    setSignatureFields((prevFields) => {
      // Check if the field already exists (by ID)
      const existingIndex = prevFields.findIndex((f) => f.id === field.id)

      if (existingIndex >= 0) {
        // Update existing field
        const updatedFields = [...prevFields]
        updatedFields[existingIndex] = field
        return updatedFields
      } else {
        // Add new field
        return [...prevFields, field]
      }
    })
  }

  const handleRemoveSigner = (signerId: string) => {
    // Remove the signer's fields
    setSignatureFields((prevFields) => prevFields.filter((field) => field.signerId !== signerId))

    // If the current signer is being removed, set currentSigner to null
    if (currentSigner?.id === signerId) {
      onSelectSigner(signers.find((s) => s.id !== signerId) || null)
    }

    // You would also need to update the parent component's state
    // This would typically be handled by the parent component
    // For example: onRemoveSigner(signerId)
  }

  // Add a debug component to show PDF information
  const PdfDebugInfo = ({
    file,
    pdfUrl,
    pdfBase64,
  }: { file: File | null; pdfUrl: string | null; pdfBase64: string | null }) => {
    if (!file) return null

    return (
      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs">
        <h4 className="font-medium text-amber-800 mb-1">PDF Debug Information</h4>
        <ul className="space-y-1 text-amber-700">
          <li>
            <span className="font-medium">File name:</span> {file.name}
          </li>
          <li>
            <span className="font-medium">File size:</span> {(file.size / 1024).toFixed(2)} KB
          </li>
          <li>
            <span className="font-medium">File type:</span> {file.type}
          </li>
          <li>
            <span className="font-medium">URL created:</span> {pdfUrl ? "Yes" : "No"}
          </li>
          <li>
            <span className="font-medium">Base64 created:</span> {pdfBase64 ? "Yes" : "No"}
          </li>
          <li>
            <span className="font-medium">Base64 length:</span> {pdfBase64 ? pdfBase64.length : "N/A"}
          </li>
          <li>
            <span className="font-medium">Test URL:</span>{" "}
            <button
              onClick={() => pdfUrl && window.open(pdfUrl, "_blank")}
              className="text-blue-600 underline"
              disabled={!pdfUrl}
            >
              Open in new tab
            </button>
          </li>
        </ul>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded-lg"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1 text-center">
          <h2 className="text-xl font-semibold text-amber-800">Sign Document</h2>
        </div>
        <div className="w-20"></div> {/* Spacer for alignment */}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8 bg-amber-900/20 rounded-lg overflow-hidden">
          <TabsTrigger value="signers" className="data-[state=active]:bg-amber-700 py-3">
            <User className="h-4 w-4 mr-2" />
            Choose Signers
          </TabsTrigger>
          <TabsTrigger value="design" className="data-[state=active]:bg-amber-700 py-3" disabled={!currentSigner}>
            <ChevronRight className="h-4 w-4 mr-2" />
            Design Signature Areas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="signers" className="mt-0">
          <SignerSelector
            signers={signers}
            currentSigner={currentSigner}
            onAddSigner={onAddSigner}
            onSelectSigner={onSelectSigner}
            onRemoveSigner={onRemoveSigner}
            onContinue={handleContinueToDesign}
            signatureFields={signatureFields}
          />
        </TabsContent>

        <TabsContent value="design" className="mt-0">
          {activeTab === "design" && (
            <>
              <PdfDebugInfo file={file} pdfUrl={pdfUrl} pdfBase64={pdfBase64} />
              <SignatureDesigner
                file={file}
                pdfUrl={pdfUrl}
                pdfBase64={pdfBase64}
                currentSigner={currentSigner}
                onAddField={handleAddSignatureField}
                existingFields={signatureFields}
              />
            </>
          )}

          <div className="flex justify-end mt-6 gap-3">
            <Button
              variant="outline"
              onClick={handleSaveTemplate}
              className="bg-amber-800/20 border-amber-700/30 text-amber-100 hover:bg-amber-800/30 rounded-lg"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Template
            </Button>
            <Button
              onClick={handleSendForSigning}
              className={`bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-800 hover:to-amber-700 rounded-lg ${
                !allSignersValid ? "opacity-70" : ""
              }`}
              disabled={!allSignersValid}
            >
              <Send className="h-4 w-4 mr-2" />
              Send for Signing
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
