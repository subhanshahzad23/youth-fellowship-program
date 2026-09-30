/**
 * Generates every bundled demo asset so the app never depends on remote media:
 *  - watermarked, fictional proof-of-residence samples (PDF + PNG)
 *  - worksheet PDFs from the curriculum WORKSHEETS specs
 *  - message/submission sample attachments
 *  - narrated session videos (slides rendered with Playwright, narration via
 *    macOS `say`, encoded with ffmpeg) + WebVTT captions + a manifest
 *
 * Run: npx tsx --tsconfig tsconfig.json scripts/generate-assets.ts [--skip-video]
 */
import { chromium, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, degrees, type PDFFont, type PDFPage } from "pdf-lib";
import { VIDEO_SCRIPTS, WORKSHEETS, CURRICULUM } from "../src/lib/seed/curriculum";

const ROOT = path.resolve(__dirname, "..");
const PUB = path.join(ROOT, "public");
const SAMPLES = path.join(PUB, "samples");
const WS_DIR = path.join(SAMPLES, "worksheets");
const ATT_DIR = path.join(SAMPLES, "attachments");
const MEDIA = path.join(PUB, "media");
const TMP = path.join(ROOT, ".asset-tmp");
for (const d of [SAMPLES, WS_DIR, ATT_DIR, MEDIA, TMP]) fs.mkdirSync(d, { recursive: true });

const JADE = rgb(0, 0.76, 0.48);
const INK = rgb(0.07, 0.07, 0.07);
const MUTED = rgb(0.38, 0.38, 0.38);
const LINE = rgb(0.86, 0.88, 0.9);

const FONTS_LINK = `<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=Newsreader:opsz,wght@6..72,300;6..72,400&display=block" rel="stylesheet">`;

/* ------------------------------------------------------------------ */
/* PDF helpers                                                         */
/* ------------------------------------------------------------------ */

function wrap(text: string, font: PDFFont, size: number, max: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) > max && cur) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}

function watermark(page: PDFPage, font: PDFFont) {
  const { width, height } = page.getSize();
  page.drawText("SAMPLE — FICTIONAL DEMO DOCUMENT", {
    x: width * 0.12,
    y: height * 0.28,
    size: 34,
    font,
    color: rgb(0.9, 0.2, 0.2),
    opacity: 0.16,
    rotate: degrees(38),
  });
}

function footer(page: PDFPage, font: PDFFont, text: string) {
  page.drawText(text, { x: 48, y: 28, size: 8, font, color: MUTED });
}

function brandHeader(page: PDFPage, bold: PDFFont, regular: PDFFont, label: string) {
  const { width, height } = page.getSize();
  page.drawRectangle({ x: 0, y: height - 64, width, height: 64, color: INK });
  page.drawRectangle({ x: 48, y: height - 42, width: 14, height: 14, color: JADE });
  page.drawText("Launchpad Fellowship", { x: 70, y: height - 40, size: 13, font: bold, color: rgb(1, 1, 1) });
  page.drawText(label.toUpperCase(), { x: width - 48 - regular.widthOfTextAtSize(label.toUpperCase(), 8), y: height - 38, size: 8, font: regular, color: rgb(0.7, 0.7, 0.7) });
}

async function utilityBill() {
  const pdf = await PDFDocument.create();
  pdf.setTitle("Sample utility bill — fictional");
  const page = pdf.addPage([595, 842]);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const reg = await pdf.embedFont(StandardFonts.Helvetica);
  const { height } = page.getSize();
  page.drawRectangle({ x: 0, y: height - 90, width: 595, height: 90, color: rgb(0.13, 0.36, 0.73) });
  page.drawText("Larkhaven Water & Light Co.", { x: 48, y: height - 50, size: 18, font: bold, color: rgb(1, 1, 1) });
  page.drawText("A fictional utility for demonstration only", { x: 48, y: height - 70, size: 9, font: reg, color: rgb(0.85, 0.9, 1) });
  let y = height - 140;
  const line = (label: string, value: string, b = false) => {
    page.drawText(label, { x: 48, y, size: 10, font: reg, color: MUTED });
    page.drawText(value, { x: 220, y, size: 10, font: b ? bold : reg, color: INK });
    y -= 20;
  };
  page.drawText("Statement", { x: 48, y, size: 16, font: bold, color: INK });
  y -= 30;
  line("Account holder", "A. Sample Applicant");
  line("Service address", "14 Alder Row, Eastbank, Larkhaven 00212");
  line("Statement date", "September 18, 2026");
  line("Account number", "DEMO-0000-0000 (not a real account)");
  y -= 14;
  page.drawLine({ start: { x: 48, y }, end: { x: 547, y }, thickness: 1, color: LINE });
  y -= 26;
  page.drawText("Charges this period", { x: 48, y, size: 12, font: bold, color: INK });
  y -= 24;
  line("Water service", "$18.40");
  line("Electricity", "$41.75");
  line("Community solar credit", "-$6.00");
  line("Total due", "$54.15", true);
  y -= 30;
  const note = "This document is bundled with the Launchpad Fellowship demo so the application walkthrough needs no personal files. It contains no real names, account numbers or identity numbers.";
  for (const l of wrap(note, reg, 9, 499)) {
    page.drawText(l, { x: 48, y, size: 9, font: reg, color: MUTED });
    y -= 13;
  }
  watermark(page, bold);
  footer(page, reg, "Launchpad Fellowship demo · fictional sample document");
  fs.writeFileSync(path.join(SAMPLES, "proof-of-residence-utility-bill.pdf"), await pdf.save());
}

async function tenancyLetter() {
  const pdf = await PDFDocument.create();
  pdf.setTitle("Sample tenancy letter — fictional");
  const page = pdf.addPage([595, 842]);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const reg = await pdf.embedFont(StandardFonts.Helvetica);
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const { height } = page.getSize();
  page.drawText("Harborside Housing Cooperative (fictional)", { x: 48, y: height - 70, size: 14, font: bold, color: INK });
  page.drawText("22 Pier Row, Harborside, Larkhaven 00214", { x: 48, y: height - 88, size: 9, font: reg, color: MUTED });
  let y = height - 140;
  const paras = [
    "October 2, 2026",
    "To whom it may concern,",
    "This letter confirms that the named resident has lived at 61 Rope Walk, Eastbank, Larkhaven 00212 since March 2024 as a member household of the cooperative, and that the tenancy is current.",
    "Please contact the cooperative office if you need any further information.",
    "Sincerely,",
    "J. Example, Tenancy Officer (fictional)",
  ];
  for (const p of paras) {
    for (const l of wrap(p, serif, 12, 499)) {
      page.drawText(l, { x: 48, y, size: 12, font: serif, color: INK });
      y -= 18;
    }
    y -= 12;
  }
  watermark(page, bold);
  footer(page, reg, "Launchpad Fellowship demo · fictional sample document · no real people or identity numbers");
  fs.writeFileSync(path.join(SAMPLES, "proof-of-residence-tenancy-letter.pdf"), await pdf.save());
}

async function worksheetPdf(spec: (typeof WORKSHEETS)[number]) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(spec.title);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const reg = await pdf.embedFont(StandardFonts.Helvetica);
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  let page = pdf.addPage([595, 842]);
  brandHeader(page, bold, reg, "Worksheet");
  let y = 842 - 110;
  page.drawText(spec.title, { x: 48, y, size: 26, font: serif, color: INK });
  y -= 26;
  for (const l of wrap(spec.intro, reg, 10.5, 499)) {
    page.drawText(l, { x: 48, y, size: 10.5, font: reg, color: MUTED });
    y -= 15;
  }
  y -= 10;
  const newPage = () => {
    footer(page, reg, `Launchpad Fellowship · ${spec.title} · fictional demo content`);
    page = pdf.addPage([595, 842]);
    brandHeader(page, bold, reg, "Worksheet");
    y = 842 - 100;
  };
  spec.sections.forEach((sec, si) => {
    if (y < 200) newPage();
    page.drawRectangle({ x: 48, y: y - 6, width: 499, height: 26, color: rgb(0.953, 0.953, 0.953) });
    page.drawText(`${si + 1}. ${sec.heading}`, { x: 58, y: y + 2, size: 12, font: bold, color: INK });
    y -= 30;
    for (const prompt of sec.prompts) {
      const lines = wrap(prompt, reg, 10, 489);
      if (y - lines.length * 14 - 60 < 60) newPage();
      for (const l of lines) {
        page.drawText(l, { x: 58, y, size: 10, font: reg, color: INK });
        y -= 14;
      }
      y -= 6;
      for (let i = 0; i < 3; i++) {
        page.drawLine({ start: { x: 58, y }, end: { x: 547, y }, thickness: 0.6, color: LINE });
        y -= 18;
      }
      y -= 6;
    }
    y -= 6;
  });
  footer(page, reg, `Launchpad Fellowship · ${spec.title} · fictional demo content`);
  fs.writeFileSync(path.join(WS_DIR, spec.fileName), await pdf.save());
}

async function tallySheet() {
  const pdf = await PDFDocument.create();
  pdf.setTitle("Pop-up repair tally sheet — fictional");
  const page = pdf.addPage([595, 842]);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const reg = await pdf.embedFont(StandardFonts.Helvetica);
  brandHeader(page, bold, reg, "Fellow attachment");
  let y = 842 - 110;
  page.drawText("Porchlight Repair — pop-up tally, Rope Walk courtyard", { x: 48, y, size: 15, font: bold, color: INK });
  y -= 30;
  const rows = [
    ["Item", "Fixed?", "Visitor", "Notes"],
    ["Desk lamp", "Yes", "Stranger", "Loose wire"],
    ["Kettle", "Yes", "Stranger", "Descaled + new switch"],
    ["Bike chain", "Yes", "Neighbor", "Re-linked"],
    ["Toaster", "No", "Stranger", "Needs part — follow up"],
    ["Floor lamp", "Yes", "Stranger", "New plug"],
    ["Radio", "Yes", "Neighbor", "Battery contacts"],
    ["Kettle", "Yes", "Stranger", "Lid hinge"],
    ["Fan", "No", "Stranger", "Motor — recommend recycling"],
  ];
  for (const [i, r] of rows.entries()) {
    const f = i === 0 ? bold : reg;
    [48, 190, 270, 360].forEach((x, ci) => page.drawText(r[ci], { x, y, size: 10, font: f, color: INK }));
    y -= 8;
    page.drawLine({ start: { x: 48, y }, end: { x: 547, y }, thickness: 0.5, color: LINE });
    y -= 14;
  }
  y -= 10;
  page.drawText("Visitors: 14 (9 strangers) · Repairs completed: 9 of 11 items", { x: 48, y, size: 10, font: bold, color: INK });
  footer(page, reg, "Launchpad Fellowship demo · fictional attachment");
  fs.writeFileSync(path.join(ATT_DIR, "popup-tally-sheet.pdf"), await pdf.save());
}

async function interviewNotes() {
  const pdf = await PDFDocument.create();
  pdf.setTitle("Customer interview notes — fictional sample");
  const page = pdf.addPage([595, 842]);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const reg = await pdf.embedFont(StandardFonts.Helvetica);
  brandHeader(page, bold, reg, "Sample attachment");
  let y = 842 - 110;
  page.drawText("Customer interview notes (sample)", { x: 48, y, size: 18, font: bold, color: INK });
  y -= 28;
  const notes = [
    "Interview 1 — renter, Eastbank. Last broken item: a lamp left in the hallway. Didn't know anyone who could fix it.",
    "Interview 2 — retired homeowner. Keeps broken appliances in the shed. Frustrated by carrying things across town.",
    "Interview 3 — student. Replaced a $25 kettle rather than look for a repair shop. Would come to a monthly repair day.",
    "Pattern: people don't lack willingness, they lack a nearby, trusted place and the tools.",
  ];
  for (const n of notes) {
    for (const l of wrap(n, reg, 11, 499)) {
      page.drawText(l, { x: 48, y, size: 11, font: reg, color: INK });
      y -= 16;
    }
    y -= 10;
  }
  footer(page, reg, "Launchpad Fellowship demo · fictional sample attachment for assignment submissions");
  fs.writeFileSync(path.join(SAMPLES, "sample-interview-notes.pdf"), await pdf.save());
}

/* ------------------------------------------------------------------ */
/* HTML-rendered images                                                */
/* ------------------------------------------------------------------ */

async function renderHtml(page: Page, html: string, out: string, w: number, h: number, type: "png" | "jpeg" = "png") {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8">${FONTS_LINK}<style>*{box-sizing:border-box;margin:0}body{width:${w}px;height:${h}px;overflow:hidden;font-family:'DM Sans',sans-serif}</style></head><body>${html}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  await page.screenshot({ path: out, type, ...(type === "jpeg" ? { quality: 86 } : {}) });
}

const schoolLetterHtml = `
<div style="width:100%;height:100%;background:#fff;padding:64px 72px;position:relative;font-family:'Newsreader',serif;color:#111">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #111;padding-bottom:18px">
    <div><div style="font:600 22px 'DM Sans'">Eastbank High School</div><div style="font:400 13px 'DM Sans';color:#555">Fictional school · 5 College Lane, Eastbank, Larkhaven 00212</div></div>
    <div style="font:500 12px 'DM Sans';letter-spacing:.2em;color:#555">ENROLLMENT LETTER</div>
  </div>
  <p style="margin-top:40px;font-size:19px;line-height:1.6">October 6, 2026</p>
  <p style="margin-top:24px;font-size:19px;line-height:1.6">To whom it may concern,</p>
  <p style="margin-top:16px;font-size:19px;line-height:1.6">This letter confirms that the named student is enrolled at Eastbank High School for the 2026–27 school year and that the home address held on our records is <b>9 Pier Row, Harborside, Larkhaven 00214</b>.</p>
  <p style="margin-top:16px;font-size:19px;line-height:1.6">Kind regards,<br>M. Placeholder, Registrar (fictional)</p>
  <div style="position:absolute;left:40px;right:40px;top:44%;transform:rotate(-24deg);text-align:center;font:700 44px 'DM Sans';color:rgba(220,40,40,.16);letter-spacing:.06em">SAMPLE — FICTIONAL DEMO DOCUMENT</div>
  <div style="position:absolute;bottom:28px;left:72px;font:400 11px 'DM Sans';color:#777">Launchpad Fellowship demo · no real people, addresses or identity numbers</div>
</div>`;

const ideaSketchHtml = `
<div style="width:100%;height:100%;background:#fafafa;background-image:radial-gradient(rgba(0,0,0,.12) 1px,transparent 1.2px);background-size:22px 22px;position:relative;padding:40px">
  <div style="font:500 12px 'DM Sans';letter-spacing:.2em;color:#626262">IDEA SKETCH · SAMPLE</div>
  <div style="font:300 44px 'Newsreader';letter-spacing:-.03em;margin-top:8px">Second Shelf</div>
  <div style="position:absolute;left:60px;top:170px;width:220px;height:170px;background:#ffe146;padding:18px;transform:rotate(-3deg);box-shadow:0 8px 16px rgba(0,0,0,.08);font:500 18px 'DM Sans'">Students drop off last year's books at the library desk</div>
  <div style="position:absolute;left:330px;top:150px;width:220px;height:170px;background:#b4f5c8;padding:18px;transform:rotate(2deg);box-shadow:0 8px 16px rgba(0,0,0,.08);font:500 18px 'DM Sans'">We grade condition with photos (A / B / C)</div>
  <div style="position:absolute;left:600px;top:180px;width:220px;height:170px;background:#bed7ff;padding:18px;transform:rotate(-1deg);box-shadow:0 8px 16px rgba(0,0,0,.08);font:500 18px 'DM Sans'">Buyers pick up in the common room — pay by card</div>
  <svg style="position:absolute;left:280px;top:240px" width="60" height="30"><path d="M2 15 C 20 5, 40 25, 56 15" stroke="#111" stroke-width="2" fill="none"/><path d="M48 8 L56 15 L48 22" stroke="#111" stroke-width="2" fill="none"/></svg>
  <svg style="position:absolute;left:550px;top:240px" width="60" height="30"><path d="M2 15 C 20 5, 40 25, 56 15" stroke="#111" stroke-width="2" fill="none"/><path d="M48 8 L56 15 L48 22" stroke="#111" stroke-width="2" fill="none"/></svg>
  <div style="position:absolute;left:90px;bottom:60px;font:400 16px 'DM Sans';color:#333">Goal for June: 100 books swapped, 30% cheaper than new.</div>
  <div style="position:absolute;right:30px;bottom:24px;font:400 11px 'DM Sans';color:#888">Fictional sample file · Launchpad demo</div>
</div>`;

const standHtml = `
<div style="width:100%;height:100%;background:#f3f3f3;display:flex;align-items:center;justify-content:center;position:relative">
  <svg width="420" height="300" viewBox="0 0 420 300"><rect x="110" y="40" width="200" height="150" rx="10" fill="#fff" stroke="#111" stroke-width="3"/><text x="210" y="100" text-anchor="middle" font-family="DM Sans" font-size="22" font-weight="600">Slotly</text><text x="210" y="130" text-anchor="middle" font-family="DM Sans" font-size="14">Scan to book</text><rect x="175" y="140" width="70" height="36" fill="#111"/><path d="M150 190 L120 260 L300 260 L270 190" fill="#dce1e5" stroke="#111" stroke-width="3"/><path d="M95 262 L325 262" stroke="#111" stroke-width="5" stroke-linecap="round"/><text x="210" y="290" text-anchor="middle" font-family="DM Sans" font-size="12" fill="#626262">v2: wider base (was wobbling)</text></svg>
  <div style="position:absolute;left:24px;top:20px;font:500 11px 'DM Sans';letter-spacing:.2em;color:#626262">PROTOTYPE PHOTO · FICTIONAL</div>
</div>`;

/* ------------------------------------------------------------------ */
/* Videos                                                              */
/* ------------------------------------------------------------------ */

const TRACK_LABEL: Record<string, string> = { ff: "Founder Foundations", vb: "Venture Building", li: "Leadership & Impact" };

function slideHtml(videoTitle: string, trackKey: string, seg: { slideTitle: string; slideBody: string }, i: number, n: number) {
  const dark = i === 0;
  const bg = dark
    ? "background:#000;background-image:radial-gradient(rgba(255,255,255,.16) 1px,transparent 1.2px);background-size:22px 22px;color:#fff"
    : "background:#fff;background-image:radial-gradient(rgba(0,0,0,.1) 1px,transparent 1.2px);background-size:22px 22px;color:#000";
  const notes = ["#ffe146", "#b4f5c8", "#bed7ff", "#ff98b4", "#e6bfff"];
  return `
  <div style="width:1280px;height:720px;${bg};position:relative;padding:72px 88px">
    <div style="display:flex;align-items:center;gap:12px;font:500 14px 'DM Sans';letter-spacing:.2em;text-transform:uppercase;color:${dark ? "#8c8c8c" : "#626262"}">
      <span style="width:14px;height:14px;background:#00c27a;display:inline-block;border-radius:3px"></span>Launchpad · ${TRACK_LABEL[trackKey]}
    </div>
    ${dark ? `<div style="font:300 34px 'Newsreader';color:#8c8c8c;margin-top:120px;letter-spacing:-.02em">${videoTitle}</div>` : ""}
    <div style="font:300 ${dark ? 92 : 80}px/1.02 'Newsreader';letter-spacing:-.045em;margin-top:${dark ? 10 : 110}px;max-width:900px">${seg.slideTitle}</div>
    <div style="font:400 30px/1.4 'DM Sans';margin-top:34px;max-width:${dark ? 860 : 720}px;color:${dark ? "#d0d0d0" : "#333"}">${seg.slideBody}</div>
    ${!dark ? `<div style="position:absolute;right:96px;top:230px;width:220px;height:200px;background:${notes[i % notes.length]};transform:rotate(${i % 2 ? 3 : -3}deg);box-shadow:0 14px 30px rgba(0,0,0,.08);padding:22px;font:500 22px/1.3 'DM Sans';color:#000">${String(i).padStart(2, "0")}<div style="margin-top:14px;height:3px;background:rgba(0,0,0,.6);width:70%"></div><div style="margin-top:12px;height:3px;background:rgba(0,0,0,.4);width:55%"></div><div style="margin-top:12px;height:3px;background:rgba(0,0,0,.4);width:62%"></div></div>` : ""}
    <div style="position:absolute;left:88px;right:88px;bottom:56px;display:flex;align-items:center;gap:18px">
      <div style="flex:1;height:4px;background:${dark ? "#2a2a2a" : "#e5e5e5"};border-radius:2px;overflow:hidden"><div style="height:100%;width:${((i + 1) / n) * 100}%;background:#00c27a"></div></div>
      <div style="font:500 16px 'DM Sans';color:${dark ? "#8c8c8c" : "#626262"}">${i + 1} / ${n}</div>
    </div>
    <div style="position:absolute;right:88px;top:74px;font:400 13px 'DM Sans';color:${dark ? "#666" : "#999"}">Fictional demo content</div>
  </div>`;
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

async function buildVideos(page: Page) {
  const manifest: Record<string, unknown> = {};
  for (const script of VIDEO_SCRIPTS) {
    const trackKey = script.id.split("-")[0];
    const dir = path.join(TMP, script.id);
    fs.mkdirSync(dir, { recursive: true });
    const segFiles: string[] = [];
    const transcript: { t: number; text: string }[] = [];
    const cues: string[] = [];
    let t = 0;
    for (const [i, seg] of script.segments.entries()) {
      const png = path.join(dir, `slide-${i}.png`);
      await renderHtml(page, slideHtml(script.title, trackKey, seg, i, script.segments.length), png, 1280, 720);
      if (i === 0) execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", png, "-q:v", "4", path.join(MEDIA, `${script.id}-poster.jpg`)]);
      const aiff = path.join(dir, `seg-${i}.aiff`);
      execFileSync("say", ["-v", "Samantha", "-r", "178", "-o", aiff, seg.narration]);
      const dur = probeDuration(aiff);
      const total = dur + 0.7;
      const mp4 = path.join(dir, `seg-${i}.mp4`);
      execFileSync("ffmpeg", [
        "-y", "-loglevel", "error",
        "-loop", "1", "-framerate", "25", "-i", png,
        "-i", aiff,
        "-filter_complex", `[0:v]scale=1280:720,format=yuv420p,fade=t=in:st=0:d=0.35,fade=t=out:st=${(total - 0.35).toFixed(2)}:d=0.35[v];[1:a]apad=pad_dur=0.7,aresample=44100[a]`,
        "-map", "[v]", "-map", "[a]",
        "-t", total.toFixed(2),
        "-c:v", "libx264", "-preset", "medium", "-tune", "stillimage", "-crf", "30", "-r", "25",
        "-c:a", "aac", "-b:a", "80k", "-ac", "1",
        mp4,
      ]);
      segFiles.push(mp4);
      // Sentence-level transcript + captions, timed proportionally within the segment
      const sentences = seg.narration.match(/[^.!?]+[.!?]+/g)?.map((s) => s.trim()) ?? [seg.narration];
      const totalChars = sentences.reduce((n, s) => n + s.length, 0);
      let st = t;
      for (const s of sentences) {
        const d = (s.length / totalChars) * dur;
        transcript.push({ t: Math.round(st * 10) / 10, text: s });
        cues.push(`${vttTime(st)} --> ${vttTime(st + d)}\n${s}`);
        st += d;
      }
      t += probeDuration(mp4);
    }
    const list = path.join(dir, "list.txt");
    fs.writeFileSync(list, segFiles.map((f) => `file '${f}'`).join("\n"));
    const out = path.join(MEDIA, `${script.id}.mp4`);
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", "-movflags", "+faststart", out]);
    fs.writeFileSync(path.join(MEDIA, `${script.id}.vtt`), `WEBVTT\n\n${cues.join("\n\n")}\n`);
    const durationSec = Math.round(probeDuration(out));
    manifest[script.id] = { src: `/media/${script.id}.mp4`, poster: `/media/${script.id}-poster.jpg`, captions: `/media/${script.id}.vtt`, durationSec, transcript };
    console.log(`video ${script.id}: ${durationSec}s, ${(fs.statSync(out).size / 1024).toFixed(0)} KB`);
  }
  fs.writeFileSync(path.join(ROOT, "src/lib/seed/video-manifest.json"), JSON.stringify(manifest, null, 2));
}

/* ------------------------------------------------------------------ */

async function main() {
  const skipVideo = process.argv.includes("--skip-video");
  await utilityBill();
  await tenancyLetter();
  await tallySheet();
  await interviewNotes();
  for (const ws of WORKSHEETS) await worksheetPdf(ws);
  // Check every worksheet referenced by the curriculum exists
  const missing: string[] = [];
  for (const m of CURRICULUM) for (const s of m.sessions) for (const b of s.blocks) if (b.type === "file" && !fs.existsSync(path.join(PUB, b.href))) missing.push(b.href);
  if (missing.length) throw new Error(`Missing worksheet files: ${missing.join(", ")}`);

  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  await renderHtml(page, schoolLetterHtml, path.join(SAMPLES, "proof-of-residence-school-letter.png"), 900, 1160);
  await renderHtml(page, ideaSketchHtml, path.join(SAMPLES, "idea-sketch-sample.png"), 900, 560);
  await renderHtml(page, standHtml, path.join(ATT_DIR, "stand-prototype.png"), 800, 520);
  if (!skipVideo) await buildVideos(page);
  await browser.close();
  fs.rmSync(TMP, { recursive: true, force: true });
  console.log("assets done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
