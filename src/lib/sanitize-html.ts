import * as cheerio from "cheerio";

const ALLOWED_TAGS = new Set([
  "p", "br", "hr", "h1", "h2", "h3", "h4", "h5", "h6",
  "strong", "b", "em", "i", "u", "s", "blockquote", "pre", "code",
  "ul", "ol", "li",
  "a", "img", "figure", "figcaption",
  "table", "thead", "tbody", "tr", "th", "td",
  "div", "span",
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "title", "target", "rel"]),
  img: new Set(["src", "alt", "title", "width", "height", "loading"]),
  td: new Set(["colspan", "rowspan"]),
  th: new Set(["colspan", "rowspan", "scope"]),
};

export function sanitizeHtml(html: string): string {
  const $ = cheerio.load(html);

  $("script, style, iframe, object, embed, form").remove();

  $("*").each((_, el) => {
    if (el.type === "script" || el.type === "style") {
      $(el).remove();
      return;
    }
    if (el.type !== "tag") return;
    const tag = el.tagName.toLowerCase();

    if (!ALLOWED_TAGS.has(tag)) {
      $(el).unwrap();
      return;
    }

    const allowed = ALLOWED_ATTRS[tag];
    const attribs = { ...el.attribs };
    for (const name of Object.keys(attribs)) {
      const keep =
        allowed?.has(name.toLowerCase()) &&
        !isDangerousValue(attribs[name]);
      if (!keep) $(el).removeAttr(name);
    }

    if (tag === "a" && el.attribs.href) {
      $(el).attr("rel", "noopener noreferrer nofollow");
    }
  });

  return $("body").html() ?? $.html();
}

function isDangerousValue(value: string): boolean {
  const lower = value.trim().toLowerCase();
  return (
    lower.startsWith("javascript:") ||
    lower.startsWith("vbscript:") ||
    lower.startsWith("data:text/html")
  );
}
