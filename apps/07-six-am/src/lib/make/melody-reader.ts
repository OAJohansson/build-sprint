// L245: which note reader Melody uses, one flag. "basic-pitch": Spotify's Basic Pitch model in the worker
// (notes-bp.ts, the time-boxed try); "dsp": the spike's reader (notes-read.ts). Both give a NotesReading,
// so everything after the read (rows, doubtful rules, Suggest, Save) is the same.
export const MELODY_READER: "dsp" | "basic-pitch" = "basic-pitch";
