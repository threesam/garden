import Image from "next/image";

// 57 photos curated and resized at build time — see
// public/assets/benny-photos/ and the staging notes.
const PHOTO_COUNT = 57;

const photos = Array.from({ length: PHOTO_COUNT }, (_, i) => {
  const idx = String(i + 1).padStart(3, "0");
  return `/assets/benny-photos/${idx}.jpg`;
});

export function BennyPhotoMosaic() {
  return (
    <div
      // Break out of the prose container to take the full viewport width.
      className="relative left-1/2 my-9 max-h-dvh w-screen -translate-x-1/2 overflow-hidden"
    >
      <div className="columns-4 gap-1 sm:columns-6 lg:columns-8 xl:columns-10 [&>*]:mb-1">
        {photos.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt=""
            width={400}
            height={600}
            loading="lazy"
            sizes="(min-width: 1280px) 10vw, (min-width: 1024px) 12.5vw, (min-width: 640px) 16.7vw, 25vw"
            className="block w-full break-inside-avoid"
          />
        ))}
      </div>
    </div>
  );
}
