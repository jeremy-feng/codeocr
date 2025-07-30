import { SiteConfig } from "@/types/siteConfig";

export const BASE_URL: string = process.env.NEXT_PUBLIC_SITE_URL || '';
export const SOURCE_CODE_URL: string = "https://github.com/jeremy-feng/codeocr";

const TWITTER_URL: string = "https://x.com/mrfc17072574";
const EMAIL_URL: string = "mailto:jeremy-feng@qq.com";
const GITHUB_URL: string = "https://github.com/jeremy-feng/codeocr";
const HOMEPAGE_URL: string = "https://www.fengchao.pro";

export const siteConfig: SiteConfig = {
  name: "CodeOCR",
  tagLine: "CodeOCR",
  description: "CodeOCR",
  url: BASE_URL,
  authors: [
    {
      name: "Jeremy Feng",
      url: "https://fengchao.pro",
    },
  ],
  creator: "@jeremy-feng",
  socialLinks: {
    github: GITHUB_URL,
    homepage: HOMEPAGE_URL,
    twitter: TWITTER_URL,
    email: EMAIL_URL,
  },
  themeColors: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
  defaultNextTheme: "system", // next-theme option: system | dark | light
  icons: {
    icon: "/favicon.ico",
    shortcut: "/logo.png",
    apple: "/logo.png", // apple-touch-icon.png
  },
};
