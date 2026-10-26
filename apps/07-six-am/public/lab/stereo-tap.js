// Lab AudioWorklet: hands stereo PCM blocks (with their frame number on the context clock) to the
// page while "on". Never connected to the output, never recorded: the page keeps a few seconds in
// a ring for separation and drops them.
class StereoTap extends AudioWorkletProcessor {
  constructor() {
    super();
    this.on = false;
    this.port.onmessage = (e) => { this.on = !!e.data.on; };
  }
  process(inputs) {
    const input = inputs[0];
    if (this.on && input && input.length) {
      const l = new Float32Array(input[0]);
      const r = new Float32Array(input[1] ?? input[0]);
      this.port.postMessage({ frame: currentFrame, l, r }, [l.buffer, r.buffer]);
    }
    return true;
  }
}
registerProcessor("stereo-tap", StereoTap);
