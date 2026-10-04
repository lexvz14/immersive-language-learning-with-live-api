import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";

export interface AudioVisualizerHandle {
    connect: (audioContext: AudioContext, sourceNode: AudioNode) => void;
    disconnect: () => void;
}

export const AudioVisualizer = forwardRef<AudioVisualizerHandle, { className?: string }>(({ className }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const stateRef = useRef({
        active: false,
        audioContext: null as AudioContext | null,
        analyser: null as AnalyserNode | null,
        source: null as AudioNode | null,
        dataArray: null as any | null, // Using any to bypass TS Uint8Array exact match issue
        animationId: null as number | null,
        points: [] as number[],
    });

    useImperativeHandle(ref, () => ({
        connect: (audioContext: AudioContext, sourceNode: AudioNode) => {
            const state = stateRef.current;
            if (state.analyser) {
                disconnect();
            }
            try {
                state.audioContext = audioContext;
                state.analyser = audioContext.createAnalyser();
                state.analyser.fftSize = 2048;
                state.source = sourceNode;
                state.source.connect(state.analyser);
                const bufferLength = state.analyser.frequencyBinCount;
                state.dataArray = new Uint8Array(bufferLength);
                state.active = true;
                animate();
            } catch (err) {
                console.error('Error connecting visualizer:', err);
            }
        },
        disconnect: () => {
            disconnect();
        }
    }));

    const disconnect = () => {
        const state = stateRef.current;
        state.active = false;
        if (state.animationId) {
            cancelAnimationFrame(state.animationId);
            state.animationId = null;
        }
        if (state.source && state.analyser) {
            try {
                state.source.disconnect(state.analyser);
            } catch (e) {}
        }
        state.analyser = null;
        state.source = null;
        state.audioContext = null;
        drawIdle();
    };

    const drawIdle = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { width, height } = canvas;
        ctx.clearRect(0, 0, width, height);
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.strokeStyle = '#c084fc'; // Match new dark mode primary or let css handle
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
    };

    const animate = () => {
        const state = stateRef.current;
        if (!state.active || !state.analyser || !state.dataArray) return;
        state.animationId = requestAnimationFrame(animate);

        state.analyser.getByteTimeDomainData(state.dataArray);

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#c084fc';
        ctx.beginPath();

        const pointsCount = 20;
        const lerpFactor = 0.3;
        const amplitudeScale = 10.0;

        if (!state.points || state.points.length !== pointsCount) {
            state.points = new Array(pointsCount).fill(0);
        }

        const sliceWidth = width / (pointsCount - 1);
        const bufferStep = Math.floor(state.dataArray.length / pointsCount);

        for (let i = 0; i < pointsCount; i++) {
            const audioIndex = Math.min(i * bufferStep, state.dataArray.length - 1);
            let val = (state.dataArray[audioIndex] / 128.0) - 1.0;
            const normalization = i / (pointsCount - 1);
            const window = Math.sin(normalization * Math.PI);
            const targetY = val * (height * 0.4) * amplitudeScale * window;
            state.points[i] += (targetY - state.points[i]) * lerpFactor;
        }

        ctx.moveTo(0, height / 2);
        for (let i = 0; i < pointsCount; i++) {
            const x = i * sliceWidth;
            const y = (height / 2) + state.points[i];
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                const prevX = (i - 1) * sliceWidth;
                const prevY = (height / 2) + state.points[i - 1];
                const cx = (prevX + x) / 2;
                const cy = (prevY + y) / 2;
                ctx.quadraticCurveTo(prevX, prevY, cx, cy);
            }
        }
        ctx.lineTo(width, height / 2);
        ctx.stroke();
    };

    useEffect(() => {
        const resize = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.parentElement?.getBoundingClientRect();
            if (rect) {
                canvas.width = rect.width;
                canvas.height = rect.height;
            }
            if (!stateRef.current.active) drawIdle();
        };

        window.addEventListener('resize', resize);
        resize();
        return () => {
            window.removeEventListener('resize', resize);
            disconnect();
        };
    }, []);

    return (
        <div className={`w-full h-full ${className || ''}`}>
            <canvas ref={canvasRef} className="w-full h-full block"></canvas>
        </div>
    );
});
