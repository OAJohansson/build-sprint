import Link from "next/link";

// shortcut: a holding page until the home page (the latest board's character) is designed.
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-4 p-6">
      <h1 className="text-3xl font-semibold tracking-tight">Selvedge</h1>
      <p className="text-muted-foreground">
        Install this app (Chrome menu, Install app), then share from Instagram, Pinterest or your
        gallery and choose Selvedge.
      </p>
      <div className="flex gap-5">
        <Link href="/inbox" className="underline underline-offset-4">Open your inbox</Link>
        <Link href="/board" className="underline underline-offset-4">Make a board</Link>
      </div>
    </main>
  );
}
