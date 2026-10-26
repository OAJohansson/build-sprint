// demucs-web 1.0.2 ships plain JS; only what the Lab uses.
declare module "demucs-web" {
  type Spec = { leftReal: Float32Array; leftImag: Float32Array; rightReal: Float32Array; rightImag: Float32Array };
  export const CONSTANTS: { SAMPLE_RATE: number; TRAINING_SAMPLES: number; TRACKS: string[]; DEFAULT_MODEL_URL: string };
  export function prepareModelInput(left: Float32Array, right: Float32Array): { waveform: Float32Array; magSpec: Float32Array };
  export function standaloneMask(freq: Float32Array): Spec[];
  export function standaloneIspec(spec: Spec, length: number): { left: Float32Array; right: Float32Array };
}
