import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getProduct, getProducts } from "@/lib/products";
import { StatusBadge } from "../status-badge";

export const dynamicParams = false;

export function generateStaticParams() {
  return getProducts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const p = getProduct((await params).slug);
  return p ? { title: p.title, description: p.tagline } : {};
}

export default async function ProductPage({ params }: PageProps<"/[slug]">) {
  const p = getProduct((await params).slug);
  if (!p) notFound();

  return (
    <main className="flex flex-col gap-8">
      <Link href="/" className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> All products
      </Link>
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-muted-foreground">
            Day {String(p.day).padStart(2, "0")} · {p.date}
          </span>
          <StatusBadge status={p.status} />
        </div>
        <h1 className="text-4xl font-semibold tracking-tight">{p.title}</h1>
        {p.tagline && <p className="text-lg text-muted-foreground">{p.tagline}</p>}
        <div className="flex flex-wrap items-center gap-2">
          {p.url && (
            <a href={p.url} className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Open app <ArrowUpRight className="size-3.5" />
            </a>
          )}
          {p.tags.map((t) => (
            <span key={t} className="rounded-full border px-2 py-0.5 font-mono text-xs text-muted-foreground">
              {t}
            </span>
          ))}
        </div>
      </header>
      {p.screenshot && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.screenshot} alt={`${p.title} screenshot`} className="w-full rounded-xl border" />
      )}
      <article className="prose prose-neutral max-w-none dark:prose-invert">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{p.body}</ReactMarkdown>
      </article>
    </main>
  );
}
