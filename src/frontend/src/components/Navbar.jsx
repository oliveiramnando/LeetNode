import Link from "next/link";
import Container from "./Container";
import FriendSearch from "./FriendSearch";
import ProfileButton from "./ProfileButton";

export default function Navbar() {
  return (
    <header className="border-b border-white/10 bg-[#1E1E1E]">
      <Container className="flex h-14 items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-semibold tracking-tight text-white">
            LeetNode
          </Link>

          {/* Friend Search (client component) */}
          <FriendSearch />
        </div>

        <nav className="flex items-center gap-4 text-sm text-zinc-300">
          <Link className="hover:text-white transition-colors" href="/signup">
            signup
          </Link>
          <Link className="hover:text-white transition-colors" href="/login">
            login
          </Link>

          {/* Profile icon/button (client component) */}
          <ProfileButton />
        </nav>
      </Container>
    </header>
  );
}
