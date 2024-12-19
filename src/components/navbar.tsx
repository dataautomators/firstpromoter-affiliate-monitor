import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="p-4 shadow">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/">
          <h1 className="text-xl md:text-2xl font-bold">
          FP Affiliate Aggregator
          </h1>
        </Link>

        <SignedOut>
          <SignInButton />
        </SignedOut>

        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </nav>
  );
}
