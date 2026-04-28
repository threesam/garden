import type { Metadata } from "next";
import { getContent } from "@/lib/content";
import { Prose } from "@/components/prose";

export const metadata: Metadata = {
  title: "benny — threesam",
  description: "remembering 102 jackson street.",
};

export default async function BennyPage() {
  const markdown = await getContent("benny");

  return (
    <main
      className="min-h-screen bg-zinc-900"
      style={{ color: "var(--white)" }}
    >
      <section className="relative grid min-h-[80vh] place-content-center overflow-hidden text-center">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster="/assets/sixtomidnight-tribute-poster.jpg"
          className="absolute inset-0 h-full w-full object-cover opacity-50"
          aria-label="six to midnight productions montage"
        >
          <source src="/assets/sixtomidnight-tribute.webm" type="video/webm" />
          <source src="/assets/sixtomidnight-tribute.mp4" type="video/mp4" />
        </video>
        <div className="relative z-10 px-6">
          <h2 className="font-mono text-sm uppercase tracking-[0.22em] text-[var(--coin)] md:text-base">
            remembering
          </h2>
          <h1
            className="mt-4 font-mono text-3xl font-bold uppercase tracking-[0.1em] md:text-6xl"
            style={{ color: "var(--white)" }}
          >
            102 Jackson Street
          </h1>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-3xl px-6 py-20 md:px-8 md:py-28">
          <div className="space-y-6 font-sans text-base leading-relaxed md:text-2xl md:leading-relaxed">
            <p>
              Located in the historic Mill Hill Park of Trenton, NJ,
              sixtomidnight production studios offers a rapidly evolving,
              state-of-art marriage of digital and analog gear for all of your
              recording and creative needs. This balance of analog and digital
              elements is a dichotomy that we do our best to explore in every
              facet of every service that we offer. We have a true love for
              everything analog, as the warmth and character that it provides
              is what gives any recording that vintage feel; however, the
              effect of rapid advancement in audio technology cannot be
              understated&mdash;the ability to process vast amounts of sensory
              information within a digital audio workstation, on the fly, is
              changing the way we produce media.
            </p>

            <h2 className="!mb-6 !mt-20 font-mono text-3xl font-bold uppercase tracking-[0.08em] md:!mt-28 md:text-5xl">
              Music Recording and Production
            </h2>
            <p>
              We have accrued extensive knowledge of methods to record, and
              utilize, a wide array of session instruments in multi-tracked
              recordings. From sax to vibraslap, we accommodate musicians, of
              any skill level, by providing the right microphone and a stellar
              atmosphere to extract and capture solid performances. As
              weathered instrumentalists ourselves, we can drop a bassline, or
              guitar riff to help fill-out arrangements; and if not us, we can
              co-opt another session instrumentalist from our network of
              extremely talented musicians; we seek, more than anything else,
              to community-build and help art support art.
            </p>
            <p>
              During out client consultations, we listen to intent with the
              hope of actualizing those ideas and, maybe, expanding the scope.
              Sometimes, the singer/songwriter actually wants more than their
              keyboard and voice on their record. We have and will continue to
              accumulate &ldquo;the toys&rdquo; to provide us, and our clients,
              with fresh production avenues. Along with our ever-growing cache
              of guitars, bass, uke, banjo, keys, percussion, etc., we have an
              appreciation of electronic instruments that is near geek-level.
              We can and will fill out arrangements, score TV/film, or create
              jingles efficiently while using our full arsenal of electro toys,
              if necessary.
            </p>
            <p>
              Our studio is not genre-specific. We have wide-ranging experience
              in the production of rock, hardcore, punk, electronic,
              alternative, hip-hop, rap, R&amp;B, folk, progressive, and every
              sub-genre in between.
            </p>

            <h2 className="!mb-6 !mt-20 font-mono text-3xl font-bold uppercase tracking-[0.08em] md:!mt-28 md:text-5xl">
              Audio Meets Video
            </h2>
            <p>
              We recognize entertainment as a fluid binding of senses. The
              experience of music is most enjoyed as the combination of audio
              and visual elements; they feed each other. As such, our interest
              in visual accompaniments is ever-present in our approach to
              potential clients; we can deliver video-recording/editing,
              co/ghost writing, photography, art (in various mediums), as well
              as digital/analog editing, branding and distribution. Whether the
              need is for some rap lyrics over a prerecorded beat with a music
              video and album art, or a video advertisement for a local
              business with originally scored music, we want to say yes. As
              every need is unique, flexibility is a hallmark of each of our
              various audio/visual services.
            </p>
            <p>
              Moreover, while our physical address is in Trenton, if necessary,
              our studio is fully mobile and we can travel to document and/or
              produce events or performances&mdash;regardless of location the
              fidelity of our recordings remains consistent. With this in mind,
              often the best performances are achieved when the performer is
              comfortable, and there is an enriched environment to craft. This
              is why we have done our best to create an immersive atmosphere at
              the studio to bolster the creative process.
            </p>

            <h2 className="!mb-6 !mt-20 font-mono text-3xl font-bold uppercase tracking-[0.08em] md:!mt-28 md:text-5xl">
              Marketing Makes, the World Takes
            </h2>
            <p>
              For the veteran or the beginner, the recording session is
              something important&mdash;a step to make permanent the sounds
              they make or hear. This is why every session, either in Trenton
              or elsewhere, can be captured with creative photography and
              multiple and dynamic camera angles for future editing, as well as
              be live-streamed to audiences on Facebook or YouTube. The whole
              experience, we firmly believe, is worth remembering and sharing.
              Depending on intent, marketing to a larger audience and branding
              content is a vital step in allowing entertainment-based media to
              have staying power.
            </p>
            <p>
              Photography is a huge part of our in-house marketing; whether we
              are taking artistic headshots or snapping energetic shots of
              music in motion, demonstrating the process of artistic creation
              is one of the many valuable marketing methods we employ. Our
              network of graphic designers can produce and distribute
              high-quality branded content (stickers, posters, etc.), and our
              relationships with numerous venues, public and private, makes
              building a local presence possible and tenable. Applying
              guerilla techniques has become somewhat of an art-form for us,
              bleeding into our love of artist-community development.
              Deferring the cost of marketing, or coupling it with paid
              advertising, is easier when the community is actively
              contributing.
            </p>
            <p>
              Another way to make a movement stronger is by seeking and
              collaborating with like-minded creators. Building up individuals
              and then combining multiple efforts toward a common goal is a
              huge source of progress. It is our goal to make sure that any
              vision has all of the components necessary to succeed; this
              usually involves persistence first, and recognizing and
              manipulating the status quo to break through it. We come across
              unique performers routinely, and with our collective years of
              experience in marketing and advertising in our day-jobs, we have
              found that promotion, itself, is an art. By staying current on
              the shifting state of multimedia flux, we enjoy treading new
              ground and are prepared to identify and explore your specific
              needs in engaging with hypermedia.
            </p>

            <h2 className="!mb-6 !mt-20 font-mono text-3xl font-bold uppercase tracking-[0.08em] md:!mt-28 md:text-5xl">
              Come Hang
            </h2>
            <p>
              We cannot emphasize enough the importance of community (although
              we have tried) and the positive effect that this focus can have
              on society. This is why we are committed to serving our community
              with events that bring various forms of art together: stay
              connected through Facebook and Instagram for upcoming events. If
              your intention is to host a private event, any and all of the
              attention to detail that we seek in our aforementioned services
              are available to make the occasion as memorable as possible.
            </p>
          </div>
        </div>
      </section>

      {markdown && (
        <section>
          <div className="mx-auto max-w-3xl px-6 pb-20 md:px-8 md:pb-28">
            <div className="tier-essay">
              <Prose content={markdown} />
            </div>
          </div>
        </section>
      )}

      <section className="pb-16">
        <div className="mx-auto flex w-max flex-col items-center rounded-2xl border border-zinc-700 p-6 shadow-[inset_0_0_2px_black]">
          <h3 className="m-0 font-mono text-sm font-bold uppercase tracking-[0.22em] text-[var(--coin)]">
            Social Links
          </h3>
          <span className="mt-1 text-xs text-zinc-400">(archived)</span>
          <div className="mt-3 flex h-12 flex-row items-center gap-6">
            <a
              href="https://www.facebook.com/pages/Six-to-Midnight-Production-Studios/166143110389253"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="facebook"
              className="opacity-70 transition-opacity hover:opacity-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-10 w-10"
                aria-hidden="true"
              >
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12Z" />
              </svg>
            </a>
            <a
              href="https://www.instagram.com/sixtomidnightproductions"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="instagram"
              className="opacity-70 transition-opacity hover:opacity-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-10 w-10"
                aria-hidden="true"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.336 3.608 1.311.975.975 1.249 2.242 1.311 3.608.058 1.266.069 1.646.069 4.85s-.011 3.584-.069 4.85c-.062 1.366-.336 2.633-1.311 3.608-.975.975-2.242 1.249-3.608 1.311-1.266.058-1.646.069-4.85.069s-3.584-.011-4.85-.069c-1.366-.062-2.633-.336-3.608-1.311-.975-.975-1.249-2.242-1.311-3.608C2.175 15.747 2.163 15.367 2.163 12s.012-3.584.07-4.85c.062-1.366.336-2.633 1.311-3.608.975-.975 2.242-1.249 3.608-1.311C8.416 2.175 8.796 2.163 12 2.163Zm0 1.802c-3.141 0-3.5.012-4.732.069-1.018.046-1.926.21-2.633.917-.708.708-.871 1.616-.917 2.633C3.66 8.5 3.648 8.859 3.648 12c0 3.141.012 3.5.069 4.732.046 1.018.21 1.926.917 2.633.708.708 1.616.871 2.633.917 1.232.057 1.591.069 4.732.069s3.5-.012 4.732-.069c1.018-.046 1.926-.21 2.633-.917.708-.708.871-1.616.917-2.633.057-1.232.069-1.591.069-4.732s-.012-3.5-.069-4.732c-.046-1.018-.21-1.926-.917-2.633-.708-.708-1.616-.871-2.633-.917C15.5 3.977 15.141 3.965 12 3.965Zm0 3.063A4.973 4.973 0 1 0 12 17a4.973 4.973 0 0 0 0-9.972Zm0 8.205a3.232 3.232 0 1 1 0-6.464 3.232 3.232 0 0 1 0 6.464ZM18.406 6.78a1.163 1.163 0 1 0-.001-2.327 1.163 1.163 0 0 0 .001 2.327Z" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      <div className="relative w-full">
        <img
          src="/assets/sixtomidnight-banner.jpg"
          alt="Six to Midnight banner"
          className="block w-full"
        />
      </div>
    </main>
  );
}
