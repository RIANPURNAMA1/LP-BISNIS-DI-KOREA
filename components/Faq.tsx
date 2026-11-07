import ScrollReveal from "@/components/ScrollReveal";
import { FAQ_ITEMS } from "@/lib/site";

export default function Faq() {
  return (
    <section
      id="faq"
      className="scroll-mt-20 border-t border-gray-100 bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-2"
    >
      <div className="mx-auto w-full max-w-[1200px]">
        <ScrollReveal className="max-w-2xl">
          <p className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-ocean sm:text-sm">
            <span aria-hidden className="h-px w-8 bg-ocean" />
            Pertanyaan Umum
          </p>
          <h2 className="text-2xl font-bold leading-tight tracking-tight text-deep sm:text-3xl lg:text-4xl">
            Pertanyaan Seputar Bisnis di Korea
          </h2>
          <p className="mt-4 text-base leading-7 text-gray-500">
            Hal yang sering ditanyakan sebelum memulai program inkubasi bisnis
            dan pendirian perusahaan di Korea.
          </p>
        </ScrollReveal>

        <div className="mt-8 grid gap-3 sm:mt-10 sm:grid-cols-2 sm:gap-4">
          {FAQ_ITEMS.map((item, i) => (
            <ScrollReveal key={item.question} delay={i * 70}>
              <dl className="h-full rounded-2xl border border-gray-200 bg-white p-5 transition-colors duration-300 hover:border-ocean/40 sm:p-6">
                <dt className="text-base font-bold leading-snug text-deep">
                  {item.question}
                </dt>
                <dd className="mt-2 text-sm leading-6 text-gray-500">
                  {item.answer}
                </dd>
              </dl>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
