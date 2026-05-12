import Image from "next/image";

const PHOTO_COUNT = 57;

const photos = Array.from({ length: PHOTO_COUNT }, (_, i) => {
  const idx = String(i + 1).padStart(3, "0");
  return `/assets/benny-photos/${idx}.jpg`;
});

export function BennyPhotoMosaic() {
  return (
    <div className="max-h-dvh overflow-hidden">
      <div className="columns-4 gap-1 sm:columns-6 lg:columns-8 xl:columns-10 [&>*]:mb-1">
        {photos.map((src) => (
          <Image
            key={src}
            src={src}
            alt=""
            width={400}
            height={600}
            loading="lazy"
            sizes="(min-width: 1280px) 9vw, (min-width: 1024px) 12vw, (min-width: 640px) 16vw, 24vw"
            className="block w-full break-inside-avoid"
          />
        ))}
      </div>
    </div>
  );
}
