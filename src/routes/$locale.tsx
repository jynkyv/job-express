import { createFileRoute, notFound } from "@tanstack/react-router";
import LandingPage from "@/app/(public)/[locale]/page";
import { defaultLocale, type Locale } from "@/i18n/config";
import zhMessages from "@/i18n/locales/zh.json";

const SEO_BASE_URL = "https://job-express.app";

function resolveLocale(rawLocale: string): Locale {
  if (rawLocale === "zh") {
    return "zh";
  }
  return defaultLocale;
}

function getLocaleSeo(locale: Locale) {
  const messages = zhMessages;
  const title = `${messages.common.title} - ${messages.common.subtitle}`;
  const description = messages.common.description;

  return {
    title,
    description,
    canonical: `${SEO_BASE_URL}/${locale}`
  };
}

export const Route = createFileRoute("/$locale")({
  head: ({ params }) => {
    const locale = resolveLocale(params.locale);
    const seo = getLocaleSeo(locale);

    return {
      meta: [
        { title: seo.title },
        { name: "description", content: seo.description },
        { name: "robots", content: "index,follow" },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "Job Express" },
        { property: "og:title", content: seo.title },
        { property: "og:description", content: seo.description },
        { property: "og:locale", content: "zh_CN" },
        { property: "og:url", content: seo.canonical },
        { property: "og:image", content: `${SEO_BASE_URL}/logo.png` },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: seo.title },
        { name: "twitter:description", content: seo.description },
        { name: "twitter:image", content: `${SEO_BASE_URL}/logo.png` }
      ],
      links: [
        { rel: "canonical", href: seo.canonical },
        { rel: "alternate", hrefLang: "zh", href: seo.canonical },
        { rel: "alternate", hrefLang: "x-default", href: `${SEO_BASE_URL}/zh` }
      ]
    };
  },
  component: LocaleLandingPage
});

function LocaleLandingPage() {
  const { locale } = Route.useParams();

  if (locale !== "zh") {
    notFound();
  }

  return <LandingPage />;
}
