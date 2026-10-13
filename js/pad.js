// Panel de firma / iniciales. Dedo o Apple Pencil (usa la presión si existe).
export class Pad {
  constructor(canvas, { onChange } = {}) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.strokes = 0;
    this.onChange = onChange;
    this.resize();
    let drawing = false, last = null;
    const pos = (e) => {
      const r = this.c.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top, p: e.pressure > 0 && e.pointerType === 'pen' ? e.pressure : 0.5 };
    };
    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      drawing = true; last = pos(e);
      this.dot(last);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!drawing) return;
      e.preventDefault();
      const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      for (const ev of events) { const p = pos(ev); this.line(last, p); last = p; }
    });
    const end = () => {
      if (!drawing) return;
      drawing = false; this.strokes++;
      this.onChange && this.onChange(this);
    };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    canvas.style.touchAction = 'none';
  }
  resize() {
    const r = this.c.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    this.c.width = Math.max(1, Math.round(r.width * dpr));
    this.c.height = Math.max(1, Math.round(r.height * dpr));
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.lineCap = 'round'; this.ctx.lineJoin = 'round';
    this.ctx.strokeStyle = '#111'; this.ctx.fillStyle = '#111';
    this.strokes = 0;
  }
  w(p) { return 1.2 + p.p * 2.6; }
  dot(p) { this.ctx.beginPath(); this.ctx.arc(p.x, p.y, this.w(p) / 2, 0, Math.PI * 2); this.ctx.fill(); }
  line(a, b) {
    this.ctx.lineWidth = this.w(b);
    this.ctx.beginPath(); this.ctx.moveTo(a.x, a.y); this.ctx.lineTo(b.x, b.y); this.ctx.stroke();
  }
  clear() { this.ctx.save(); this.ctx.setTransform(1, 0, 0, 1, 0, 0); this.ctx.clearRect(0, 0, this.c.width, this.c.height); this.ctx.restore(); this.strokes = 0; this.onChange && this.onChange(this); }
  isEmpty() { return this.strokes === 0; }
  async toBytes() {
    const blob = await new Promise((r) => this.c.toBlob(r, 'image/png'));
    return new Uint8Array(await blob.arrayBuffer());
  }
}
