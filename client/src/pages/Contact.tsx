import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef, useEffect } from "react";
import { api } from "@/api";

export default function Contact() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [captcha, setCaptcha] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const lastSubmitTimeRef = useRef<number>(0);
  const DEBOUNCE_DELAY = 3000; // 3 seconds between submissions

  // Clear success state after 5 seconds
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        setIsSuccess(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      message: "",
    });
    setCaptcha(false);
    setIsSuccess(false);
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    // Debouncing: Prevent spam submissions
    const now = Date.now();
    const timeSinceLastSubmit = now - lastSubmitTimeRef.current;
    
    if (timeSinceLastSubmit < DEBOUNCE_DELAY) {
      const remainingTime = Math.ceil((DEBOUNCE_DELAY - timeSinceLastSubmit) / 1000);
      toast({ 
        title: "Please wait", 
        description: `You can submit again in ${remainingTime} second${remainingTime > 1 ? 's' : ''}.`, 
        variant: "destructive" 
      });
      return;
    }

    if (!captcha) {
      toast({ title: "Captcha required", description: "Please confirm you're not a robot.", variant: "destructive" });
      return;
    }

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast({ title: "All fields required", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    lastSubmitTimeRef.current = now;
    
    try {
      console.log("Sending contact message...");
      await api.sendContactMessage(formData.name, formData.email, formData.message);
      console.log("Contact message sent successfully");
      
      // Only show success and reset after actual email is sent
      // Clear form data but keep success state
      setFormData({
        name: "",
        email: "",
        message: "",
      });
      setCaptcha(false);
      setIsSuccess(true);
      
      toast({ 
        title: "Message sent successfully!", 
        description: "We've received your message and will get back to you soon.", 
      });
    } catch (error: any) {
      console.error("Error sending contact message:", error);
      toast({ 
        title: "Failed to send message", 
        description: error.message || "Please try again later.", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
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
              {isSuccess ? (
                <div className="text-center py-8 space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                    <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold">Message Sent Successfully!</h3>
                  <p className="text-muted-foreground">We've received your message and will get back to you soon.</p>
                  <Button onClick={resetForm} variant="outline" className="mt-4">
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g., Jane Doe" 
                      required 
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="e.g., jane@example.com" 
                      required 
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea 
                      id="message" 
                      name="message" 
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Type your message here..." 
                      required 
                      disabled={isSubmitting}
                      rows={5}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      id="captcha" 
                      type="checkbox" 
                      checked={captcha} 
                      onChange={(e) => setCaptcha(e.target.checked)}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="captcha" className="cursor-pointer">I'm not a robot</Label>
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


