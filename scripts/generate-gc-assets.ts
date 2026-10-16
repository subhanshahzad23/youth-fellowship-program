/**
 * Generates the Goodcase concept's bundled media so the site never depends on
 * remote files:
 *  - three placeholder testimonial videos (slides rendered with Playwright,
 *    the real published quote narrated by macOS `say`, encoded with ffmpeg)
 *    with posters and WebVTT captions — clearly labelled as placeholders
 *  - the Open Graph image (src/app/opengraph-image.png)
 *
 * Run: npm run assets
 */
import { chromium, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { TESTIMONIALS } from "../src/lib/content/site";

const ROOT = path.resolve(__dirname, "..");
const MEDIA = path.join(ROOT, "public", "media");
const TMP = path.join(ROOT, ".asset-tmp");
for (const d of [MEDIA, TMP]) fs.mkdirSync(d, { recursive: true });

const FONTS_LINK = `<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=Newsreader:ital,opsz,wght@0,6..72,300;1,6..72,300&display=block" rel="stylesheet">`;

const MARK = `<svg viewBox="0 0 32 32" width="34" height="34"><rect width="32" height="32" rx="8" fill="#fff"/><path d="M22.1 9.9 A8.6 8.6 0 1 0 24.6 16" fill="none" stroke="#000" stroke-width="3.2" stroke-linecap="round"/><path d="M24.6 16 L17.2 16" fill="none" stroke="#00c27a" stroke-width="3.2" stroke-linecap="round"/></svg>`;

async function renderHtml(page: Page, html: string, out: string, w: number, h: number, type: "png" | "jpeg" = "png") {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8">${FONTS_LINK}<style>*{box-sizing:border-box;margin:0}body{width:${w}px;height:${h}px;overflow:hidden;font-family:'DM Sans',sans-serif}</style></head><body>${html}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(200);
  await page.screenshot({ path: out, type, ...(type === "jpeg" ? { quality: 86 } : {}) });
}

const DOTS_DARK = "background:#000;background-image:radial-gradient(rgba(255,255,255,.16) 1px,transparent 1.2px);background-size:22px 22px";

/** Slide 0 is the poster: role, place and the placeholder notice. Later slides carry the quote. */
function slideHtml(t: (typeof TESTIMONIALS)[number], i: number, chunks: string[]) {
  const n = chunks.length + 1;
  const head = `
    <div style="position:absolute;left:96px;top:70px;display:flex;align-items:center;gap:14px;color:#fff;font:600 26px 'DM Sans';letter-spacing:-.03em">${MARK}Goodcase</div>
    <div style="position:absolute;right:96px;top:78px;font:500 15px 'DM Sans';letter-spacing:.16em;text-transform:uppercase;color:#1a1a1a;background:#ffe7a3;padding:8px 14px;border-radius:26px">Placeholder video</div>`;
  const foot = `
    <div style="position:absolute;left:96px;right:96px;bottom:60px;display:flex;align-items:center;gap:18px">
      <div style="flex:1;height:4px;background:#2a2a2a;border-radius:2px;overflow:hidden"><div style="height:100%;width:${((i + 1) / n) * 100}%;background:#00c27a"></div></div>
      <div style="font:500 16px 'DM Sans';color:#8c8c8c">${t.role} · ${t.place}</div>
    </div>`;
  if (i === 0)
    return `<div style="width:1280px;height:720px;${DOTS_DARK};position:relative;color:#fff">${head}
      <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-56%);text-align:center;width:900px">
        <div style="width:150px;height:150px;margin:0 auto;border-radius:50%;background:#1b1b1b;border:2px solid #2f2f2f;display:grid;place-items:center">
          <svg width="74" height="74" viewBox="0 0 24 24" fill="none" stroke="#8c8c8c" stroke-width="1.4"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>
        </div>
        <div style="font:300 64px/1.05 'Newsreader';letter-spacing:-.04em;margin-top:34px">${t.role}, <span style="color:#8c8c8c">${t.place}</span></div>
        <div style="font:400 24px/1.4 'DM Sans';color:#cfcfcf;margin-top:18px">Client testimonial video goes here.</div>
        <div style="font:400 18px/1.4 'DM Sans';color:#8c8c8c;margin-top:8px">The quote is real and published on goodcase.io. Narration is a placeholder voice.</div>
      </div>${foot}</div>`;
  return `<div style="width:1280px;height:720px;${DOTS_DARK};position:relative;color:#fff">${head}
    <div style="position:absolute;left:96px;top:190px;font:300 120px/0.6 'Newsreader';color:#00c27a">“</div>
    <div style="position:absolute;left:96px;right:120px;top:250px;font:italic 300 ${chunks[i - 1].length > 120 ? 50 : 58}px/1.2 'Newsreader';letter-spacing:-.025em">${chunks[i - 1]}</div>
    ${foot}</div>`;
}

function probeDuration(file: string) {
  const out = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", file]).toString().trim();
  return parseFloat(out);
}

function vttTime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = (s % 60).toFixed(3).padStart(6, "0");
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${sec}`;
}

/** Split a quote into 1–2 sentence chunks for slides. */
function chunk(quote: string) {
  const sentences = quote.match(/[^.!?]+[.!?]+/g)?.map((s) => s.trim()) ?? [quote];
  const out: string[] = [];
  for (const s of sentences) {
    const last = out[out.length - 1];
    if (last && last.length + s.length < 150) out[out.length - 1] = `${last} ${s}`;
    else out.push(s);
  }
  return out;
}

async function buildVideos(page: Page) {
  for (const t of TESTIMONIALS) {
    const dir = path.join(TMP, t.id);
    fs.mkdirSync(dir, { recursive: true });
    const chunks = chunk(t.quote);
    const segFiles: string[] = [];
    const cues: string[] = [];
    let clock = 0;
    const segments = [`A note from a ${t.role.toLowerCase()} in ${t.place}.`, ...chunks];
    for (const [i, narration] of segments.entries()) {
      const png = path.join(dir, `slide-${i}.png`);
      await renderHtml(page, slideHtml(t, i, chunks), png, 1280, 720);
      if (i === 0) execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", png, "-q:v", "4", path.join(MEDIA, `testimonial-${t.id}.jpg`)]);
      const aiff = path.join(dir, `seg-${i}.aiff`);
      execFileSync("say", ["-v", "Samantha", "-r", "172", "-o", aiff, narration]);
      const dur = probeDuration(aiff);
      const total = dur + 0.6;
      const mp4 = path.join(dir, `seg-${i}.mp4`);
      execFileSync("ffmpeg", [
        "-y", "-loglevel", "error",
        "-loop", "1", "-framerate", "25", "-i", png,
        "-i", aiff,
        "-filter_complex", `[0:v]scale=1280:720,format=yuv420p,fade=t=in:st=0:d=0.3,fade=t=out:st=${(total - 0.3).toFixed(2)}:d=0.3[v];[1:a]apad=pad_dur=0.6,aresample=44100[a]`,
        "-map", "[v]", "-map", "[a]",
        "-t", total.toFixed(2),
        "-c:v", "libx264", "-preset", "medium", "-tune", "stillimage", "-crf", "30", "-r", "25",
        "-c:a", "aac", "-b:a", "80k", "-ac", "1",
        mp4,
      ]);
      segFiles.push(mp4);
      cues.push(`${vttTime(clock)} --> ${vttTime(clock + dur)}\n${narration}`);
      clock += probeDuration(mp4);
    }
    const list = path.join(dir, "list.txt");
    fs.writeFileSync(list, segFiles.map((f) => `file '${f}'`).join("\n"));
    const out = path.join(MEDIA, `testimonial-${t.id}.mp4`);
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", "-movflags", "+faststart", out]);
    fs.writeFileSync(path.join(MEDIA, `testimonial-${t.id}.vtt`), `WEBVTT\n\n${cues.join("\n\n")}\n`);
    const secs = Math.round(probeDuration(out));
    console.log(`testimonial-${t.id}: ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}, ${(fs.statSync(out).size / 1024).toFixed(0)} KB`);
  }
}

async function buildOgImage(page: Page) {
  const html = `<div style="width:1200px;height:630px;${DOTS_DARK};position:relative;color:#fff;padding:72px 84px">
    <div style="display:flex;align-items:center;gap:14px;font:600 30px 'DM Sans';letter-spacing:-.03em">${MARK}Goodcase</div>
    <div style="font:300 76px/1.04 'Newsreader';letter-spacing:-.045em;margin-top:84px"><span style="color:#8c8c8c">Your strategy. Your signature.</span><br>Our team drafts the rest.</div>
    <div style="position:absolute;left:84px;bottom:66px;display:flex;gap:26px;font:400 22px 'DM Sans';color:#d0d0d0">
      <span>O-1 · EB-1A · EB-2 NIW · H-1B · L-1 · E-2</span><span style="color:#00c27a">Flat fees from $500 per case</span>
    </div>
  </div>`;
  await renderHtml(page, html, path.join(ROOT, "src/app/opengraph-image.png"), 1200, 630);
  fs.writeFileSync(path.join(ROOT, "src/app/opengraph-image.alt.txt"), "Goodcase — Your strategy. Your signature. Our team drafts the rest.");
  console.log("opengraph-image.png");
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await buildOgImage(page);
  if (!process.argv.includes("--skip-video")) await buildVideos(page);
  await browser.close();
  fs.rmSync(TMP, { recursive: true, force: true });
})();
