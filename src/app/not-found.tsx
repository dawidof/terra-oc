import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-4 text-6xl font-bold text-muted-foreground">404</h1>
      <h2 className="mb-2 text-2xl font-semibold">Страница не найдена</h2>
      <p className="mb-8 max-w-md text-muted-foreground">
        К сожалению, запрашиваемая страница не существует или была перемещена.
      </p>
      <div className="flex gap-4">
        <Link href="/">
          <Button>На главную</Button>
        </Link>
        <Link href="/cars">
          <Button variant="outline">Каталог</Button>
        </Link>
      </div>
    </div>
  );
}
