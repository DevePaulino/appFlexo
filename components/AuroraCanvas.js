import { useRef, useEffect } from 'react';
import { Platform, View } from 'react-native';

const BLOBS = [
  { x: 0.25, y: 0.30, vx:  0.00022, vy:  0.00018, r: 0.55, rgb: [79,  70, 229], a: 0.55 }, // indigo
  { x: 0.70, y: 0.65, vx: -0.00018, vy:  0.00025, r: 0.45, rgb: [124, 58, 237], a: 0.45 }, // violet
  { x: 0.55, y: 0.15, vx:  0.00015, vy: -0.00020, r: 0.38, rgb: [14, 165, 233], a: 0.38 }, // sky
  { x: 0.15, y: 0.75, vx:  0.00028, vy:  0.00012, r: 0.30, rgb: [167,139, 250], a: 0.30 }, // violet-light
  { x: 0.80, y: 0.25, vx: -0.00020, vy: -0.00015, r: 0.32, rgb: [99, 102, 241], a: 0.32 }, // indigo-mid
];

export default function AuroraCanvas() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const container = containerRef.current;
    if (!container) return;

    // Inject canvas into the DOM node that react-native-web creates
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    // Mutable blob state (copy to avoid mutating the constant)
    const blobs = BLOBS.map(b => ({ ...b }));
    const cursor = { x: 0.5, y: 0.5 };   // target (normalized)
    const cursorBlob = { x: 0.5, y: 0.5, r: 0.42, rgb: [99, 102, 241], a: 0.50 };

    let raf;

    const resize = () => {
      canvas.width  = container.offsetWidth;
      canvas.height = container.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const onMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      cursor.x = (e.clientX - rect.left)  / rect.width;
      cursor.y = (e.clientY - rect.top)   / rect.height;
    };
    // Listen on window so it tracks even when mouse moves fast
    window.addEventListener('mousemove', onMouseMove);

    const drawBlob = (cx, cy, radius, rgb, alpha) => {
      const W = canvas.width;
      const H = canvas.height;
      const r = rgb[0], g = rgb[1], b = rgb[2];
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      grad.addColorStop(0,   `rgba(${r},${g},${b},${alpha})`);
      grad.addColorStop(0.5, `rgba(${r},${g},${b},${(alpha * 0.4).toFixed(3)})`);
      grad.addColorStop(1,   `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    };

    let t = 0;
    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      t += 1;

      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';

      // Background
      const bg = ctx.createLinearGradient(0, 0, W * 0.4, H);
      bg.addColorStop(0, '#0d0d1f');
      bg.addColorStop(1, '#111128');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Additive blend for aurora effect
      ctx.globalCompositeOperation = 'screen';

      // Animate floating blobs
      blobs.forEach((blob, i) => {
        blob.x += blob.vx * Math.sin(t * 0.008 + i * 1.3);
        blob.y += blob.vy * Math.cos(t * 0.010 + i * 0.9);
        if (blob.x < 0.05) blob.vx =  Math.abs(blob.vx);
        if (blob.x > 0.95) blob.vx = -Math.abs(blob.vx);
        if (blob.y < 0.05) blob.vy =  Math.abs(blob.vy);
        if (blob.y > 0.95) blob.vy = -Math.abs(blob.vy);
        const pulse = 1 + 0.06 * Math.sin(t * 0.012 + i * 0.7);
        drawBlob(blob.x * W, blob.y * H, blob.r * Math.min(W, H) * pulse, blob.rgb, blob.a);
      });

      // Cursor blob — smooth lerp toward mouse
      const lerpSpeed = 0.045;
      cursorBlob.x += (cursor.x - cursorBlob.x) * lerpSpeed;
      cursorBlob.y += (cursor.y - cursorBlob.y) * lerpSpeed;
      drawBlob(cursorBlob.x * W, cursorBlob.y * H, cursorBlob.r * Math.min(W, H), cursorBlob.rgb, cursorBlob.a);

      // Subtle vignette to keep edges dark
      ctx.globalCompositeOperation = 'source-over';
      const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.85);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, W, H);

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('mousemove', onMouseMove);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
  }, []);

  if (Platform.OS !== 'web') return null;

  return (
    <View
      ref={containerRef}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}
      pointerEvents="none"
    />
  );
}
