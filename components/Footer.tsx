import ScrollReveal from "@/components/ScrollReveal";

export default function Footer() {
  return (
    <footer className="bg-deep px-4 py-6 text-center text-xs text-white/60 sm:text-sm">
      <ScrollReveal direction="fade" duration={700}>
        <p>
          © 2026 Indonesia-Korea Business Project. Seluruh hak cipta dilindungi.
        </p>
      </ScrollReveal>
    </footer>
  );
}
