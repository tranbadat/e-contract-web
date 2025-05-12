"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useDrag } from "react-dnd"
import { motion } from "framer-motion"
import { Calendar, ImageIcon, PenTool } from "lucide-react"
import { Input } from "@/components/ui/input"
import type { ContractObject } from "@/lib/types"

interface DraggableObjectProps {
  object: ContractObject
  containerRef: HTMLDivElement | null
  onMove: (id: string, position: { x: number; y: number }) => void
  onResize: (id: string, size: { width: number; height: number }) => void
  onUpdate: (id: string, updates: Partial<ContractObject>) => void
  scale: number
}

export default function DraggableObject({
  object,
  containerRef,
  onMove,
  onResize,
  onUpdate,
  scale,
}: DraggableObjectProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [startResizePos, setStartResizePos] = useState({ x: 0, y: 0 })
  const [startSize, setStartSize] = useState({ width: 0, height: 0 })
  const objectRef = useRef<HTMLDivElement>(null)

  const [{ isDragging }, drag] = useDrag({
    type: "OBJECT",
    item: { id: object.id, type: object.type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  // Handle mouse move for resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing && objectRef.current) {
        const deltaX = (e.clientX - startResizePos.x) / scale
        const deltaY = (e.clientY - startResizePos.y) / scale

        const newWidth = Math.max(50, startSize.width + deltaX)
        const newHeight = Math.max(30, startSize.height + deltaY)

        onResize(object.id, { width: newWidth, height: newHeight })
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizing, startResizePos, startSize, object.id, onResize, scale])

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setStartResizePos({ x: e.clientX, y: e.clientY })
    setStartSize({ width: object.size.width, height: object.size.height })
  }

  const handleDragEnd = (e: React.DragEvent) => {
    if (!containerRef) return

    const containerRect = containerRef.getBoundingClientRect()
    const x = (e.clientX - containerRect.left) / scale
    const y = (e.clientY - containerRect.top) / scale

    onMove(object.id, { x, y })
  }

  const renderObjectContent = () => {
    switch (object.type) {
      case "text":
        return isEditing ? (
          <Input
            value={object.content || ""}
            onChange={(e) => onUpdate(object.id, { content: e.target.value })}
            autoFocus
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setIsEditing(false)
            }}
            className="w-full h-full bg-transparent border-none text-black focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        ) : (
          <div className="w-full h-full flex items-center cursor-text" onClick={() => setIsEditing(true)}>
            {object.content || "Click to edit text"}
          </div>
        )

      case "date":
        return (
          <div className="w-full h-full flex items-center gap-2">
            <Calendar className="h-4 w-4 text-purple-700" />
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        )

      case "photo":
        return (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <ImageIcon className="h-6 w-6 text-gray-400" />
            <span className="text-xs text-gray-500 ml-2">Click to add image</span>
          </div>
        )

      case "signature":
        return (
          <div className="w-full h-full flex flex-col justify-center border-2 border-dashed border-purple-400 p-2">
            <div className="flex items-center justify-center">
              <PenTool className="h-5 w-5 text-purple-500" />
              <span className="text-sm text-purple-700 ml-1">Signature</span>
            </div>
            {object.properties?.name && (
              <div className="text-xs text-center mt-1 text-gray-600">{object.properties.name}</div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <motion.div
      ref={(node) => {
        drag(node)
        if (objectRef) {
          // @ts-ignore - TypeScript doesn't like this, but it works
          objectRef.current = node
        }
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: isDragging ? 0.5 : 1,
        scale: isDragging ? 1.05 : 1,
        x: object.position.x,
        y: object.position.y,
        width: object.size.width,
        height: object.size.height,
      }}
      style={{
        position: "absolute",
        cursor: isDragging ? "grabbing" : "grab",
      }}
      className="bg-white rounded-md shadow-lg overflow-hidden"
      draggable
      onDragEnd={handleDragEnd}
      onClick={(e) => e.stopPropagation()}
    >
      {renderObjectContent()}

      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 bg-purple-500 cursor-se-resize rounded-tl-md"
        onMouseDown={handleResizeStart}
      />
    </motion.div>
  )
}
