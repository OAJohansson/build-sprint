import Link from "next/link";

// shortcut: a holding page for the share-target spike, replace with the inbox.
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-4 p-6">
      <h1 className="text-3xl font-semibold tracking-tight">Selvedge</h1>
      <p className="text-muted-foreground">
        Install this app (Chrome menu, Install app), then share from Instagram, Pinterest or your
        gallery and choose Selvedge.
      </p>
      <Link href="/probe" className="underline underline-offset-4">
        See what arrived
      </Link>
    </main>
  );
}
