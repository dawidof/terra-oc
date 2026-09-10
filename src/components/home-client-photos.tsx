import Image from "next/image";

import { Section, Heading, Eyebrow } from "@/components/ui/section";

const clientPhotos = [
  { url: "/client-photos/client1.jpg", alt: "Счастливый владелец Toyota Camry" },
  { url: "/client-photos/client2.jpg", alt: "Счастливый владелец Hyundai Tucson" },
  { url: "/client-photos/client3.jpg", alt: "Счастливый владелец BYD Atto 3" },
  { url: "/client-photos/client4.jpg", alt: "Счастливый владелец Kia Sportage" },
  { url: "/client-photos/client5.jpg", alt: "Счастливый владелец Zeekr 7X" },
  { url: "/client-photos/client6.jpg", alt: "Счастливый владелец Changan CS55" },
];

export function HomeClientPhotos() {
  return (
    <Section id="client-photos">
      <div>
        <Eyebrow>Наши клиенты</Eyebrow>
        <Heading size="xl" className="mt-3">
          Фото наших клиентов
        </Heading>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {clientPhotos.map((photo, i) => (
          <div
            key={i}
            className="group relative aspect-square overflow-hidden rounded-xl bg-muted shadow-soft transition duration-200 hover:-translate-y-1 hover:shadow-soft-lg"
          >
            <Image
              src={photo.url}
              alt={photo.alt}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
              className="object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-brand/0 transition-colors group-hover:bg-brand/20" />
          </div>
        ))}
      </div>
    </Section>
  );
}
