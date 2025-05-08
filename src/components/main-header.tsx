import { Icons } from "@/components/icons";
import Link from "next/link";

export function MainHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <Link href="/" className="flex items-center space-x-2">
          <Icons.AppLogo className="h-6 w-6 text-primary" />
          <span className="inline-block font-bold text-xl">SyntraHub</span>
        </Link>
        {/* Add navigation items here if needed in the future */}
      </div>
    </header>
  );
}
