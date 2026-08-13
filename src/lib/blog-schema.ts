/* JSON-LD for blog pages.
 *
 * Posts written by the automation already carry a full schema set (Article +
 * FAQPage + BreadcrumbList + Person author) inside the body payload; those are
 * emitted verbatim so the structured data a post was reviewed with is the
 * structured data that ships.
 *
 * The builders here cover the two cases that payload does not: the five legacy
 * posts that predate the automation and carry no schema at all, and the /blog
 * index itself.
 */
import type { BlogPost } from './blog';
import { postDate, postDescription, categoryLabel } from './blog';

const ORG = {
  '@type': 'Organization',
  name: 'LabsCubed',
  url: 'https://www.labscubed.com',
};

/** Article schema for posts whose stored body carries no payload. */
export function articleSchema(post: BlogPost, url: string) {
  const published = postDate(post).toISOString().slice(0, 10);
  const modified = (post.updated_at ? new Date(post.updated_at) : postDate(post))
    .toISOString()
    .slice(0, 10);

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: postDescription(post),
    author: {
      '@type': 'Person',
      name: post.author ?? 'LabsCubed Team',
      jobTitle: 'Materials Testing Automation Engineers',
      worksFor: ORG,
    },
    publisher: ORG,
    datePublished: published,
    dateModified: modified,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    ...(post.hero_image_url ? { image: post.hero_image_url } : {}),
  };
}

export function breadcrumbSchema(post: BlogPost, url: string, origin: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: origin },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${origin}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: url },
    ],
  };
}

/** Listing schema for /blog. */
export function blogListingSchema(posts: BlogPost[], origin: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'LabsCubed Blog',
    description:
      'Automated materials testing, ASTM and ISO methods, and lab workflow guidance from the LabsCubed engineering team.',
    url: `${origin}/blog`,
    publisher: ORG,
    blogPost: posts.slice(0, 20).map((p) => ({
      '@type': 'BlogPosting',
      headline: p.title,
      url: `${origin}/post/${p.slug}`,
      datePublished: postDate(p).toISOString().slice(0, 10),
      ...(p.categories.length
        ? { articleSection: p.categories.map(categoryLabel) }
        : {}),
    })),
  };
}

/**
 * Final schema set for a post: the reviewed payload when present, otherwise a
 * generated Article. BreadcrumbList is added whenever the payload lacks one, so
 * legacy posts gain breadcrumbs without duplicating them on automated posts.
 */
export function schemasForPost(
  post: BlogPost,
  payload: unknown[],
  url: string,
  origin: string,
): unknown[] {
  const typeOf = (s: unknown) =>
    (s as { '@type'?: string } | null)?.['@type'] ?? '';
  const out = [...payload];

  if (!out.some((s) => typeOf(s) === 'Article' || typeOf(s) === 'BlogPosting')) {
    out.push(articleSchema(post, url));
  }
  if (!out.some((s) => typeOf(s) === 'BreadcrumbList')) {
    out.push(breadcrumbSchema(post, url, origin));
  }
  return out;
}
