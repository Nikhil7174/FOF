import { Facebook, Instagram, Linkedin, Music2 } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} FOF 2026</p>
        <div className="flex items-center gap-4">
          <a href="https://facebook.com" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary"><Facebook className="h-5 w-5" /></a>
          <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary"><Instagram className="h-5 w-5" /></a>
          <a href="https://tiktok.com" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary"><Music2 className="h-5 w-5" /></a>
          <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary"><Linkedin className="h-5 w-5" /></a>
        </div>
      </div>
    </footer>
  );
};


