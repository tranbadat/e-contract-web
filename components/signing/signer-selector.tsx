"use client"

import { useState, useRef, useEffect } from "react"
import { UserPlus, User, X, ChevronRight, CheckCircle, AlertCircle, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion, AnimatePresence } from "framer-motion"
import type { Signer } from "@/lib/types"

interface SignerSelectorProps {
  signers: Signer[]
  currentSigner: Signer | null
  onAddSigner: (signer: Signer) => void
  onSelectSigner: (signer: Signer) => void
  onRemoveSigner: (signerId: string) => void
  onContinue: () => void
  signatureFields: any[] // Array of signature fields
}

export default function SignerSelector({
  signers,
  currentSigner,
  onAddSigner,
  onSelectSigner,
  onRemoveSigner,
  onContinue,
  signatureFields,
}: SignerSelectorProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newSigner, setNewSigner] = useState<{ name: string; email: string }>({
    name: "",
    email: "",
  })
  const [invalidSigners, setInvalidSigners] = useState<string[]>([])
  const [showValidationMessage, setShowValidationMessage] = useState(false)
  const firstInvalidRef = useRef<HTMLDivElement>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Check which signers have signature fields
  useEffect(() => {
    const invalid = signers
      .filter((signer) => {
        const hasSignatureField = signatureFields.some((field) => field.signerId === signer.id)
        return !hasSignatureField
      })
      .map((signer) => signer.id)

    setInvalidSigners(invalid)
  }, [signers, signatureFields])

  const handleAddSigner = () => {
    if (newSigner.name.trim() && newSigner.email.trim()) {
      const signer: Signer = {
        id: `signer-${Date.now()}`,
        name: newSigner.name.trim(),
        email: newSigner.email.trim(),
      }

      onAddSigner(signer)
      setNewSigner({ name: "", email: "" })
      setShowAddForm(false)
    }
  }

  const handleContinueClick = () => {
    if (invalidSigners.length > 0) {
      setShowValidationMessage(true)

      // Scroll to the first invalid signer
      setTimeout(() => {
        if (firstInvalidRef.current) {
          firstInvalidRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          })
        }
      }, 100)

      return
    }

    onContinue()
  }

  const isSignerValid = (signerId: string) => {
    return !invalidSigners.includes(signerId)
  }

  const filteredSigners = signers.filter(
    (signer) =>
      signer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      signer.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Update card styles for lighter background
  return (
    <div className="earth-card">
      <h3 className="text-lg font-medium text-amber-900 mb-6">Choose or Add Signers</h3>

      {showValidationMessage && invalidSigners.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-800"
        >
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
            <div>
              <p className="font-medium">Please add signature fields</p>
              <p className="text-sm text-red-700">
                Each signer must have at least one signature field placed on the document.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Search box */}
      {signers.length > 0 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-amber-500" />
          <Input
            placeholder="Search signers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 earth-input"
          />
        </div>
      )}

      {filteredSigners.length > 0 && (
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredSigners.map((signer, index) => {
              const isValid = isSignerValid(signer.id)
              const isActive = currentSigner?.id === signer.id
              const isFirstInvalid = invalidSigners[0] === signer.id

              return (
                <div
                  key={signer.id}
                  ref={isFirstInvalid ? firstInvalidRef : null}
                  className={`signer-card cursor-pointer transition-all duration-200 bg-white ${
                    isActive ? "border-amber-500 bg-amber-50" : "border-gray-200"
                  } ${isValid ? "border-emerald-300" : "border-red-300"}`}
                  onClick={() => onSelectSigner(signer)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-amber-100 p-2 rounded-full mr-3">
                        <User className="h-4 w-4 text-amber-700" />
                      </div>
                      <div>
                        <p className="text-amber-900 font-medium">{signer.name}</p>
                        <p className="text-sm text-amber-700">{signer.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <div
                        className={`signer-status mr-2 ${
                          isValid ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                        }`}
                      >
                        {isValid ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <div className="tooltip">
                            <AlertCircle className="h-4 w-4" />
                            <span className="tooltip-text bg-gray-800 text-white">
                              Please place at least one signature field for this signer
                            </span>
                          </div>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onRemoveSigner(signer.id)
                        }}
                        className="h-7 w-7 p-0 text-amber-600 hover:text-red-500 hover:bg-red-100 rounded-full"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showAddForm ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-amber-800/20 rounded-lg p-4 border border-amber-700/30 mb-6 overflow-hidden"
          >
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-amber-100 font-medium">Add New Signer</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddForm(false)}
                className="h-8 w-8 p-0 text-amber-400 hover:text-amber-100 hover:bg-amber-700/30 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-amber-200">
                  Name
                </Label>
                <Input
                  id="name"
                  value={newSigner.name}
                  onChange={(e) => setNewSigner({ ...newSigner, name: e.target.value })}
                  placeholder="Enter name"
                  className="earth-input"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-amber-200">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={newSigner.email}
                  onChange={(e) => setNewSigner({ ...newSigner, email: e.target.value })}
                  placeholder="Enter email address"
                  className="earth-input"
                />
              </div>

              <Button
                onClick={handleAddSigner}
                className="w-full bg-amber-700 hover:bg-amber-800 rounded-lg"
                disabled={!newSigner.name.trim() || !newSigner.email.trim()}
              >
                Add Signer
              </Button>
            </div>
          </motion.div>
        ) : (
          <Button
            variant="outline"
            onClick={() => setShowAddForm(true)}
            className="mb-6 bg-amber-800/20 border-amber-700/30 text-amber-100 hover:bg-amber-800/30 w-full rounded-lg"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add New Signer
          </Button>
        )}
      </AnimatePresence>

      <div className="flex justify-end">
        <Button
          onClick={handleContinueClick}
          className={`bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-800 hover:to-amber-700 rounded-lg ${
            invalidSigners.length > 0 ? "opacity-70" : ""
          }`}
        >
          Continue
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
