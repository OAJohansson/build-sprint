// Ears AudioWorklet: hands mono PCM blocks to the page while "on". Never connected to the output,
// never recorded: the page keeps the blocks in memory for one analysis and then drops them.
class PcmTap extends AudioWorkletProcessor {
  constructor() {
    super();
    this.on = false;
    this.port.onmessage = (e) => { this.on = !!e.data.on; };
  }
  process(inputs) {
    const input = inputs[0];
    if (this.on && input && input.length) {
      const n = input[0].length;
      const mono = new Float32Array(n);
      for (let c = 0; c < input.length; c++) {
        const ch = input[c];
        for (let i = 0; i < n; i++) mono[i] += ch[i] / input.length;
      }
      this.port.postMessage(mono, [mono.buffer]);
    }
    return true;
  }
}
registerProcessor("pcm-tap", PcmTap);
