import { APP_NAME } from "@/lib/constants";
import Image from "next/image";
import Link from "next/link";
import Menu from "./menu";
import CategoryDrawer from "./category-drawer";
import Search from "./search";
import { Suspense } from "react";
const Header = () => {
  return (
    <header className="w-full border-b">
      <div className="wrapper flex-between">
        <div className="flex-start">
          <Suspense>
            <CategoryDrawer />
          </Suspense>
          <Link href="/" className="flex-start ml-4">
            <Image
              src="/images/logo.svg"
              alt={`${APP_NAME} logo`}
              height={48}
              width={48}
              priority={true}
            />
            <span className="hidden lg:block font-bold text-2xl ml-3">
              {APP_NAME}
            </span>
          </Link>
        </div>
        <div className="hidden md:block">
          <Suspense>
            <Search />
          </Suspense>
        </div>
        <Menu />
      </div>
    </header>
  );
};

export default Header;
