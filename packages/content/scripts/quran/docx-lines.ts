// Reads the line breaks KFGQPC typed into the Word source of the mushaf PDF
// (same release). The build checks its derived lines against them.

const RUN =
  /<\/w:p>|<w:br(?<attributes>[^>]*)\/>|<w:t(?: [^>]*)?>(?<text>[^<]*)<\/w:t>/gu;
const LINE_END = "\n";
const PAGE_END = "\f";

const unescapeXml = (text: string): string =>
  text
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");

/** The text of each line, per page (index 0 = page 1). */
export const readDocxLines = (documentXml: string): string[][] => {
  let text = "";
  for (const match of documentXml.matchAll(RUN)) {
    const { attributes, text: run } = match.groups ?? {};
    if (run !== undefined) {
      text += unescapeXml(run);
    } else if (attributes?.includes('w:type="page"')) {
      text += PAGE_END;
    } else {
      text += LINE_END;
    }
  }
  return text.split(PAGE_END).map((page) =>
    page
      .split(LINE_END)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
  );
};
