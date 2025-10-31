import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { api } from "@/api";

export default function Contact() {
  const { toast } = useToast();
  const [captcha, setCaptcha] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (!captcha) {
      toast({ title: "Captcha required", description: "Please confirm you're not a robot.", variant: "destructive" });
      return;
    }
    await api.sendEmail(String(form.get("email")), "Contact Request", String(form.get("message")) || "");
    toast({ title: "Message sent", description: "We'll get back to you soon." });
    e.currentTarget.reset();
    setCaptcha(false);
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-xl mx-auto">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" placeholder="e.g., Jane Doe" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="e.g., jane@example.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" name="message" placeholder="Type your message here..." required />
                </div>
                <div className="flex items-center gap-2">
                  <input id="captcha" type="checkbox" checked={captcha} onChange={(e) => setCaptcha(e.target.checked)} />
                  <Label htmlFor="captcha" className="cursor-pointer">I'm not a robot</Label>
                </div>
                <Button type="submit" className="w-full">Send</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


