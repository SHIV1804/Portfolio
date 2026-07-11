import Link from 'next/link';
import Image from 'next/image';
import { ComponentPropsWithoutRef } from 'react';

type HeadingProps = ComponentPropsWithoutRef<'h2'>;
type ParagraphProps = ComponentPropsWithoutRef<'p'>;
type ListProps = ComponentPropsWithoutRef<'ul'>;
type ListItemProps = ComponentPropsWithoutRef<'li'>;
type BlockquoteProps = ComponentPropsWithoutRef<'blockquote'>;
type PreProps = ComponentPropsWithoutRef<'pre'>;
type CodeProps = ComponentPropsWithoutRef<'code'>;
type AnchorProps = ComponentPropsWithoutRef<'a'>;
type ImageProps = ComponentPropsWithoutRef<'img'>;

export const mdxComponents = {
  h2: (props: HeadingProps) => (
    <h2 
      id={props.children?.toString().toLowerCase().replace(/\s+/g, '-')} 
      className="text-2xl font-bold mt-12 mb-4 scroll-mt-32" 
      {...props} 
    />
  ),
  h3: (props: HeadingProps) => (
    <h3 
      id={props.children?.toString().toLowerCase().replace(/\s+/g, '-')} 
      className="text-xl font-bold mt-8 mb-4 scroll-mt-32" 
      {...props} 
    />
  ),
  p: (props: ParagraphProps) => <p className="leading-relaxed mb-6 text-foreground-muted" {...props} />,
  ul: (props: ListProps) => <ul className="list-disc pl-6 mb-6 space-y-2 text-foreground-muted" {...props} />,
  ol: (props: ListProps) => <ol className="list-decimal pl-6 mb-6 space-y-2 text-foreground-muted" {...props} />,
  li: (props: ListItemProps) => <li {...props} />,
  blockquote: (props: BlockquoteProps) => (
    <blockquote className="border-l-4 border-accent pl-6 italic my-8 text-foreground" {...props} />
  ),
  pre: (props: PreProps) => (
    <pre className="p-4 rounded-lg bg-surface border border-border overflow-x-auto my-8 font-mono text-sm" {...props} />
  ),
  code: (props: CodeProps) => (
    <code className="bg-surface-raised border border-border px-1.5 py-0.5 rounded text-accent font-mono text-sm" {...props} />
  ),
  a: ({ href, ...props }: AnchorProps) => (
    <Link href={href || '#'} className="text-accent hover:underline underline-offset-4" {...props} />
  ),
  img: (props: ImageProps) => (
    <span className="block my-12">
      <Image
        src={typeof props.src === 'string' ? props.src : ''}
        alt={props.alt || ''}
        width={800}
        height={450}
        className="rounded-lg border border-border"
      />
      {props.alt && (
        <span className="block text-center text-xs text-foreground-faint mt-3 font-mono">
          {props.alt}
        </span>
      )}
    </span>
  ),
};
