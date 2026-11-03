import Hero from "@/components/Hero";
import FilterSesi from "@/components/bangunkeinginan";
import Pillars from "@/components/why";
import Principle from "@/components/Kg";
import Schedule from "@/components/Schedule";
import Cta from "@/components/Cta";
import Jumbotron from "@/components/Jumbotron";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Testimoni from "@/components/Testimoni";
import BonusGaransi from "@/components/BonusGaransi";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <FilterSesi />
      <div className="bg-[#eef2f7]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 ">
          <main>
            <Pillars />
          </main>
        </div>
      </div>
      <Principle />
      <div className="bg-[#eef2f7]">
        <Testimoni />
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full border border-deep/10"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-6 -top-6 h-44 w-44 rounded-full border border-deep/10"
          />
          <BonusGaransi />
          {/* <Schedule /> */}
          {/* <Jumbotron /> */}
        </div>
        <Cta />
      </div>
      <Footer />
    </>
  );
}
