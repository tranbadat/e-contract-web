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
    <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 rounded-xl p-4 backdrop-blur-sm border border-blue-500/30 shadow-lg">
      <h2 className="text-lg font-semibold text-white mb-4">Tools</h2>
      <div className="grid grid-cols-2 gap-3">
        {tools.map((tool) => (
          <motion.div
            key={tool.type}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center justify-center p-3 bg-gradient-to-br from-blue-800/50 to-indigo-800/50 rounded-lg cursor-grab border border-blue-500/30 hover:border-blue-400/60 transition-colors"
            onClick={() => onAddObject(tool.type)}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", tool.type)
            }}
          >
            <div className="text-blue-300 mb-2">{tool.icon}</div>
            <span className="text-sm text-white">{tool.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
