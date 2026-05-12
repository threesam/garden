import Image from "next/image";

export function SixToMidnightBanner() {
  return (
    <div className="border-y border-(--white)">
      <Image
        src="/assets/sixtomidnight-banner.jpg"
        alt="Six to Midnight banner"
        width={2480}
        height={520}
        sizes="100vw"
        className="block h-auto w-full"
      />
    </div>
  );
}
