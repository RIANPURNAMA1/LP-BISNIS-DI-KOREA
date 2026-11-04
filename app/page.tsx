import Hero from "@/components/Hero";
import FilterSesi from "@/components/bangunkeinginan";
import Pillars from "@/components/why";
import Principle from "@/components/Kg";
import Cta from "@/components/Cta";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Testimoni from "@/components/Testimoni";
import BonusGaransi from "@/components/BonusGaransi";
import Faq from "@/components/Faq";
import ScrollReveal from "@/components/ScrollReveal";
import {
  FAQ_ITEMS,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site";

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Program Inkubasi Bisnis Startup Indonesia-Korea",
  serviceType:
    "Pendampingan bisnis, mentoring startup, dan panduan pendirian perusahaan di Korea Selatan",
  description: SITE_DESCRIPTION,
  url: `${SITE_URL}/daftar`,
  provider: {
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
  },
  areaServed: [
    { "@type": "Country", name: "Indonesia" },
    { "@type": "Country", name: "South Korea" },
  ],
  audience: {
    "@type": "Audience",
    audienceType:
      "Wirausaha dan pekerja Indonesia yang ingin membangun bisnis di Korea Selatan",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

export default function Home() {
  return (
    <>
      <JsonLd data={serviceSchema} />
      <JsonLd data={faqSchema} />
      <Navbar />
      <main>
        <Hero />
        <ScrollReveal>
          <FilterSesi />
        </ScrollReveal>
        <div className="bg-[#eef2f7]">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal delay={100}>
              <Pillars />
            </ScrollReveal>
          </div>
        </div>
        <ScrollReveal delay={100}>
          <Principle />
        </ScrollReveal>
        <div className="bg-[#eef2f7]">
          <ScrollReveal delay={100}>
            <Testimoni />
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <BonusGaransi />
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <Faq />
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <Cta />
          </ScrollReveal>
        </div>
      </main>
      <Footer />
    </>
  );
}
