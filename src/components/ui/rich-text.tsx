import Link from "next/link";
import { parseInline } from "@/lib/utils";

/** Renders lightweight inline markdown (**bold**, *italic*, [link](url)) without HTML injection. */
export function Inline({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((seg, i) => {
        if (seg.kind === "bold") return <strong key={i}>{seg.text}</strong>;
        if (seg.kind === "italic") return <em key={i}>{seg.text}</em>;
        if (seg.kind === "link" && seg.href) {
          const internal = seg.href.startsWith("/");
          return internal ? (
            <Link key={i} href={seg.href} className="underline underline-offset-2">
              {seg.text}
            </Link>
          ) : (
            <a key={i} href={seg.href} target="_blank" rel="noreferrer" className="underline underline-offset-2">
              {seg.text}
            </a>
          );
        }
        return <span key={i}>{seg.text}</span>;
      })}
    </>
  );
}

/** Paragraphs separated by blank lines; single newlines become line breaks. */
export function Paragraphs({ text, className }: { text: string; className?: string }) {
  const paras = text.split(/\n{2,}/).filter((p) => p.trim());
  return (
    <>
      {paras.map((p, i) => (
        <p key={i} className={className}>
          {p.split("\n").map((line, j, arr) => (
            <span key={j}>
              <Inline text={line} />
              {j < arr.length - 1 && <br />}
            </span>
          ))}
        </p>
      ))}
    </>
  );
}
