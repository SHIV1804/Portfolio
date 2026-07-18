import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";

/**
 * SECURITY: This renderer exists specifically for untrusted, visitor-submitted
 * content (community blog posts stored in the database).
 *
 * It must NEVER be replaced with MDXRemote or any MDX compiler for this
 * content path. MDX compiles to executable JSX/JavaScript — passing
 * untrusted user input into an MDX compiler is a known, serious risk
 * (next-mdx-remote's own docs warn against this). A malicious visitor could
 * embed a JSX expression that runs arbitrary JavaScript in every visitor's
 * browser once a moderator approves the post, and a human reviewer would not
 * necessarily notice a malicious embedded expression during moderation.
 *
 * This pipeline instead: parses plain Markdown only (remark-parse), allows
 * GitHub-flavored Markdown syntax like tables/strikethrough (remark-gfm),
 * converts to an HTML AST (remark-rehype), then strips any raw HTML tags,
 * event handler attributes, script/style tags, and dangerous URL schemes
 * (rehype-sanitize, using its default strict schema) before finally
 * stringifying to safe HTML. The result contains formatting only — no
 * executable code of any kind survives this pipeline.
 *
 * First-party MDX files written by the site owner (content/blog/*.mdx) are
 * NOT untrusted and should continue using MDXRemote as before — this
 * function is only for the database-backed community submission path.
 */
export async function renderSafeMarkdown(rawContent: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSanitize) // strips raw HTML, event handlers, script/style, javascript: URLs, etc.
    .use(rehypeStringify)
    .process(rawContent);

  return String(result);
}
