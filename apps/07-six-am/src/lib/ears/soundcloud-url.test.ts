import { describe, expect, it } from "vitest";
import { parseSoundCloudList, parseSoundCloudUrl } from "./soundcloud-url";

const ok = (input: string) => {
  const p = parseSoundCloudUrl(input);
  if (!p.ok) throw new Error(`${input}: ${p.message}`);
  return p;
};
const reason = (input: string) => {
  const p = parseSoundCloudUrl(input);
  return p.ok ? "ok" : p.reason;
};

describe("parseSoundCloudUrl", () => {
  it("reads a plain track", () => {
    expect(ok("https://soundcloud.com/fovosmusic/fovos-work-edit-extended")).toMatchObject({
      kind: "track",
      url: "https://soundcloud.com/fovosmusic/fovos-work-edit-extended",
      user: "fovosmusic",
      slug: "fovos-work-edit-extended",
    });
  });
  it("reads a set", () => {
    expect(ok("https://soundcloud.com/andreas-johansson-303905204/sets/b-b-baaangers")).toMatchObject({
      kind: "set",
      url: "https://soundcloud.com/andreas-johansson-303905204/sets/b-b-baaangers",
      slug: "b-b-baaangers",
    });
  });
  it("drops ?si= and utm_ tracking", () => {
    expect(ok("https://soundcloud.com/carbune/lost-in-the-loop-o-deibys?si=0f3a9c1b2d4e4f&utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing").url).toBe(
      "https://soundcloud.com/carbune/lost-in-the-loop-o-deibys",
    );
    expect(ok("https://soundcloud.com/a/sets/b?si=x&utm_source=y").url).toBe("https://soundcloud.com/a/sets/b");
  });
  it("keeps the ?in= playlist as context, not as the target", () => {
    const p = ok("https://soundcloud.com/retrouve/music-is-the-answer?in=andreas-johansson-303905204/sets/b-b-baaangers&si=abc");
    expect(p.kind).toBe("track");
    expect(p.url).toBe("https://soundcloud.com/retrouve/music-is-the-answer");
    expect(p.inSet).toBe("andreas-johansson-303905204/sets/b-b-baaangers");
  });
  it("accepts m.soundcloud.com, www., http and no scheme", () => {
    expect(ok("https://m.soundcloud.com/djmikeq/beyonce-alien-superstar-mikeq-x-dj-fade-remix-dirty").url).toBe(
      "https://soundcloud.com/djmikeq/beyonce-alien-superstar-mikeq-x-dj-fade-remix-dirty",
    );
    expect(ok("http://www.soundcloud.com/a/b/").url).toBe("https://soundcloud.com/a/b");
    expect(ok("soundcloud.com/a/b").url).toBe("https://soundcloud.com/a/b");
  });
  it("keeps a secret share token", () => {
    expect(ok("https://soundcloud.com/a/b/s-AbC123?si=1").url).toBe("https://soundcloud.com/a/b/s-AbC123");
    expect(ok("https://soundcloud.com/a/sets/c/s-XyZ9").url).toBe("https://soundcloud.com/a/sets/c/s-XyZ9");
  });
  it("passes on.soundcloud.com short links through for the widget to resolve", () => {
    expect(ok("https://on.soundcloud.com/Ab12Cd34?si=1")).toMatchObject({ kind: "short", url: "https://on.soundcloud.com/Ab12Cd34" });
    expect(reason("https://on.soundcloud.com/")).toBe("invalid");
  });
  it("reads api track and playlist links", () => {
    expect(ok("https://api.soundcloud.com/tracks/1199999842")).toMatchObject({ kind: "track", trackId: "1199999842" });
    expect(ok("https://api.soundcloud.com/playlists/123").kind).toBe("set");
  });
  it("rejects profiles, tabs and SoundCloud pages", () => {
    expect(reason("https://soundcloud.com/fovosmusic")).toBe("not-a-track");
    expect(reason("https://soundcloud.com/fovosmusic/likes")).toBe("not-a-track");
    expect(reason("https://soundcloud.com/fovosmusic/sets")).toBe("not-a-track");
    expect(reason("https://soundcloud.com/discover")).toBe("not-a-track");
    expect(reason("https://soundcloud.com/search?q=house")).toBe("not-a-track");
    expect(reason("https://soundcloud.com/a/b/comments")).toBe("not-a-track");
  });
  it("rejects junk", () => {
    expect(reason("")).toBe("empty");
    expect(reason("   ")).toBe("empty");
    expect(reason("hello there")).toBe("invalid");
    expect(reason("https://open.spotify.com/track/123")).toBe("not-soundcloud");
    expect(reason("https://soundcloud.com.evil.com/a/b")).toBe("not-soundcloud");
    expect(reason("javascript:alert(1)")).toBe("invalid");
    expect(reason("ftp://soundcloud.com/a/b")).toBe("invalid");
  });
});

describe("parseSoundCloudList", () => {
  it("splits lines, drops duplicates and reports junk", () => {
    const r = parseSoundCloudList("https://soundcloud.com/a/b?si=1\nsoundcloud.com/a/b\n\nnope\nhttps://soundcloud.com/c/d");
    expect(r.valid.map((v) => v.url)).toEqual(["https://soundcloud.com/a/b", "https://soundcloud.com/c/d"]);
    expect(r.invalid.map((i) => i.input)).toEqual(["nope"]);
  });
});
