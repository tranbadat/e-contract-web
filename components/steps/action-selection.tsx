"use client"

import { motion } from "framer-motion"
import { FileText, Edit, PenTool, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ActionSelectionProps {
  onSelect: (action: "sign" | "edit") => void
  onBack: () => void
  fileName: string
}

export default function ActionSelection({ onSelect, onBack, fileName }: ActionSelectionProps) {
  return (
    <div className="flex flex-col items-center">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-3xl">
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
            <h2 className="text-xl font-semibold text-amber-100">What would you like to do?</h2>
          </div>
          <div className="w-20"></div> {/* Spacer for alignment */}
        </div>

        <div className="bg-amber-50 rounded-lg p-4 mb-8 flex items-center earth-shadow border border-amber-200">
          <FileText className="h-6 w-6 text-amber-700 mr-3" />
          <div>
            <p className="text-amber-900 font-medium">{fileName}</p>
            <p className="text-sm text-amber-700">Document uploaded successfully</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-xl p-6 backdrop-blur-sm border border-amber-200 earth-shadow-lg cursor-pointer"
            onClick={() => onSelect("sign")}
          >
            <div className="mb-4 p-4 rounded-full bg-amber-100">
              <PenTool className="h-8 w-8 text-amber-700" />
            </div>
            <h3 className="text-xl font-semibold text-amber-900 mb-2">Sign Document</h3>
            <p className="text-amber-700">Add signature fields for yourself or others to sign this document</p>
            <Button
              className="mt-4 bg-amber-600 hover:bg-amber-700 rounded-lg"
              onClick={(e) => {
                e.stopPropagation()
                onSelect("sign")
              }}
            >
              Continue to Signing
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-xl p-6 backdrop-blur-sm border border-emerald-200 earth-shadow-lg cursor-pointer"
            onClick={() => onSelect("edit")}
          >
            <div className="mb-4 p-4 rounded-full bg-emerald-100">
              <Edit className="h-8 w-8 text-emerald-700" />
            </div>
            <h3 className="text-xl font-semibold text-amber-900 mb-2">Edit Document</h3>
            <p className="text-amber-700">Add text fields, checkboxes, images, and other elements to your document</p>
            <Button
              className="mt-4 bg-emerald-600 hover:bg-emerald-700 rounded-lg"
              onClick={(e) => {
                e.stopPropagation()
                onSelect("edit")
              }}
            >
              Continue to Editing
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
