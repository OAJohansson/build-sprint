import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getProducts } from "@/lib/products";
import { site } from "@/lib/site";
import { StatusBadge } from "./status-badge";

export default function Home() {
  const products = getProducts();
  const shipped = products.filter((p) => p.status === "shipped").length;

  return (
    <main className="flex flex-col gap-12">
      <header className="flex flex-col gap-4">
        <p className="font-mono text-sm text-muted-foreground">{site.name}</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{site.headline}</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">{site.intro}</p>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="font-mono">
            {shipped}/{site.total} shipped
          </span>
          <div className="h-1.5 w-40 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-foreground" style={{ width: `${(shipped / site.total) * 100}%` }} />
          </div>
          {[{ label: "Source", href: site.repo }, ...site.links].map((l) => (
            <a key={l.href} href={l.href} className="text-muted-foreground underline-offset-4 hover:underline">
              {l.label}
            </a>
          ))}
        </div>
      </header>

      {products.length === 0 ? (
        <p className="text-muted-foreground">Day 1 starts soon.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {products.map((p) => (
            <li key={p.slug} className="group relative flex flex-col gap-3 rounded-xl border bg-card p-5 transition-colors hover:bg-accent/50">
              {p.screenshot && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.screenshot} alt="" className="aspect-video w-full rounded-md border object-cover object-top" />
              )}
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-muted-foreground">Day {String(p.day).padStart(2, "0")}</span>
                <StatusBadge status={p.status} />
              </div>
              <div>
                <h2 className="font-semibold">
                  <Link href={`/${p.slug}`} className="after:absolute after:inset-0">
                    {p.title}
                  </Link>
                </h2>
                {p.problem && <p className="mt-1 text-sm text-muted-foreground">{p.problem}</p>}
              </div>
              {p.url && (
                <a href={p.url} className="relative z-10 mt-auto inline-flex w-fit items-center gap-1 text-sm font-medium underline-offset-4 hover:underline">
                  Open app <ArrowUpRight className="size-3.5" />
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
