import HeaderLinks from "@/components/header/HeaderLinks";
import MobileMenu from "@/components/header/MobileMenu";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { siteConfig } from "@/config/site";
import { Link as I18nLink } from "@/i18n/routing";
import Image from "next/image";

const Header = () => {
  return (
    <header className="py-4">
      <div className="mx-auto px-2 sm:px-4 lg:px-12">
        <nav className="relative z-50 flex justify-between">
          <div className="flex items-center md:gap-x-12 flex-1">
            <I18nLink
              href="/"
              prefetch={false}
              className="flex items-center font-bold select-none"
            >
              <Image
                alt={siteConfig.name}
                src="/logo.svg"
                className="h-8 w-auto"
                width={200}
                height={60}
              />
            </I18nLink>
            <div className="hidden md:flex md:gap-x-6"></div>
          </div>

          <HeaderLinks />

          <div className="flex items-center gap-x-2 md:gap-x-4 lg:gap-x-6 flex-1 justify-end">
            {/* PC */}
            <div className="hidden md:flex items-center gap-x-4">
              <LocaleSwitcher />
              <ThemeToggle />
            </div>

            {/* Mobile */}
            <MobileMenu />
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
