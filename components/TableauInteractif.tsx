import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Line, Text, Rect, RegularPolygon, Circle, Group, Transformer } from 'react-konva';
import { ChalkIcon, ClothIcon, TypeIcon, RulerIcon, SquareIcon, CompassIcon, TrashIcon, SelectIcon, HandIcon, UndoIcon, RedoIcon, ChevronUpIcon, ChevronDownIcon } from './icons';
import { motion, AnimatePresence } from 'motion/react';

interface Shape {
  id: string;
  type: 'line' | 'text' | 'ruler' | 'square' | 'compass';
  points?: number[];
  text?: string;
  isEraser?: boolean;
  x: number;
  y: number;
  rotation: number;
  width?: number;
  height?: number;
  color: string;
  strokeWidth?: number;
}

interface TableauInteractifProps {
  boardTheme: 'black' | 'white';
}

const TableauInteractif: React.FC<TableauInteractifProps> = ({ boardTheme }) => {
  const [tool, setTool] = useState<'selection' | 'chalk' | 'cloth' | 'text' | 'ruler' | 'square' | 'compass' | 'hand'>('chalk');
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [history, setHistory] = useState<Shape[][]>([[]]);
  const [historyStep, setHistoryStep] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [color, setColor] = useState(boardTheme === 'black' ? '#ffffff' : '#000000');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [stageSize, setStageSize] = useState({ width: window.innerWidth, height: window.innerHeight - 68 });
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [isToolbarVisible, setIsToolbarVisible] = useState(true);

  // Update default color when board theme changes, but only if user hasn't picked a custom color?
  // Actually, let's just reset it for simplicity or keep track of if it was manually changed.
  // For now, let's just update it if it matches the previous theme's default.
  useEffect(() => {
    setColor(boardTheme === 'black' ? '#ffffff' : '#000000');
  }, [boardTheme]);
  
  const isDrawing = useRef(false);
  const isPanning = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editingTextId && textareaRef.current) {
      textareaRef.current.focus();
      // Move cursor to end
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);
    }
  }, [editingTextId]);

  useEffect(() => {
    const handleResize = () => {
      setStageSize({ width: window.innerWidth, height: window.innerHeight - 68 });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getPointerPosition = (e: any) => {
    const stage = e.target.getStage();
    if (!stage) return { x: 0, y: 0 };
    
    // For panning we need screen coordinates
    // Check for touch events first
    if (e.evt.touches && e.evt.touches.length > 0) {
      return { x: e.evt.touches[0].clientX, y: e.evt.touches[0].clientY };
    }
    // Check for changedTouches (useful for touchend)
    if (e.evt.changedTouches && e.evt.changedTouches.length > 0) {
      return { x: e.evt.changedTouches[0].clientX, y: e.evt.changedTouches[0].clientY };
    }
    // Fallback to mouse coordinates
    return { x: e.evt.clientX || 0, y: e.evt.clientY || 0 };
  };

  const handleMouseDown = (e: any) => {
    // Prevent default browser behavior for touch
    if (e.evt && e.evt.cancelable) {
      // Don't prevent default if we are clicking an input or textarea
      if (e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'INPUT') {
        // e.evt.preventDefault(); // Actually, Konva handles this mostly, but let's be careful
      }
    }

    // Deselect when clicking on empty area
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedId(null);
    }

    const pos = getPointerPosition(e);

    if (tool === 'hand') {
      isPanning.current = true;
      lastPos.current = pos;
      return;
    }

    if (tool === 'selection') {
      // Selection is handled by onClick on shapes
      return;
    }

    const stage = e.target.getStage();
    const transform = stage.getAbsoluteTransform().copy().invert();
    const stagePointerPos = stage.getPointerPosition();
    if (!stagePointerPos) return;
    const canvasPos = transform.point(stagePointerPos);

    if (tool === 'chalk' || tool === 'cloth') {
      isDrawing.current = true;
      const newShape: Shape = {
        id: Date.now().toString(),
        type: 'line',
        points: [canvasPos.x, canvasPos.y],
        x: 0,
        y: 0,
        rotation: 0,
        color: tool === 'cloth' ? (boardTheme === 'black' ? '#111827' : '#ffffff') : color,
        isEraser: tool === 'cloth',
        strokeWidth: strokeWidth,
      };
      const newShapes = [...shapes, newShape];
      setShapes(newShapes);
    } else if (tool === 'text' && clickedOnEmpty) {
      const newId = Date.now().toString();
      const newShape: Shape = {
        id: newId,
        type: 'text',
        text: '',
        x: canvasPos.x,
        y: canvasPos.y,
        rotation: 0,
        color: color,
      };
      const newShapes = [...shapes, newShape];
      setShapes(newShapes);
      setSelectedId(newId);
      setEditingTextId(newId);
    } else if ((tool === 'ruler' || tool === 'square' || tool === 'compass') && clickedOnEmpty) {
      const newShape: Shape = {
        id: Date.now().toString(),
        type: tool,
        x: canvasPos.x,
        y: canvasPos.y,
        rotation: 0,
        width: tool === 'ruler' ? 300 : tool === 'square' ? 200 : 150,
        height: tool === 'ruler' ? 40 : tool === 'square' ? 200 : 150,
        color: 'rgba(100, 100, 255, 0.3)',
      };
      const newShapes = [...shapes, newShape];
      setShapes(newShapes);
      setSelectedId(newShape.id);
    }
  };

  const handleMouseMove = (e: any) => {
    const pos = getPointerPosition(e);

    if (isPanning.current) {
      const dx = pos.x - lastPos.current.x;
      const dy = pos.y - lastPos.current.y;
      setStagePos({
        x: stagePos.x + dx,
        y: stagePos.y + dy,
      });
      lastPos.current = pos;
      return;
    }

    if (!isDrawing.current) return;

    const stage = e.target.getStage();
    const transform = stage.getAbsoluteTransform().copy().invert();
    const stagePointerPos = stage.getPointerPosition();
    if (!stagePointerPos) return;
    const canvasPos = transform.point(stagePointerPos);
    
    const lastShape = shapes[shapes.length - 1];
    
    if (lastShape && lastShape.type === 'line') {
      const newShapes = shapes.slice();
      newShapes[shapes.length - 1] = {
        ...lastShape,
        points: lastShape.points!.concat([canvasPos.x, canvasPos.y]),
      };
      setShapes(newShapes);
    }
  };

  const handleMouseUp = () => {
    if (isDrawing.current) {
      saveToHistory(shapes);
    }
    isDrawing.current = false;
    isPanning.current = false;
  };

  const saveToHistory = (newShapes: Shape[]) => {
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(newShapes);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const undo = () => {
    if (historyStep > 0) {
      const prevStep = historyStep - 1;
      setHistoryStep(prevStep);
      setShapes(history[prevStep]);
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      const nextStep = historyStep + 1;
      setHistoryStep(nextStep);
      setShapes(history[nextStep]);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    const shape = shapes.find(s => s.id === id);
    if (tool === 'text' && shape?.type === 'text') {
      setEditingTextId(id);
    }
  };

  const deleteSelected = () => {
    if (selectedId) {
      const newShapes = shapes.filter(s => s.id !== selectedId);
      setShapes(newShapes);
      saveToHistory(newShapes);
      setSelectedId(null);
    }
  };

  const clearCanvas = () => {
    setShapes([]);
    saveToHistory([]);
    setSelectedId(null);
  };

  useEffect(() => {
    if (transformerRef.current && selectedId) {
      const selectedNode = stageRef.current.findOne('#' + selectedId);
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer().batchDraw();
      }
    }
  }, [selectedId]);

  const getCursorStyle = () => {
    const cursorColor = boardTheme === 'black' ? 'white' : 'black';
    
    switch (tool) {
      case 'hand': return 'cursor-grab active:cursor-grabbing';
      case 'selection': return 'cursor-default';
      case 'text': return 'cursor-text';
      case 'chalk':
        const chalkSvg = encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${cursorColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 4l3 3L9 22l-5-1 1-5L18 4z" />
            <path d="M15 7l3 3" />
            <path d="M7 16l3 3" />
          </svg>
        `.trim());
        return `cursor-[url('data:image/svg+xml,${chalkSvg}')_4_21,pointer]`;
      case 'cloth':
        const clothSvg = encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${cursorColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 16.5v-9A1.5 1.5 0 014.5 6h15A1.5 1.5 0 0121 7.5v9a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 16.5z" />
            <path d="M3 9h18M3 12h18M3 15h18" />
            <path d="M7 6v12M12 6v12M17 6v12" />
          </svg>
        `.trim());
        return `cursor-[url('data:image/svg+xml,${clothSvg}')_12_12,pointer]`;
      default: 
        // For tools like ruler/compass that use crosshair, we can also make it themed
        const crosshairSvg = encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${cursorColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <line x1="1" y1="12" x2="23" y2="12" />
          </svg>
        `.trim());
        return `cursor-[url('data:image/svg+xml,${crosshairSvg}')_12_12,crosshair]`;
    }
  };

  return (
    <div className="relative w-full h-full bg-[var(--color-bg-primary)] overflow-hidden touch-none">
      {/* Toolbar Toggle Button */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-[60]">
        <button 
          onClick={() => setIsToolbarVisible(!isToolbarVisible)}
          className="p-2.5 bg-[var(--color-card-bg)] rounded-full shadow-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-all active:scale-95"
          title={isToolbarVisible ? "Masquer les outils" : "Afficher les outils"}
        >
          {isToolbarVisible ? <ChevronDownIcon className="w-6 h-6" /> : <ChevronUpIcon className="w-6 h-6" />}
        </button>
      </div>

      {/* Toolbar */}
      <AnimatePresence>
        {isToolbarVisible && (
          <div className="absolute bottom-6 left-0 w-full flex justify-center z-50 pointer-events-none px-4">
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="pointer-events-auto flex items-center space-x-1 md:space-x-2 p-1.5 md:p-2 bg-[var(--color-card-bg)] rounded-2xl shadow-2xl border border-[var(--color-border)] backdrop-blur-md max-w-full overflow-x-auto no-scrollbar"
            >
              <div className="flex items-center space-x-1 pr-1 md:pr-2 border-r border-[var(--color-border)]">
                <ToolButton active={tool === 'hand'} onClick={() => setTool('hand')} icon={<HandIcon className="w-4 h-4 md:w-5 h-5" />} label="Main" />
                <button 
                  onClick={() => setStagePos({ x: 0, y: 0 })}
                  className="p-2 md:p-3 rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] flex flex-col items-center justify-center space-y-1 min-w-[40px] md:min-w-[50px]"
                  title="Réinitialiser la vue"
                >
                  <UndoIcon className="w-4 h-4 md:w-5 h-5 rotate-90" />
                  <span className="text-[8px] md:text-[9px] font-medium uppercase tracking-tighter">Début</span>
                </button>
                <ToolButton active={tool === 'selection'} onClick={() => setTool('selection')} icon={<SelectIcon className="w-4 h-4 md:w-5 h-5" />} label="Sélection" />
                <ToolButton active={tool === 'chalk'} onClick={() => setTool('chalk')} icon={<ChalkIcon className="w-4 h-4 md:w-5 h-5" />} label="Craie" />
                <ToolButton active={tool === 'cloth'} onClick={() => setTool('cloth')} icon={<ClothIcon className="w-4 h-4 md:w-5 h-5" />} label="Chiffon" />
                <ToolButton active={tool === 'text'} onClick={() => setTool('text')} icon={<TypeIcon className="w-4 h-4 md:w-5 h-5" />} label="Texte" />
              </div>

              <div className="flex items-center space-x-1 pr-1 md:pr-2 border-r border-[var(--color-border)]">
                <ToolButton active={tool === 'ruler'} onClick={() => setTool('ruler')} icon={<RulerIcon className="w-4 h-4 md:w-5 h-5" />} label="Règle" />
                <ToolButton active={tool === 'square'} onClick={() => setTool('square')} icon={<SquareIcon className="w-4 h-4 md:w-5 h-5" />} label="Équerre" />
                <ToolButton active={tool === 'compass'} onClick={() => setTool('compass')} icon={<CompassIcon className="w-4 h-4 md:w-5 h-5" />} label="Compas" />
              </div>

              <div className="flex items-center space-x-1 md:space-x-2 px-1 md:px-2">
                <input 
                  type="color" 
                  value={color} 
                  onChange={(e) => setColor(e.target.value)}
                  className="w-6 h-6 md:w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent"
                />
                <select 
                  value={strokeWidth} 
                  onChange={(e) => setStrokeWidth(Number(e.target.value))}
                  className="bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-lg px-1 md:px-2 py-1 text-xs md:text-sm outline-none border border-[var(--color-border)]"
                >
                  <option value="2">Fin</option>
                  <option value="5">Moyen</option>
                  <option value="10">Large</option>
                  <option value="100">Très large</option>
                </select>
              </div>

              <div className="flex items-center space-x-1 px-1 md:px-2 border-l border-r border-[var(--color-border)]">
                <button 
                  onClick={undo}
                  disabled={historyStep === 0}
                  className={`p-1.5 md:p-2 rounded-xl transition-colors ${historyStep > 0 ? 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]' : 'text-gray-300 cursor-not-allowed'}`}
                  title="Annuler"
                >
                  <UndoIcon className="w-4 h-4 md:w-5 h-5" />
                </button>
                <button 
                  onClick={redo}
                  disabled={historyStep === history.length - 1}
                  className={`p-1.5 md:p-2 rounded-xl transition-colors ${historyStep < history.length - 1 ? 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]' : 'text-gray-300 cursor-not-allowed'}`}
                  title="Rétablir"
                >
                  <RedoIcon className="w-4 h-4 md:w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center space-x-1 pl-1 md:pl-2">
                <button 
                  onClick={deleteSelected}
                  disabled={!selectedId}
                  className={`p-1.5 md:p-2 rounded-xl transition-colors ${selectedId ? 'text-red-500 hover:bg-red-500/10' : 'text-gray-300 cursor-not-allowed'}`}
                  title="Supprimer la sélection"
                >
                  <TrashIcon className="w-4 h-4 md:w-5 h-5" />
                </button>
                <button 
                  onClick={clearCanvas}
                  className="p-1.5 md:p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
                  title="Effacer tout"
                >
                  <span className="text-[10px] md:text-xs font-bold whitespace-nowrap">EFFACER</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Text Editor Overlay */}
      {editingTextId && (
        <div 
          className="absolute z-[60] pointer-events-auto"
          style={{
            left: (shapes.find(s => s.id === editingTextId)?.x || 0) + stagePos.x,
            top: (shapes.find(s => s.id === editingTextId)?.y || 0) + stagePos.y,
            transform: `rotate(${shapes.find(s => s.id === editingTextId)?.rotation || 0}deg)`,
          }}
        >
          <textarea
            ref={textareaRef}
            autoFocus
            className="bg-transparent border-none outline-none p-0 m-0 resize-none overflow-hidden whitespace-pre-wrap break-words"
            style={{
              color: shapes.find(s => s.id === editingTextId)?.color || color,
              fontSize: '24px',
              fontFamily: 'sans-serif',
              width: '500px',
              minHeight: '40px',
              lineHeight: '1.2',
              padding: '0',
            }}
            value={shapes.find(s => s.id === editingTextId)?.text || ''}
            onChange={(e) => {
              const newShapes = shapes.slice();
              const index = newShapes.findIndex(s => s.id === editingTextId);
              if (index !== -1) {
                newShapes[index] = { ...newShapes[index], text: e.target.value };
                setShapes(newShapes);
              }
            }}
            onBlur={() => setEditingTextId(null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                setEditingTextId(null);
              }
            }}
          />
        </div>
      )}

      {/* Canvas */}
      <Stage
        width={stageSize.width}
        height={stageSize.height}
        x={stagePos.x}
        y={stagePos.y}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        ref={stageRef}
        draggable={false}
        className={`${boardTheme === 'black' ? 'bg-gray-900' : 'bg-white'} ${getCursorStyle()}`}
      >
        <Layer>
          {shapes.map((shape) => {
            const isSelected = selectedId === shape.id;
            const isDraggable = tool === 'selection' || isSelected;

            if (shape.type === 'line') {
              return (
                <Line
                  key={shape.id}
                  id={shape.id}
                  points={shape.points}
                  stroke={shape.color}
                  strokeWidth={shape.strokeWidth}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                  hitStrokeWidth={20}
                  draggable={isDraggable}
                  globalCompositeOperation={shape.isEraser ? 'destination-out' : 'source-over'}
                  onClick={() => handleSelect(shape.id)}
                  onTap={() => handleSelect(shape.id)}
                  onDragEnd={(e) => {
                    const newShapes = shapes.slice();
                    const index = newShapes.findIndex(s => s.id === shape.id);
                    newShapes[index] = {
                      ...newShapes[index],
                      x: e.target.x(),
                      y: e.target.y(),
                    };
                    setShapes(newShapes);
                    saveToHistory(newShapes);
                  }}
                  onTransformEnd={(e) => {
                    const node = e.target;
                    const newShapes = shapes.slice();
                    const index = newShapes.findIndex(s => s.id === shape.id);
                    newShapes[index] = {
                      ...newShapes[index],
                      x: node.x(),
                      y: node.y(),
                      rotation: node.rotation(),
                      width: node.width() * node.scaleX(),
                      height: node.height() * node.scaleY(),
                    };
                    node.scaleX(1);
                    node.scaleY(1);
                    setShapes(newShapes);
                    saveToHistory(newShapes);
                  }}
                />
              );
            } else if (shape.type === 'text') {
              return (
                <Text
                  key={shape.id}
                  id={shape.id}
                  text={shape.text || (editingTextId === shape.id ? '' : 'Tapez ici...')}
                  x={shape.x}
                  y={shape.y}
                  fontSize={24}
                  fill={shape.color}
                  opacity={editingTextId === shape.id ? 0 : 1}
                  draggable={isDraggable}
                  onClick={() => handleSelect(shape.id)}
                  onTap={() => handleSelect(shape.id)}
                  onDblClick={() => setEditingTextId(shape.id)}
                  onDragEnd={(e) => {
                    const newShapes = shapes.slice();
                    const index = newShapes.findIndex(s => s.id === shape.id);
                    newShapes[index] = {
                      ...newShapes[index],
                      x: e.target.x(),
                      y: e.target.y(),
                    };
                    setShapes(newShapes);
                    saveToHistory(newShapes);
                  }}
                  onTransformEnd={(e) => {
                    const node = e.target;
                    const newShapes = shapes.slice();
                    const index = newShapes.findIndex(s => s.id === shape.id);
                    newShapes[index] = {
                      ...newShapes[index],
                      x: node.x(),
                      y: node.y(),
                      rotation: node.rotation(),
                    };
                    setShapes(newShapes);
                    saveToHistory(newShapes);
                  }}
                />
              );
            } else if (shape.type === 'ruler') {
              return (
                <Rect
                  key={shape.id}
                  id={shape.id}
                  x={shape.x}
                  y={shape.y}
                  width={shape.width}
                  height={shape.height}
                  fill={shape.color}
                  stroke="#666"
                  strokeWidth={1}
                  draggable={isDraggable}
                  onClick={() => handleSelect(shape.id)}
                  onTap={() => handleSelect(shape.id)}
                  onDragEnd={(e) => {
                    const newShapes = shapes.slice();
                    const index = newShapes.findIndex(s => s.id === shape.id);
                    newShapes[index] = {
                      ...newShapes[index],
                      x: e.target.x(),
                      y: e.target.y(),
                    };
                    setShapes(newShapes);
                    saveToHistory(newShapes);
                  }}
                  onTransformEnd={(e) => {
                    const node = e.target;
                    const newShapes = shapes.slice();
                    const index = newShapes.findIndex(s => s.id === shape.id);
                    newShapes[index] = {
                      ...newShapes[index],
                      x: node.x(),
                      y: node.y(),
                      rotation: node.rotation(),
                      width: node.width() * node.scaleX(),
                      height: node.height() * node.scaleY(),
                    };
                    node.scaleX(1);
                    node.scaleY(1);
                    setShapes(newShapes);
                    saveToHistory(newShapes);
                  }}
                />
              );
            } else if (shape.type === 'square') {
              return (
                <RegularPolygon
                  key={shape.id}
                  id={shape.id}
                  x={shape.x}
                  y={shape.y}
                  sides={3}
                  radius={shape.width! / 2}
                  fill={shape.color}
                  stroke="#666"
                  strokeWidth={1}
                  draggable={isDraggable}
                  onClick={() => handleSelect(shape.id)}
                  onTap={() => handleSelect(shape.id)}
                  onDragEnd={(e) => {
                    const newShapes = shapes.slice();
                    const index = newShapes.findIndex(s => s.id === shape.id);
                    newShapes[index] = {
                      ...newShapes[index],
                      x: e.target.x(),
                      y: e.target.y(),
                    };
                    setShapes(newShapes);
                    saveToHistory(newShapes);
                  }}
                  onTransformEnd={(e) => {
                    const node = e.target;
                    const newShapes = shapes.slice();
                    const index = newShapes.findIndex(s => s.id === shape.id);
                    newShapes[index] = {
                      ...newShapes[index],
                      x: node.x(),
                      y: node.y(),
                      rotation: node.rotation(),
                      width: node.width() * node.scaleX(),
                      height: node.height() * node.scaleY(),
                    };
                    node.scaleX(1);
                    node.scaleY(1);
                    setShapes(newShapes);
                    saveToHistory(newShapes);
                  }}
                />
              );
            } else if (shape.type === 'compass') {
              return (
                <Circle
                  key={shape.id}
                  id={shape.id}
                  x={shape.x}
                  y={shape.y}
                  radius={shape.width! / 2}
                  fill={shape.color}
                  stroke="#666"
                  strokeWidth={1}
                  draggable={isDraggable}
                  onClick={() => handleSelect(shape.id)}
                  onTap={() => handleSelect(shape.id)}
                  onDragEnd={(e) => {
                    const newShapes = shapes.slice();
                    const index = newShapes.findIndex(s => s.id === shape.id);
                    newShapes[index] = {
                      ...newShapes[index],
                      x: e.target.x(),
                      y: e.target.y(),
                    };
                    setShapes(newShapes);
                    saveToHistory(newShapes);
                  }}
                  onTransformEnd={(e) => {
                    const node = e.target;
                    const newShapes = shapes.slice();
                    const index = newShapes.findIndex(s => s.id === shape.id);
                    newShapes[index] = {
                      ...newShapes[index],
                      x: node.x(),
                      y: node.y(),
                      rotation: node.rotation(),
                      width: node.width() * node.scaleX(),
                      height: node.height() * node.scaleY(),
                    };
                    node.scaleX(1);
                    node.scaleY(1);
                    setShapes(newShapes);
                    saveToHistory(newShapes);
                  }}
                />
              );
            }
            return null;
          })}
          {selectedId && (
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 5 || newBox.height < 5) {
                  return oldBox;
                }
                return newBox;
              }}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
};

const ToolButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`p-2.5 md:p-3 rounded-xl transition-all flex flex-col items-center justify-center space-y-1 min-w-[50px] md:min-w-[60px] ${
      active 
        ? 'bg-[var(--color-accent)] text-white shadow-lg scale-105 md:scale-110' 
        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'
    }`}
    title={label}
  >
    {icon}
    <span className="text-[9px] md:text-[10px] font-medium uppercase tracking-tighter">{label}</span>
  </button>
);

export default TableauInteractif;
