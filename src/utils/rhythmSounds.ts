/**
 * Synthèse Web Audio de « Lecture rythmique » : clic de métronome et percussions.
 * Chaque fonction planifie un son à l'instant `time` (horloge audio) vers le nœud `out`.
 */

const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>();

function getNoise(ac: AudioContext): AudioBuffer {
  let buffer = noiseBuffers.get(ac);
  if (!buffer) {
    buffer = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.05), ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noiseBuffers.set(ac, buffer);
  }
  return buffer;
}

export function synthClick(ac: AudioContext, out: AudioNode, time: number, accent: boolean, soft: boolean): void {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(accent ? 1568 : 1046, time);
  const vol = soft ? 0.22 : 0.5;
  gain.gain.setValueAtTime(vol, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.07);
  osc.connect(gain);
  gain.connect(out);
  osc.start(time);
  osc.stop(time + 0.08);
}

export function synthPerc(ac: AudioContext, dest: AudioNode, time: number, variant: 'tap' | 'model'): void {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  if (variant === 'model') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(900, time);
    osc.frequency.exponentialRampToValueAtTime(620, time + 0.06);
    g.gain.setValueAtTime(0.7, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.13);
    osc.connect(g);
    g.connect(dest);
    osc.start(time);
    osc.stop(time + 0.14);
    return;
  }
  osc.type = 'sine';
  osc.frequency.setValueAtTime(520, time);
  osc.frequency.exponentialRampToValueAtTime(140, time + 0.09);
  g.gain.setValueAtTime(0.9, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + 0.14);
  osc.connect(g);
  g.connect(dest);
  osc.start(time);
  osc.stop(time + 0.15);

  const noise = ac.createBufferSource();
  const ng = ac.createGain();
  noise.buffer = getNoise(ac);
  ng.gain.setValueAtTime(0.35, time);
  ng.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
  noise.connect(ng);
  ng.connect(dest);
  noise.start(time);
}
