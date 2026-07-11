import { ImageResponse } from 'next/og';
import { getPostBySlug } from '@/shared/lib/blog';

// Change to nodejs runtime because getPostBySlug uses 'fs'
export const runtime = 'nodejs';
export const alt = 'Blog Post';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);

  if (!post) {
    return new ImageResponse(
      (
        <div
          style={{
            background: '#0B0D0F',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#E7E4DC',
            fontFamily: 'sans-serif',
          }}
        >
          Post Not Found
        </div>
      ),
      { ...size }
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: '#0B0D0F',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '80px',
          color: '#E7E4DC',
          fontFamily: 'sans-serif',
          border: '20px solid #14171B',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
          <div
            style={{
              width: '12px',
              height: '24px',
              background: '#E8A33D',
              marginRight: '16px',
            }}
          />
          <span style={{ fontSize: '24px', fontWeight: 'bold', letterSpacing: '2px', color: '#9B9C97' }}>
            SHIVAM // BLOG
          </span>
        </div>
        <div
          style={{
            fontSize: '72px',
            fontWeight: 'bold',
            lineHeight: 1.1,
            marginBottom: '40px',
            color: '#E7E4DC',
          }}
        >
          {post.title}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: 'auto' }}>
          {post.tags.map((tag) => (
            <div
              key={tag}
              style={{
                fontSize: '18px',
                background: '#3A2E15',
                color: '#E8A33D',
                padding: '8px 16px',
                borderRadius: '4px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              #{tag}
            </div>
          ))}
          <div
            style={{
              fontSize: '18px',
              color: '#64665F',
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {new Date(post.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
