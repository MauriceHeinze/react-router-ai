import { useCallback, useEffect, useRef, useState } from "react";

export interface LiveAudioVisualizerProps {
  mediaRecorder: MediaRecorder;
  width?: number | string;
  height?: number | string;
  barWidth?: number;
  gap?: number;
  backgroundColor?: string;
  barColor?: string;
  fftSize?: 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096 | 8192 | 16384 | 32768;
  maxDecibels?: number;
  minDecibels?: number;
  smoothingTimeConstant?: number;
}

function calculateBarData(
  frequencyData: Uint8Array,
  width: number,
  barWidth: number,
  gap: number,
): number[] {
  let units = width / (barWidth + gap);
  let step = Math.floor(frequencyData.length / units);
  if (step > frequencyData.length) {
    step = frequencyData.length;
    units = 1;
  }
  const bars: number[] = [];
  for (let i = 0; i < units; i++) {
    let sum = 0;
    for (let j = 0; j < step && i * step + j < frequencyData.length; j++) {
      sum += frequencyData[i * step + j];
    }
    bars.push(sum / step);
  }
  return bars;
}

function draw(
  data: number[],
  canvas: HTMLCanvasElement,
  barWidth: number,
  gap: number,
  backgroundColor: string,
  barColor: string,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const centerY = canvas.height / 2;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (backgroundColor !== "transparent") {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  data.forEach((value, i) => {
    ctx.fillStyle = barColor;
    const x = i * (barWidth + gap);
    const y = centerY - value / 2;
    const h = value || 1;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x, y, barWidth, h, 50);
      ctx.fill();
    } else {
      ctx.fillRect(x, y, barWidth, h);
    }
  });
}

export function LiveAudioVisualizer({
  mediaRecorder,
  width = "100%",
  height = "100%",
  barWidth = 2,
  gap = 1,
  backgroundColor = "transparent",
  barColor = "rgb(160, 198, 255)",
  fftSize = 1024,
  maxDecibels = -10,
  minDecibels = -90,
  smoothingTimeConstant = 0.4,
}: LiveAudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [source, setSource] = useState<MediaStreamAudioSourceNode | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  useEffect(() => {
    if (!mediaRecorder.stream) return;
    const ctx = new AudioContext();
    const node = ctx.createAnalyser();
    node.fftSize = fftSize;
    node.minDecibels = minDecibels;
    node.maxDecibels = maxDecibels;
    node.smoothingTimeConstant = smoothingTimeConstant;
    const src = ctx.createMediaStreamSource(mediaRecorder.stream);
    src.connect(node);
    setAudioContext(ctx);
    setSource(src);
    setAnalyser(node);
    return () => {
      src.disconnect();
      node.disconnect();
      if (ctx.state !== "closed") ctx.close();
    };
  }, [mediaRecorder.stream, fftSize, minDecibels, maxDecibels, smoothingTimeConstant]);

  const renderFrame = useCallback(() => {
    if (!analyser || !audioContext) return;
    const buffer = new Uint8Array(analyser.frequencyBinCount);
    const drawFrame = () => {
      if (!canvasRef.current) return;
      analyser.getByteFrequencyData(buffer);
      const barData = calculateBarData(buffer, canvasRef.current.width, barWidth, gap);
      draw(barData, canvasRef.current, barWidth, gap, backgroundColor, barColor);
    };
    if (mediaRecorder.state === "recording") {
      drawFrame();
      requestAnimationFrame(renderFrame);
    } else if (mediaRecorder.state === "paused") {
      drawFrame();
    } else if (mediaRecorder.state === "inactive" && audioContext.state !== "closed") {
      audioContext.close();
    }
  }, [analyser, audioContext, mediaRecorder.state, barWidth, gap, backgroundColor, barColor]);

  useEffect(() => {
    if (analyser && mediaRecorder.state === "recording") {
      renderFrame();
    }
  }, [analyser, mediaRecorder.state, renderFrame]);

  useEffect(() => {
    return () => {
      if (audioContext && audioContext.state !== "closed") audioContext.close();
      source?.disconnect();
      analyser?.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ aspectRatio: "unset" }}
    />
  );
}
