"use client"

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { 
  Plus, 
  Minus, 
  MoreHorizontal, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Trash2,
  Copy
} from 'lucide-react'

interface TableBlockProps {
  id: string
  data: {
    rows: string[][]
    headers?: boolean
    alignment?: ('left' | 'center' | 'right')[]
  }
  onUpdate: (id: string, data: any) => void
  onDelete: (id: string) => void
}

export function TableBlock({ id, data, onUpdate, onDelete }: TableBlockProps) {
  const [rows, setRows] = useState(data.rows || [['', ''], ['', '']])
  const [hasHeaders, setHasHeaders] = useState(data.headers || false)
  const [alignment, setAlignment] = useState(data.alignment || ['left', 'left'])
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null)

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const newRows = [...rows]
    newRows[rowIndex][colIndex] = value
    setRows(newRows)
    onUpdate(id, { rows: newRows, headers: hasHeaders, alignment })
  }

  const addRow = (index?: number) => {
    const newRows = [...rows]
    const newRow = new Array(rows[0]?.length || 2).fill('')
    if (index !== undefined) {
      newRows.splice(index + 1, 0, newRow)
    } else {
      newRows.push(newRow)
    }
    setRows(newRows)
    onUpdate(id, { rows: newRows, headers: hasHeaders, alignment })
  }

  const addColumn = (index?: number) => {
    const newRows = rows.map(row => {
      const newRow = [...row]
      if (index !== undefined) {
        newRow.splice(index + 1, 0, '')
      } else {
        newRow.push('')
      }
      return newRow
    })
    const newAlignment = [...alignment]
    if (index !== undefined) {
      newAlignment.splice(index + 1, 0, 'left')
    } else {
      newAlignment.push('left')
    }
    setRows(newRows)
    setAlignment(newAlignment)
    onUpdate(id, { rows: newRows, headers: hasHeaders, alignment: newAlignment })
  }

  const removeRow = (index: number) => {
    if (rows.length <= 1) return
    const newRows = rows.filter((_, i) => i !== index)
    setRows(newRows)
    onUpdate(id, { rows: newRows, headers: hasHeaders, alignment })
  }

  const removeColumn = (index: number) => {
    if (rows[0]?.length <= 1) return
    const newRows = rows.map(row => row.filter((_, i) => i !== index))
    const newAlignment = alignment.filter((_, i) => i !== index)
    setRows(newRows)
    setAlignment(newAlignment)
    onUpdate(id, { rows: newRows, headers: hasHeaders, alignment: newAlignment })
  }

  const toggleHeaders = () => {
    const newHasHeaders = !hasHeaders
    setHasHeaders(newHasHeaders)
    onUpdate(id, { rows, headers: newHasHeaders, alignment })
  }

  const setColumnAlignment = (colIndex: number, align: 'left' | 'center' | 'right') => {
    const newAlignment = [...alignment]
    newAlignment[colIndex] = align
    setAlignment(newAlignment)
    onUpdate(id, { rows, headers: hasHeaders, alignment: newAlignment })
  }

  return (
    <div className="my-4 border rounded-lg overflow-hidden">
      {/* Contrôles du tableau */}
      <div className="flex items-center justify-between p-2 bg-muted/50 border-b">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => addRow()}
          >
            <Plus className="h-3 w-3 mr-1" />
            Ligne
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => addColumn()}
          >
            <Plus className="h-3 w-3 mr-1" />
            Colonne
          </Button>
          <Button
            variant={hasHeaders ? "default" : "ghost"}
            size="sm"
            onClick={toggleHeaders}
          >
            En-têtes
          </Button>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onDelete(id)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer le tableau
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="h-4 w-4 mr-2" />
              Dupliquer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b last:border-b-0">
                {row.map((cell, colIndex) => (
                  <td
                    key={colIndex}
                    className={`relative group ${
                      hasHeaders && rowIndex === 0 ? 'bg-muted/30 font-medium' : ''
                    }`}
                    style={{ textAlign: alignment[colIndex] || 'left' }}
                  >
                    <Input
                      value={cell}
                      onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                      onFocus={() => setSelectedCell({row: rowIndex, col: colIndex})}
                      onBlur={() => setSelectedCell(null)}
                      className="border-none shadow-none focus:ring-0 focus:border-none bg-transparent"
                      placeholder={hasHeaders && rowIndex === 0 ? 'En-tête' : ''}
                    />
                    
                    {/* Contrôles de colonne */}
                    {selectedCell?.row === rowIndex && selectedCell?.col === colIndex && (
                      <div className="absolute -top-8 left-0 flex items-center gap-1 bg-popover border rounded p-1 shadow-md z-10">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setColumnAlignment(colIndex, 'left')}
                          className={`h-6 w-6 p-0 ${alignment[colIndex] === 'left' ? 'bg-accent' : ''}`}
                        >
                          <AlignLeft className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setColumnAlignment(colIndex, 'center')}
                          className={`h-6 w-6 p-0 ${alignment[colIndex] === 'center' ? 'bg-accent' : ''}`}
                        >
                          <AlignCenter className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setColumnAlignment(colIndex, 'right')}
                          className={`h-6 w-6 p-0 ${alignment[colIndex] === 'right' ? 'bg-accent' : ''}`}
                        >
                          <AlignRight className="h-3 w-3" />
                        </Button>
                        <div className="w-px h-4 bg-border mx-1" />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addColumn(colIndex)}
                          className="h-6 w-6 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeColumn(colIndex)}
                          className="h-6 w-6 p-0"
                          disabled={row.length <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </td>
                ))}
                
                {/* Contrôles de ligne */}
                <td className="w-8 group-hover:opacity-100 opacity-0 transition-opacity">
                  <div className="flex items-center gap-1 p-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addRow(rowIndex)}
                      className="h-6 w-6 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRow(rowIndex)}
                      className="h-6 w-6 p-0"
                      disabled={rows.length <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}