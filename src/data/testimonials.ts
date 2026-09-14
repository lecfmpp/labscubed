/* CubeOne customer testimonials, shared by the product pages' TestimonialSlider.
   Logos and headshots come from the old Webflow homepage review tabs; Webflow
   had no real headshot for Jean-Damien (its hidden image was Tom Roberts), so
   that card falls back to initials. Each quote carries its own photo, which a
   page may override (e.g. /rubber-testing swaps the CubeTen close-up for a
   CubeOne render). */
const T = '/assets/img/testimonials/';

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  company: string;
  loc?: string;
  avatar?: string;
  logo?: { src: string; width: number; height: number };
  photo: { src: string; alt: string };
};

export const CUBEONE_TESTIMONIALS: Testimonial[] = [
  { quote: "We've added the CubeOne to our quality department. This allowed for better repeatability of the measurements and gave the technician time to perform other tasks during each test sequence. The LabsCubed team was very responsive in adapting the interface with our other systems.", name: 'Jean-Damien', role: 'R&D Laboratory Chemist', company: 'Soucy Techno', loc: 'Quebec, Canada',
    logo: { src: T + 'logo-soucy.webp', width: 156, height: 26 },
    photo: { src: '/assets/img/plastic-testing/stats-bg.webp', alt: 'Technician loading specimens onto a LabsCubed tray' } },
  { quote: "The CubeOne has been a great addition to ACE's laboratory from both a productivity and repeatability standpoint. Anyone can load it, walk away to perform other tasks, and let the Cube do its job — without the variation we'd typically see from stop-go interruptions and personnel changes.", name: 'Doug Foster', role: 'Director of Operations', company: 'ACE Laboratories', loc: 'Ohio, USA',
    avatar: T + 'doug-foster.webp', logo: { src: T + 'logo-ace.webp', width: 112, height: 32 },
    photo: { src: T + 'photo-ace.webp', alt: 'LabsCubed automated tensile testing machine with its touchscreen' } },
  { quote: 'The CubeOne tensometer is an excellent fit with our strategy to create A Quality Difference by implementing state-of-the-art testing processes in all our test laboratories that provide more reliable, predictive results for our customers.', name: 'Tom Roberts', role: 'Director of Quality', company: 'HEXPOL Compounding Americas', loc: '',
    avatar: T + 'tom-roberts.webp', logo: { src: T + 'logo-hexpol.webp', width: 156, height: 26 },
    photo: { src: T + 'photo-hexpol.webp', alt: 'Side view of a LabsCubed automated tensile testing machine' } },
  { quote: "We are really happy with the performance of the CubeOne and with your responsiveness. It has absolutely streamlined our testing and data retrieval process to the point where it's actually enjoyable to do.", name: 'Raymond Franklin', role: 'Rheology Laboratory', company: 'Momentive', loc: 'North Carolina, USA',
    avatar: T + 'ray-franklin.webp', logo: { src: T + 'logo-momentive.webp', width: 119, height: 20 },
    photo: { src: T + 'photo-momentive.webp', alt: 'Close-up of the CubeTen status light and controls' } },
];
