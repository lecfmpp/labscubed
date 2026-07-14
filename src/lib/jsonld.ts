/* Structured data (JSON-LD) — Organization, Products, FAQPage.
   Built once and injected in the base layout <head>. FAQ pulls from the same
   FAQ_DATA the visible accordion uses. */
import { FAQ_DATA } from './faq';

export function buildJsonLd(site: string) {
  const org = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "LabsCubed Inc.",
    url: site,
    logo: new URL("/assets/img/logo.png", site).href,
    description:
      "LabsCubed designs and manufactures automated tensile, flexure and tear testing systems for high-volume polymer and elastomer labs.",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      email: "info@labscubed.com",
      telephone: "+1-519-749-0460",
      areaServed: "Worldwide",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Kitchener",
      addressRegion: "ON",
      addressCountry: "CA",
    },
    // NOTE: verify these social profile URLs before promoting to production.
    sameAs: [
      "https://www.linkedin.com/company/labscubed/",
      "https://www.youtube.com/@LabsCubed",
    ],
  };

  const cubeten = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "CubeTen",
    brand: { "@type": "Brand", name: "LabsCubed" },
    image: new URL("/assets/img/media/cubeten-01.webp", site).href,
    description:
      "Automated tensile and flexure testing system for rigid plastics — robotic loading, gripping and measurement to ASTM D638 / ISO 527 and ASTM D790 / ISO 178, up to 10kN.",
    category: "Automated Material Testing System",
    additionalProperty: [
      { "@type": "PropertyValue", name: "Standards", value: "ASTM D638, ISO 527, ASTM D790, ISO 178" },
      { "@type": "PropertyValue", name: "Force", value: "Up to 10kN" },
      { "@type": "PropertyValue", name: "Elongation", value: "Up to 1000%" },
    ],
  };

  const cubeone = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "CubeOne",
    brand: { "@type": "Brand", name: "LabsCubed" },
    image: new URL("/assets/img/media/cubeone-01.webp", site).href,
    description:
      "Automated tensile and tear testing system for rubber and elastomers — robotic loading, gripping and measurement to ASTM D412 / ISO 37 and ASTM D624, up to 1kN.",
    category: "Automated Material Testing System",
    additionalProperty: [
      { "@type": "PropertyValue", name: "Standards", value: "ASTM D412, ISO 37, ASTM D624" },
      { "@type": "PropertyValue", name: "Force", value: "Up to 1kN" },
      { "@type": "PropertyValue", name: "Max Elongation", value: "1000%" },
    ],
  };

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_DATA.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return [org, cubeten, cubeone, faq];
}
