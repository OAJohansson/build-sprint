export type Feedback = {
  /** What's working, quoting the writer's words. */
  strength: string;
  /** One concrete thing to try next time: the what. */
  tryNext: string;
  /** The craft behind it: the how, with a name and a tiny example. (Missing on early sample feedback.) */
  craft?: string;
  /** A few words to carry into the next piece: "end on an image, not a feeling". */
  lesson?: string;
};

export type Piece = {
  id: string;
  prompt: string;
  body: string;
  status: "draft" | "done";
  feedback: Feedback | null;
  createdAt: string;
  updatedAt: string;
  finishedAt: string | null;
};

/** What the client sends when saving: the server owns the timestamps. */
export type PieceInput = Pick<Piece, "prompt" | "body" | "status" | "feedback">;
