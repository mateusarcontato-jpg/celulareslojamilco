import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Eraser, PenTool, CheckCircle2, Smartphone } from 'lucide-react';

interface SignaturePadCanvasProps {
  onSignatureChange: (dataUrl: string | null) => void;
  signerName?: string;
}

export const SignaturePadCanvas: React.FC<SignaturePadCanvasProps> = ({
  onSignatureChange,
  signerName,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Configure high-DPI canvas
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    if (rect.width === 0 || rect.height === 0) return;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#09090b'; // zinc-950 ink
      ctx.lineWidth = 2.6;
    }
  }, []);

  useEffect(() => {
    setupCanvas();
    window.addEventListener('resize', setupCanvas);
    return () => window.removeEventListener('resize', setupCanvas);
  }, [setupCanvas]);

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);

    const point = getCoordinates(e);
    lastPointRef.current = point;
    setIsDrawing(true);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 1.3, 0, Math.PI * 2);
      ctx.fillStyle = '#09090b';
      ctx.fill();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas || !lastPointRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentPoint = getCoordinates(e);
    const midPoint = {
      x: (lastPointRef.current.x + currentPoint.x) / 2,
      y: (lastPointRef.current.y + currentPoint.y) / 2,
    };

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 2.6;

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.quadraticCurveTo(
      lastPointRef.current.x,
      lastPointRef.current.y,
      midPoint.x,
      midPoint.y
    );
    ctx.lineTo(currentPoint.x, currentPoint.y);
    ctx.stroke();

    lastPointRef.current = currentPoint;
    if (!hasStrokes) {
      setHasStrokes(true);
    }
  };

  const finishStroke = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPointRef.current = null;

    const canvas = canvasRef.current;
    if (canvas) {
      setHasStrokes(true);
      const dataUrl = canvas.toDataURL('image/png');
      onSignatureChange(dataUrl);
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasStrokes(false);
    onSignatureChange(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800">
          <PenTool className="w-3.5 h-3.5 text-red-600" />
          <span>Assine com o dedo na tela do celular (ou mouse):</span>
        </div>
        <div className="flex items-center gap-2">
          {hasStrokes && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Rubrica capturada</span>
            </span>
          )}
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 rounded-lg transition-colors cursor-pointer"
          >
            <Eraser className="w-3 h-3 text-red-600" />
            <span>Limpar Assinatura</span>
          </button>
        </div>
      </div>

      <div className="relative rounded-xl border-2 border-dashed border-zinc-300 bg-white overflow-hidden shadow-inner">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishStroke}
          onPointerCancel={finishStroke}
          className="w-full h-44 sm:h-48 touch-none cursor-crosshair block bg-white"
        />

        {/* Guia de assinatura no fundo */}
        <div className="pointer-events-none absolute inset-x-6 bottom-7 border-b border-zinc-300 flex items-end justify-between pb-1">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            ✕ Assinatura Digital Manuscrita — {signerName || 'Colaborador'}
          </span>
          <span className="inline-flex items-center gap-1 text-[9px] text-zinc-400 font-medium">
            <Smartphone className="w-3 h-3" />
            Toque e desenhe aqui
          </span>
        </div>

        {!hasStrokes && !isDrawing && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-zinc-400 select-none">
            <PenTool className="w-6 h-6 text-zinc-300 mb-1" />
            <span className="text-xs font-semibold text-zinc-400">
              Use o dedo na tela do celular para assinar aqui
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
