import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import heroImg from "@/assets/hero.jpg";
import { supabase } from "@/lib/supabase";
import type { Tables } from "@/lib/database.types";
import {
  useSiteSettings,
  useHero,
  useCoupleMembers,
  useTimeline,
  useGalleryCategories,
  useGalleryImages,
  useEvents,
  useFamily,
  useVenue,
  useGiftSettings,
  useMusic,
  useSocialLinks,
  useBlessings,
} from "@/lib/public-queries";
import { useQueryClient } from "@tanstack/react-query";

type SiteSettings = Tables<"site_settings">;
type Venue = Tables<"venue">;
type GiftSettings = Tables<"gift_settings">;
type EventRow = Tables<"events">;
type TimelineItem = Tables<"timeline_items">;
type GalleryImage = Tables<"gallery_images">;
type GalleryCategoryRow = Tables<"gallery_categories">;
type FamilyGroup = Tables<"family_groups">;
type FamilyMember = Tables<"family_members">;
type Blessing = Tables<"blessings">;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Our Wedding" },
      {
        name: "description",
        content: "Together with our families, we invite you to celebrate our wedding.",
      },
    ],
  }),
  component: WeddingHome,
});

/* ---------------- helpers ---------------- */

function useCountdown(target: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, new Date(target).getTime() - now);
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff / 3_600_000) % 24);
  const mins = Math.floor((diff / 60_000) % 60);
  const secs = Math.floor((diff / 1000) % 60);
  return { days, hours, mins, secs, done: diff === 0 };
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.08, ease: [0.19, 1, 0.22, 1] as const },
  }),
};

/* ---------------- components ---------------- */

function FloatingPetals() {
  const petals = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 12,
        duration: 10 + Math.random() * 12,
        size: 10 + Math.random() * 14,
        rotate: Math.random() * 360,
      })),
    [],
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden>
      {petals.map((p) => (
        <span
          key={p.id}
          className="absolute block rounded-full"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.75,
            background: "radial-gradient(circle at 30% 30%, #FCEFF2 0%, #F5C6D0 60%, #C58394 100%)",
            filter: "blur(0.3px)",
            opacity: 0.75,
            transform: `rotate(${p.rotate}deg)`,
            animation: `petal-fall ${p.duration}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function Nav({
  playing,
  onToggleMusic,
  onShare,
  groomName,
  brideName,
}: {
  playing: boolean;
  onToggleMusic: () => void;
  onShare: () => void;
  groomName: string;
  brideName: string;
}) {
  const [open, setOpen] = useState(false);
  const links = [
    ["Story", "story"],
    ["Gallery", "gallery"],
    ["Events", "events"],
    ["Family", "family"],
    ["Venue", "venue"],
    ["RSVP", "rsvp"],
  ] as const;
  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="mx-auto max-w-6xl px-4 py-3">
        <div className="glass rounded-full flex items-center justify-between px-4 py-2 shadow-luxe">
          <a href="#top" className="font-serif italic text-lg gold-text">
            {groomName.charAt(0).toUpperCase() || "S"} <span className="opacity-60">&amp;</span>{" "}
            {brideName.charAt(0).toUpperCase() || "P"}
          </a>
          <nav className="hidden md:flex items-center gap-6 text-xs uppercase tracking-[0.2em] text-brand-ink/70">
            {links.map(([label, id]) => (
              <a key={id} href={`#${id}`} className="hover:text-brand-gold transition-colors">
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleMusic}
              className="grid place-items-center h-9 w-9 rounded-full border border-brand-gold/40 text-brand-gold hover:bg-brand-gold hover:text-white transition-colors"
              aria-label={playing ? "Pause music" : "Play music"}
              title={playing ? "Pause music" : "Play music"}
            >
              {playing ? "❚❚" : "♪"}
            </button>
            <button
              onClick={onShare}
              className="hidden sm:grid place-items-center h-9 w-9 rounded-full border border-brand-gold/40 text-brand-gold hover:bg-brand-gold hover:text-white transition-colors"
              aria-label="Share invitation"
              title="Share invitation"
            >
              ↗
            </button>
            <button
              onClick={() => setOpen((v) => !v)}
              className="md:hidden grid place-items-center h-9 w-9 rounded-full border border-brand-gold/40 text-brand-gold"
              aria-label="Menu"
            >
              {open ? "✕" : "≡"}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {open && (
            <motion.nav
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="md:hidden mt-2 glass rounded-2xl p-4 flex flex-col gap-3 text-sm uppercase tracking-[0.2em] text-brand-ink/70"
            >
              {links.map(([label, id]) => (
                <a
                  key={id}
                  href={`#${id}`}
                  onClick={() => setOpen(false)}
                  className="py-1 hover:text-brand-gold"
                >
                  {label}
                </a>
              ))}
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

function CountdownBlock({
  weddingDate,
  variant = "light",
}: {
  weddingDate: string;
  variant?: "light" | "hero";
}) {
  const { days, hours, mins, secs, done } = useCountdown(weddingDate);
  const cells: [number, string][] = [
    [days, "Days"],
    [hours, "Hours"],
    [mins, "Mins"],
    [secs, "Secs"],
  ];
  const textCls = variant === "hero" ? "text-white" : "text-brand-gold";
  const labelCls = variant === "hero" ? "text-white/70" : "text-stone-400";
  return (
    <div className="grid grid-cols-4 gap-3 sm:gap-6">
      {cells.map(([v, l]) => (
        <div key={l} className="text-center">
          <div className={`font-serif text-3xl sm:text-4xl ${textCls}`}>
            {String(v).padStart(2, "0")}
          </div>
          <div className={`text-[10px] uppercase tracking-widest mt-1 ${labelCls}`}>{l}</div>
        </div>
      ))}
      {done && <FireworksBurst />}
    </div>
  );
}

function FireworksBurst() {
  const sparks = Array.from({ length: 24 });
  return (
    <div className="col-span-4 relative h-24">
      {sparks.map((_, i) => {
        const angle = (i / sparks.length) * Math.PI * 2;
        const dist = 80 + Math.random() * 40;
        return (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full"
            style={
              {
                background: ["#C5A059", "#FCEFF2", "#A67B88", "#fff"][i % 4],
                ["--tx" as string]: `${Math.cos(angle) * dist}px`,
                ["--ty" as string]: `${Math.sin(angle) * dist}px`,
                animation: `firework 1.2s ease-out ${(i % 4) * 0.1}s infinite`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}

function Hero({
  imageUrl,
  eyebrow,
  groomName,
  brideName,
  dateLabel,
  tagline,
  weddingDate,
}: {
  imageUrl: string;
  eyebrow: string;
  groomName: string;
  brideName: string;
  dateLabel: string;
  tagline: string;
  weddingDate: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  return (
    <section
      id="top"
      ref={ref}
      className="relative h-[100svh] w-full overflow-hidden flex items-center justify-center text-center"
    >
      <motion.div style={{ y }} className="absolute inset-0 z-0">
        <img
          src={imageUrl}
          alt="Wedding altar"
          width={1920}
          height={1080}
          className="w-full h-full object-cover animate-kenburns"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/60" />
      </motion.div>

      <motion.div style={{ opacity }} className="relative z-10 px-6">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.9 }}
          className="text-white/90 uppercase tracking-[0.35em] text-[11px] sm:text-sm mb-6 font-light"
        >
          ❤ {eyebrow}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="font-serif text-white text-5xl sm:text-7xl md:text-8xl italic leading-none"
        >
          {groomName}
          <span className="not-italic mx-3 sm:mx-5 text-3xl sm:text-4xl gold-text align-middle">
            &amp;
          </span>
          {brideName}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 1 }}
          className="text-white/90 mt-6 font-serif text-lg sm:text-2xl tracking-[0.2em]"
        >
          {dateLabel.toUpperCase()}
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 1 }}
          className="text-white/70 mt-2 italic font-serif"
        >
          {tagline}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.9 }}
          className="mt-10 max-w-md mx-auto"
        >
          <CountdownBlock variant="hero" weddingDate={weddingDate} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.9 }}
          className="mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center"
        >
          <a
            href="#events"
            className="px-8 py-3 gold-gradient text-white rounded-full font-medium tracking-widest text-xs shadow-luxe hover:-translate-y-0.5 transition-transform"
          >
            VIEW INVITATION
          </a>
          <a
            href="#rsvp"
            className="px-8 py-3 glass-dark text-white rounded-full font-medium tracking-widest text-xs hover:bg-white/20 transition-colors"
          >
            RSVP
          </a>
        </motion.div>
      </motion.div>

      <div className="absolute top-24 left-8 w-24 h-24 opacity-40 animate-float pointer-events-none">
        <div className="w-full h-full rounded-full border border-brand-gold/40" />
      </div>
      <div
        className="absolute bottom-24 right-10 w-16 h-16 opacity-40 animate-float pointer-events-none"
        style={{ animationDelay: "1.5s" }}
      >
        <div className="w-full h-full rounded-full border border-white/40" />
      </div>
    </section>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.4 }}
      variants={fadeUp}
      className="text-center mb-16"
    >
      {eyebrow && (
        <p className="text-brand-rose uppercase tracking-[0.3em] text-[10px] mb-4">{eyebrow}</p>
      )}
      <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl mb-4">{title}</h2>
      <div className="w-16 h-[1px] bg-brand-gold mx-auto" />
    </motion.div>
  );
}

function CountdownStrip({ weddingDate }: { weddingDate: string }) {
  return (
    <section className="py-10 bg-white border-y border-brand-gold/10">
      <div className="max-w-3xl mx-auto px-6">
        <CountdownBlock weddingDate={weddingDate} />
      </div>
    </section>
  );
}

function StorySection({ timeline }: { timeline: TimelineItem[] }) {
  if (timeline.length === 0) return null;
  return (
    <section id="story" className="py-24 px-6 max-w-5xl mx-auto">
      <SectionTitle eyebrow="Our Journey" title="Our Love Story" />
      <div className="space-y-20 md:space-y-24">
        {timeline.map((t, i) => (
          <motion.div
            key={t.id}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp}
            custom={0}
            className="flex flex-col md:flex-row items-center gap-8 md:gap-12"
          >
            <div className={`w-full md:w-1/2 ${i % 2 === 1 ? "md:order-2" : ""}`}>
              <span className="text-brand-gold font-serif italic text-lg mb-2 block">
                {t.icon} {t.date_label}
              </span>
              <h3 className="text-2xl sm:text-3xl font-serif mb-4">{t.title}</h3>
              <p className="text-stone-500 leading-relaxed">{t.description}</p>
            </div>
            <div className={`w-full md:w-1/2 ${i % 2 === 1 ? "md:order-1" : ""}`}>
              <div
                className={`bg-white p-3 sm:p-4 shadow-xl ${
                  i % 2 === 0 ? "-rotate-2" : "rotate-2"
                }`}
              >
                {t.image_url && (
                  <img
                    src={t.image_url}
                    alt={t.title}
                    loading="lazy"
                    className="w-full aspect-[4/3] object-cover"
                  />
                )}
                <p className="text-[10px] uppercase tracking-widest text-stone-400 pt-3 pb-1 text-center">
                  {t.title}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function GallerySection({
  images,
  categories,
}: {
  images: GalleryImage[];
  categories: GalleryCategoryRow[];
}) {
  const [cat, setCat] = useState<string>("All");
  const [visible, setVisible] = useState(8);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const categoryName = useMemo(() => {
    const map = new Map(categories.map((c) => [c.id, c.name]));
    return (id: string | null) => (id ? (map.get(id) ?? "") : "");
  }, [categories]);

  const filtered = useMemo(
    () => (cat === "All" ? images : images.filter((g) => categoryName(g.category_id) === cat)),
    [cat, images, categoryName],
  );
  const shown = filtered.slice(0, visible);

  if (images.length === 0) return null;

  return (
    <section id="gallery" className="py-24 px-6 bg-brand-blush/20">
      <div className="max-w-6xl mx-auto">
        <SectionTitle eyebrow="Captured Moments" title="Photo Gallery" />

        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {["All", ...categories.map((c) => c.name)].map((c) => (
            <button
              key={c}
              onClick={() => {
                setCat(c);
                setVisible(8);
              }}
              className={`px-4 py-2 text-xs uppercase tracking-widest rounded-full border transition-colors ${
                cat === c
                  ? "bg-brand-gold text-white border-brand-gold"
                  : "border-brand-gold/30 text-brand-ink/70 hover:border-brand-gold"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 [&>*]:mb-4">
          <AnimatePresence>
            {shown.map((g) => (
              <motion.button
                key={g.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                onClick={() => setLightbox(g.image_url)}
                className="block w-full break-inside-avoid rounded-2xl overflow-hidden shadow-sm group relative"
              >
                <img
                  src={g.image_url}
                  alt={g.alt_text}
                  loading="lazy"
                  className="w-full h-auto transition-transform duration-700 group-hover:scale-105"
                />
                <span className="absolute inset-0 bg-brand-gold/0 group-hover:bg-brand-gold/10 transition-colors" />
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {visible < filtered.length && (
          <div className="text-center mt-10">
            <button
              onClick={() => setVisible((v) => v + 8)}
              className="px-6 py-2 border border-brand-gold text-brand-gold rounded-full text-xs tracking-widest uppercase hover:bg-brand-gold hover:text-white transition-colors"
            >
              Load More
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            className="fixed inset-0 z-[60] bg-black/85 grid place-items-center p-6 cursor-zoom-out"
          >
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={lightbox}
              alt=""
              className="max-h-[90vh] max-w-full rounded-lg shadow-2xl"
            />
            <button className="absolute top-6 right-6 text-white text-2xl" aria-label="Close">
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function EventsSection({ events }: { events: EventRow[] }) {
  if (events.length === 0) return null;
  return (
    <section id="events" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <SectionTitle eyebrow="Save the Dates" title="The Celebrations" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((e, i) => (
            <motion.div
              key={e.id}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUp}
              custom={i}
              className="bg-white p-6 rounded-2xl shadow-sm border border-brand-gold/10 hover:shadow-luxe transition-all hover:-translate-y-1"
            >
              {e.image_url && (
                <div className="w-full aspect-square mb-5 overflow-hidden rounded-xl">
                  <img
                    src={e.image_url}
                    alt={e.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                  />
                </div>
              )}
              <div className="text-3xl mb-2 animate-float inline-block">{e.icon}</div>
              <h4 className="font-serif text-2xl mb-2">{e.name}</h4>
              <p className="text-stone-400 text-sm mb-1 italic">
                {e.event_date} · {e.start_time}
              </p>
              <p className="text-stone-600 text-sm mb-5">{e.venue}</p>
              <a
                href={e.map_url ?? undefined}
                target="_blank"
                rel="noreferrer"
                className="inline-block w-full text-center py-2 border border-brand-gold text-brand-gold rounded-full text-xs font-bold tracking-widest hover:bg-brand-gold hover:text-white transition-colors"
              >
                DIRECTIONS
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FamilySection({ groups, members }: { groups: FamilyGroup[]; members: FamilyMember[] }) {
  const ordered = [...groups].sort((a, b) => (a.side === "groom" ? -1 : 1));
  if (groups.length === 0) return null;
  return (
    <section id="family" className="py-24 px-6 bg-brand-blush/20">
      <div className="max-w-5xl mx-auto">
        <SectionTitle eyebrow="With Love From" title="Our Family" />
        <div className="grid md:grid-cols-2 gap-12">
          {ordered.map((side) => (
            <div key={side.id} className="text-center">
              <h3 className="font-serif italic text-2xl gold-text mb-8">{side.title}</h3>
              <div className="flex justify-center gap-6 flex-wrap">
                {members
                  .filter((m) => m.family_group_id === side.id)
                  .map((m, i) => (
                    <motion.div
                      key={m.id}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                      variants={fadeUp}
                      custom={i}
                      className="flex flex-col items-center max-w-[120px]"
                    >
                      <div className="w-24 h-24 rounded-full overflow-hidden ring-2 ring-brand-gold/30 ring-offset-4 ring-offset-brand-cream">
                        {m.image_url && (
                          <img
                            src={m.image_url}
                            alt={m.name}
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <p className="mt-3 font-medium text-sm">{m.name}</p>
                      <p className="text-xs text-stone-400 italic">{m.relationship}</p>
                    </motion.div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function VenueSection({ venue }: { venue: Venue }) {
  return (
    <section id="venue" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <SectionTitle eyebrow="Find Your Way" title="The Wedding Venue" />
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="rounded-3xl overflow-hidden shadow-luxe"
          >
            {venue.image_url && (
              <img
                src={venue.image_url}
                alt={venue.name}
                loading="lazy"
                className="w-full aspect-[4/3] object-cover"
              />
            )}
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={1}
          >
            <h3 className="font-serif text-3xl mb-4">{venue.name}</h3>
            <p className="text-stone-500 leading-relaxed mb-6">{venue.address}</p>
            {venue.map_embed_url && (
              <div className="rounded-2xl overflow-hidden border border-brand-gold/20 aspect-video mb-6">
                <iframe
                  title="Venue map"
                  src={venue.map_embed_url}
                  className="w-full h-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}
            {venue.directions_url && (
              <a
                href={venue.directions_url}
                target="_blank"
                rel="noreferrer"
                className="inline-block px-6 py-3 gold-gradient text-white rounded-full text-xs font-medium tracking-widest shadow-luxe hover:-translate-y-0.5 transition-transform"
              >
                GET DIRECTIONS
              </a>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

type RsvpForm = { name: string; phone: string; guests: string; attending: string; message: string };

function RsvpSection({ rsvpDeadline, onSubmit }: { rsvpDeadline: string; onSubmit: () => void }) {
  const [form, setForm] = useState<RsvpForm>({
    name: "",
    phone: "",
    guests: "1",
    attending: "yes",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const { error: rsvpError } = await supabase.from("rsvps").insert({
        name: form.name,
        phone: form.phone,
        guests: form.guests,
        attending: form.attending,
        message: form.message,
      });
      if (rsvpError) throw rsvpError;

      if (form.message.trim()) {
        const { error: blessingError } = await supabase
          .from("blessings")
          .insert({ name: form.name, message: form.message });
        if (blessingError) throw blessingError;
      }

      setSubmitted(true);
      onSubmit();
      setTimeout(() => setSubmitted(false), 5000);
      setForm({ name: "", phone: "", guests: "1", attending: "yes", message: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="rsvp" className="py-24 px-6 bg-brand-blush/20">
      <div className="max-w-xl mx-auto glass rounded-3xl p-8 sm:p-10 shadow-luxe">
        <div className="text-center mb-8">
          <h2 className="font-serif text-3xl sm:text-4xl mb-2">Kindly RSVP</h2>
          <p className="text-stone-500 text-sm italic">Please respond by {rsvpDeadline}</p>
        </div>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="thanks"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <div className="text-6xl mb-4">💐</div>
              <h3 className="font-serif text-2xl mb-2 gold-text">Thank You!</h3>
              <p className="text-stone-500">Your response has been recorded. See you soon!</p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={submit}
              className="space-y-5"
            >
              <Field label="Full Name">
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter your name"
                  className="w-full bg-transparent border-b border-stone-300 py-2 focus:outline-none focus:border-brand-gold transition-colors"
                />
              </Field>
              <Field label="Phone">
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 ..."
                  className="w-full bg-transparent border-b border-stone-300 py-2 focus:outline-none focus:border-brand-gold transition-colors"
                />
              </Field>
              <div className="grid grid-cols-2 gap-6">
                <Field label="Guests">
                  <select
                    value={form.guests}
                    onChange={(e) => setForm({ ...form, guests: e.target.value })}
                    className="w-full bg-transparent border-b border-stone-300 py-2 focus:outline-none"
                  >
                    <option value="1">1 Person</option>
                    <option value="2">2 People</option>
                    <option value="3">3 People</option>
                    <option value="4+">Family (4+)</option>
                  </select>
                </Field>
                <Field label="Attending?">
                  <div className="flex gap-4 py-2 text-sm">
                    {["yes", "no"].map((v) => (
                      <label key={v} className="flex items-center gap-2 capitalize cursor-pointer">
                        <input
                          type="radio"
                          name="att"
                          checked={form.attending === v}
                          onChange={() => setForm({ ...form, attending: v })}
                          className="accent-brand-gold"
                        />
                        {v}
                      </label>
                    ))}
                  </div>
                </Field>
              </div>
              <Field label="Blessings for the Couple">
                <textarea
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Your warm wishes..."
                  className="w-full border border-stone-200 bg-white/60 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-brand-gold/30"
                />
              </Field>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full gold-gradient text-white py-4 rounded-xl font-medium tracking-[0.3em] text-xs shadow-luxe hover:-translate-y-0.5 transition-transform disabled:opacity-60"
              >
                {submitting ? "SENDING…" : "SEND RSVP"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-widest text-stone-500 mb-1 block">
        {label}
      </label>
      {children}
    </div>
  );
}

function Confetti({ show }: { show: boolean }) {
  const bits = useMemo(
    () =>
      Array.from({ length: 60 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        color: ["#C5A059", "#FCEFF2", "#A67B88", "#fff", "#E6D4A8"][i % 5],
        size: 6 + Math.random() * 8,
        rotate: Math.random() * 360,
      })),
    [],
  );
  return (
    <AnimatePresence>
      {show && (
        <div className="pointer-events-none fixed inset-0 z-[70]">
          {bits.map((b) => (
            <motion.span
              key={b.id}
              initial={{ y: -20, x: 0, opacity: 1, rotate: 0 }}
              animate={{ y: "110vh", rotate: b.rotate + 360 }}
              transition={{ duration: 3 + Math.random() * 2, delay: b.delay, ease: "easeIn" }}
              exit={{ opacity: 0 }}
              className="absolute block"
              style={{
                left: `${b.left}%`,
                width: b.size,
                height: b.size * 0.4,
                background: b.color,
                borderRadius: 2,
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

function BlessingsSection({ blessings }: { blessings: Blessing[] }) {
  if (blessings.length === 0) return null;
  return (
    <section id="blessings" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <SectionTitle eyebrow="Guest Wishes" title="Blessings Wall" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {blessings.map((b, i) => (
            <motion.div
              key={b.id}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUp}
              custom={i % 3}
              className="glass rounded-2xl p-6 shadow-sm"
            >
              <p className="italic text-stone-600 mb-4">"{b.message}"</p>
              <p className="text-xs uppercase tracking-widest gold-text">— {b.name}</p>
            </motion.div>
          ))}
        </div>
        <p className="text-center text-stone-400 text-sm mt-8 italic">
          Leave your blessings in the RSVP form above.
        </p>
      </div>
    </section>
  );
}

function GiftSection({ gift }: { gift: GiftSettings }) {
  const [copied, setCopied] = useState(false);
  if (!gift.enabled) return null;
  return (
    <section id="gift" className="py-24 px-6 bg-brand-blush/20">
      <div className="max-w-2xl mx-auto text-center">
        <SectionTitle eyebrow="With Gratitude" title="Blessings & Gifts" />
        <p className="text-stone-500 mb-10 max-w-md mx-auto">
          Your presence is our greatest gift. If you wish to send your blessings, we've made it
          easy.
        </p>
        <div className="glass rounded-3xl p-8 shadow-luxe">
          {gift.qr_image_url && (
            <img
              src={gift.qr_image_url}
              alt="UPI QR"
              className="w-48 h-48 mx-auto rounded-xl bg-white p-3"
            />
          )}
          <div className="mt-6">
            <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">UPI ID</p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(gift.upi_id);
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
              }}
              className="font-serif text-xl gold-text hover:opacity-80"
            >
              {gift.upi_id} {copied ? "✓" : "⧉"}
            </button>
            <p className="text-xs text-stone-400 mt-4">
              {gift.bank_name} · {gift.account_name}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer({
  onShare,
  groomName,
  brideName,
  weddingDate,
  venueName,
  socialLinks,
}: {
  onShare: () => void;
  groomName: string;
  brideName: string;
  weddingDate: string;
  venueName: string;
  socialLinks: Tables<"social_links">[];
}) {
  function downloadIcs() {
    const dt = new Date(weddingDate);
    const end = new Date(dt.getTime() + 4 * 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${groomName} & ${brideName} Wedding\nDTSTART:${fmt(dt)}\nDTEND:${fmt(end)}\nLOCATION:${venueName}\nDESCRIPTION:Join us to celebrate!\nEND:VEVENT\nEND:VCALENDAR`;
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wedding.ics";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <footer className="py-16 text-center bg-brand-ink text-white">
      <h3 className="font-serif text-3xl italic mb-2">
        {groomName} <span className="gold-text">&amp;</span> {brideName}
      </h3>
      <p className="text-white/50 text-xs tracking-[0.3em] mb-10 uppercase">
        Made with ❤ for our forever
      </p>

      <div className="flex justify-center gap-4 mb-10 flex-wrap px-6">
        <button
          onClick={onShare}
          className="px-5 py-2 border border-white/20 rounded-full text-xs uppercase tracking-widest hover:bg-white/10 transition-colors"
        >
          Share Invitation
        </button>
        <button
          onClick={downloadIcs}
          className="px-5 py-2 border border-white/20 rounded-full text-xs uppercase tracking-widest hover:bg-white/10 transition-colors"
        >
          Add to Calendar
        </button>
      </div>

      {socialLinks.length > 0 && (
        <div className="flex justify-center gap-6 mb-8">
          {socialLinks.map((s) => (
            <a
              key={s.id}
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="w-10 h-10 grid place-items-center rounded-full border border-white/10 text-xs hover:bg-brand-gold hover:border-brand-gold transition-colors"
            >
              {s.platform.slice(0, 2).toUpperCase()}
            </a>
          ))}
        </div>
      )}
      <p className="text-[10px] text-white/40 tracking-widest">
        © 2026 THE WEDDING OF {groomName.toUpperCase()} &amp; {brideName.toUpperCase()}
      </p>
    </footer>
  );
}

function LoadingScreen({ done }: { done: boolean }) {
  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-[80] bg-brand-cream grid place-items-center"
        >
          <div className="text-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-5xl font-serif italic gold-text"
            >
              S &amp; P
            </motion.div>
            <p className="mt-4 text-xs tracking-[0.4em] uppercase text-stone-400">A Love Story</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------- main ---------------- */

function WeddingHome() {
  const queryClient = useQueryClient();
  const [loaded, setLoaded] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const settingsQ = useSiteSettings();
  const heroQ = useHero();
  const coupleQ = useCoupleMembers();
  const timelineQ = useTimeline();
  const categoriesQ = useGalleryCategories();
  const imagesQ = useGalleryImages();
  const eventsQ = useEvents();
  const familyQ = useFamily();
  const venueQ = useVenue();
  const giftQ = useGiftSettings();
  const musicQ = useMusic();
  const socialQ = useSocialLinks();
  const blessingsQ = useBlessings();

  const ready = [settingsQ, heroQ, venueQ, giftQ].every((q) => q.isSuccess);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => setLoaded(true), 600);
    return () => clearTimeout(t);
  }, [ready]);

  const songs = musicQ.data?.tracks.map((t) => t.file_url) ?? [];
  const musicEnabled = musicQ.data?.settings.enabled ?? true;

  function toggleMusic() {
    const a = audioRef.current;
    if (!a || songs.length === 0) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.volume = 0.35;
      a.play().catch(() => {});
      setPlaying(true);
    }
  }

  function playNextSong() {
    if (songs.length === 0) return;
    setCurrentSong((prev) => (prev + 1) % songs.length);
  }

  function share() {
    const groomName = settingsQ.data?.groom_name ?? "";
    const brideName = settingsQ.data?.bride_name ?? "";
    const dateLabel = settingsQ.data?.wedding_date_label ?? "";
    const shareData = {
      title: `${groomName} & ${brideName} · Our Wedding`,
      text: `You're invited to ${groomName} & ${brideName}'s wedding on ${dateLabel}!`,
      url: typeof window !== "undefined" ? window.location.href : "",
    };
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(shareData.url);
      alert("Invitation link copied to clipboard!");
    }
  }

  if (!ready) {
    return <LoadingScreen done={false} />;
  }

  const settings = settingsQ.data!;
  const hero = heroQ.data!;
  const venue = venueQ.data!;
  const gift = giftQ.data!;
  const weddingDate = settings.wedding_date ?? new Date(Date.now() + 30 * 86_400_000).toISOString();
  const fallbackHeroImage = hero.image_url ?? heroImg;

  return (
    <>
      <LoadingScreen done={loaded} />
      <FloatingPetals />
      <Confetti show={confetti} />
      {musicEnabled && songs.length > 0 && (
        <audio
          ref={audioRef}
          src={songs[currentSong % songs.length]}
          onEnded={playNextSong}
          onLoadedData={() => {
            if (playing) {
              audioRef.current?.play().catch(() => {});
            }
          }}
          preload="auto"
        />
      )}

      <Nav
        playing={playing}
        onToggleMusic={toggleMusic}
        onShare={share}
        groomName={settings.groom_name}
        brideName={settings.bride_name}
      />

      <main className="relative overflow-x-hidden">
        {hero.visible && (
          <Hero
            imageUrl={fallbackHeroImage}
            eyebrow={settings.welcome_message}
            groomName={settings.groom_name}
            brideName={settings.bride_name}
            dateLabel={settings.wedding_date_label}
            tagline={settings.tagline}
            weddingDate={weddingDate}
          />
        )}
        <CountdownStrip weddingDate={weddingDate} />
        <StorySection timeline={timelineQ.data ?? []} />
        <GallerySection images={imagesQ.data ?? []} categories={categoriesQ.data ?? []} />
        <EventsSection events={eventsQ.data ?? []} />
        <FamilySection groups={familyQ.data?.groups ?? []} members={familyQ.data?.members ?? []} />
        <VenueSection venue={venue} />
        <RsvpSection
          rsvpDeadline={settings.rsvp_deadline}
          onSubmit={() => {
            setConfetti(true);
            queryClient.invalidateQueries({ queryKey: ["public", "blessings"] });
            setTimeout(() => setConfetti(false), 4000);
          }}
        />
        <BlessingsSection blessings={blessingsQ.data ?? []} />
        <GiftSection gift={gift} />
        <Footer
          onShare={share}
          groomName={settings.groom_name}
          brideName={settings.bride_name}
          weddingDate={weddingDate}
          venueName={venue.name}
          socialLinks={socialQ.data ?? []}
        />
      </main>
    </>
  );
}
