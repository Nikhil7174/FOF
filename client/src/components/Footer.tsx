import { Facebook, Instagram, Linkedin, Music2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";

const DEFAULT_SOCIAL_LINKS = {
  facebook: "https://facebook.com",
  instagram: "https://instagram.com",
  tiktok: "https://tiktok.com",
  linkedin: "https://linkedin.com",
};

export const Footer = () => {
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: api.getSettings,
    retry: 1,
  });

  const socialLinks = [
    {
      href: settings?.facebookUrl || DEFAULT_SOCIAL_LINKS.facebook,
      icon: Facebook,
      label: "Facebook",
    },
    {
      href: settings?.instagramUrl || DEFAULT_SOCIAL_LINKS.instagram,
      icon: Instagram,
      label: "Instagram",
    },
    {
      href: settings?.tiktokUrl || DEFAULT_SOCIAL_LINKS.tiktok,
      icon: Music2,
      label: "TikTok",
    },
    {
      href: settings?.linkedinUrl || DEFAULT_SOCIAL_LINKS.linkedin,
      icon: Linkedin,
      label: "LinkedIn",
    },
  ];

  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} FOF 2026</p>
        <div className="flex items-center gap-4">
          {socialLinks.map(({ href, icon: Icon, label }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              className="text-muted-foreground hover:text-primary"
            >
              <Icon className="h-5 w-5" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};
