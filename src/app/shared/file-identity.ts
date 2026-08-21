/**
 * How one picked file is identified.
 *
 * Two things depend on this and must not drift apart: the selection dedupes on
 * it (two picks of the same file are one file), and an interrupted run resumes
 * on it (a re-picked file is recognised as one that already imported). If the
 * selection deduped on name alone while resume matched on name + size, a run
 * could skip a file it never actually imported — silent data loss in an import
 * tool.
 *
 * Name alone is not enough: every patient folder holds a `karton.xlsx`, so name
 * collisions are the norm rather than the exception. Size and last-modified
 * separate them, and both survive the round trip through localStorage that
 * resume needs — a `File` itself does not.
 */
export function fileIdentity(file: File): string {
  return `${file.name}|${file.size}|${file.lastModified}`;
}
