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
  signers: Signer[]
  currentSigner: Signer | null
  onAddSigner: (signer: Signer) => void
  onSelectSigner: (signer: Signer) => void
  onBack: () => void
}

export default function SignDocument({
  file,
  pdfUrl,
  signers,
  currentSigner,
  onAddSigner,
  onSelectSigner,
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

  return (
    <div className="flex flex-col">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-amber-400 hover:text-amber-100 hover:bg-amber-800/30 rounded-lg"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1 text-center">
          <h2 className="text-xl font-semibold text-amber-100">Sign Document</h2>
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
            onContinue={handleContinueToDesign}
            signatureFields={signatureFields}
          />
        </TabsContent>

        <TabsContent value="design" className="mt-0">
          <SignatureDesigner
            file={file}
            pdfUrl={pdfUrl}
            currentSigner={currentSigner}
            onAddField={handleAddSignatureField}
            existingFields={signatureFields}
          />

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
