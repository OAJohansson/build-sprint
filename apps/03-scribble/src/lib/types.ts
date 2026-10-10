export type Feedback = { strength: string; tryNext: string };

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
