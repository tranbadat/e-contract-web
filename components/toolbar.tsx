"use client"

import { motion } from "framer-motion"
import { Type, Calendar, ImageIcon, PenTool } from "lucide-react"
import type { ContractObjectType } from "@/lib/types"

interface ToolbarProps {
  onAddObject: (type: ContractObjectType) => void
}

export default function Toolbar({ onAddObject }: ToolbarProps) {
  const tools = [
    { type: "text" as ContractObjectType, icon: <Type />, label: "Text" },
    { type: "date" as ContractObjectType, icon: <Calendar />, label: "Date" },
    { type: "photo" as ContractObjectType, icon: <ImageIcon />, label: "Photo" },
    { type: "signature" as ContractObjectType, icon: <PenTool />, label: "Signature" },
  ]

  return (
    <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl p-4 backdrop-blur-sm border border-blue-300 shadow-lg">
      <h2 className="text-lg font-semibold text-blue-800 mb-4">Tools</h2>
      <div className="grid grid-cols-2 gap-3">
        {tools.map((tool) => (
          <motion.div
            key={tool.type}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center justify-center p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg cursor-grab border border-blue-300 hover:border-blue-400 transition-colors"
            onClick={() => onAddObject(tool.type)}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", tool.type)
            }}
          >
            <div className="text-blue-600 mb-2">{tool.icon}</div>
            <span className="text-sm text-blue-700">{tool.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
