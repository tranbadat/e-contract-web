"use client"

import { motion } from "framer-motion"
import { Type, Calendar, ImageIcon, PenTool, Trash2, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ContractObject } from "@/lib/types"

interface ObjectListProps {
  objects: ContractObject[]
  onObjectDelete: (id: string) => void
  onObjectUpdate: (id: string, updates: Partial<ContractObject>) => void
  onCopyToAllPages: (id: string) => void
}

export default function ObjectList({ objects, onObjectDelete, onObjectUpdate, onCopyToAllPages }: ObjectListProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "text":
        return <Type className="h-4 w-4" />
      case "date":
        return <Calendar className="h-4 w-4" />
      case "photo":
        return <ImageIcon className="h-4 w-4" />
      case "signature":
        return <PenTool className="h-4 w-4" />
      default:
        return null
    }
  }

  const getLabel = (object: ContractObject) => {
    switch (object.type) {
      case "text":
        return object.content?.substring(0, 15) || "Text"
      case "date":
        return "Date Field"
      case "photo":
        return "Image"
      case "signature":
        return `Signature: ${object.properties?.name || "Unnamed"}`
      default:
        return "Object"
    }
  }

  return (
    <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl p-4 backdrop-blur-sm border border-blue-300 shadow-lg">
      <h2 className="text-lg font-semibold text-blue-800 mb-4">Objects</h2>

      {objects.length === 0 ? (
        <p className="text-blue-700 text-sm text-center py-4">
          Drag and drop objects from the toolbar to add them to your contract
        </p>
      ) : (
        <ul className="space-y-2">
          {objects.map((object) => (
            <motion.li
              key={object.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-800">
                  <span className="text-blue-600">{getIcon(object.type)}</span>
                  <span className="text-sm truncate max-w-[120px]">{getLabel(object)}</span>
                </div>

                <div className="flex gap-1">
                  {object.type === "signature" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onCopyToAllPages(object.id)}
                      className="h-7 w-7 text-blue-600 hover:text-blue-500 hover:bg-blue-100"
                      title="Copy to all pages"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onObjectDelete(object.id)}
                    className="h-7 w-7 text-red-600 hover:text-red-500 hover:bg-red-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  )
}
