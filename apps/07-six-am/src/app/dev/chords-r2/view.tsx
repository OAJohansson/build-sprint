"use client";

import { Ear, type St } from "./ear";

export function View({ st }: { st: St }) {
  return <><Ear st={st} /><style>{"nextjs-portal{display:none}"}</style></>;
}
