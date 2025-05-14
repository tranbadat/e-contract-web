"use client"
import { ArrowLeft, Save, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import DocumentEditor from "@/components/editing/document-editor"

interface EditDocumentProps {
  file: File | null
  pdfUrl: string | null
  pdfBase64: string | null
  onBack: () => void
}

export default function EditDocument({ file, pdfUrl, pdfBase64, onBack }: EditDocumentProps) {
  const handleSaveTemplate = () => {
    alert("Template saved successfully!")
  }

  const handleSendForSigning = () => {
    alert("Document sent for signing!")
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
          <h2 className="text-xl font-semibold text-amber-800">Edit Document</h2>
        </div>
        <div className="w-20"></div> {/* Spacer for alignment */}
      </div>

      <DocumentEditor file={file} pdfUrl={pdfUrl} pdfBase64={pdfBase64} />

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
          className="bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-800 hover:to-amber-700 rounded-lg"
        >
          <Send className="h-4 w-4 mr-2" />
          Send for Signing
        </Button>
      </div>
    </div>
  )
}
