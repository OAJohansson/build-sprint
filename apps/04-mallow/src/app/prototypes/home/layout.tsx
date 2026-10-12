import { Fraunces } from "next/font/google";
import "./proto.css";
import "./picker.css";

const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] });

export default function PrototypeLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${fraunces.variable} mallow`}>{children}</div>;
}
