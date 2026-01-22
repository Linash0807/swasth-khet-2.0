import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Loader2, Sparkles, Languages, ChevronRight } from "lucide-react";
import { chatbotAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Namaste! I'm your AI Farming Assistant. How can I help you today? I can provide expert advice on seeds, pest control, and soil health in multiple languages.",
    },
  ]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("english");
  const [isTyping, setIsTyping] = useState(false);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isTyping]);

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || isTyping) return;

    const userMessage: Message = { role: "user", content: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await chatbotAPI.sendMessage(messageText, language);

      const assistantMessage: Message = {
        role: "assistant",
        content: response.data.response,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      toast({
        title: "Assistant error",
        description: error.message || "Failed to get response from AI assistant",
        variant: "destructive",
      });
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "I'm sorry, I'm having trouble connecting to my brain right now. Please check your connection or try again later."
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const languages = [
    { value: "english", label: "English", flag: "🇺🇸" },
    { value: "hindi", label: "Hindi", flag: "🇮🇳" },
    { value: "telugu", label: "Telugu", flag: "🇮🇳" },
    { value: "tamil", label: "Tamil", flag: "🇮🇳" },
  ];

  const suggestions = [
    "Best seeds for summer",
    "Pest control for Rice",
    "Organic fertilizers",
    "Irrigation techniques",
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      <Header />

      <main className="flex-1 flex flex-col relative overflow-hidden pt-6">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl opacity-50 translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl opacity-50 -translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="container max-w-4xl flex-1 flex flex-col gap-6 relative z-10">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                Farming Assistant
              </h1>
              <p className="text-sm text-muted-foreground font-medium">
                Advanced Agricultural Intel by Gemini AI
              </p>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-muted/40 backdrop-blur-md rounded-xl border border-border">
              {languages.map((lang) => (
                <button
                  key={lang.value}
                  onClick={() => setLanguage(lang.value)}
                  className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${language === lang.value
                      ? "bg-background text-primary shadow-sm border border-border"
                      : "hover:bg-background/50 text-muted-foreground"
                    }`}
                >
                  <span>{lang.flag}</span>
                  <span className="hidden sm:inline">{lang.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Container */}
          <Card className="flex-1 flex flex-col shadow-xl border-border bg-background/60 backdrop-blur-xl overflow-hidden mb-8">
            <ScrollArea className="flex-1 px-4 py-8 md:px-8" ref={scrollRef}>
              <div className="max-w-2xl mx-auto space-y-8">
                {messages.map((message, i) => (
                  <div
                    key={i}
                    className={`flex gap-4 md:gap-6 ${message.role === "user" ? "flex-row-reverse" : "flex-row"
                      }`}
                  >
                    <div
                      className={`h-9 w-9 md:h-10 md:w-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform hover:scale-105 ${message.role === "assistant"
                          ? "bg-primary text-primary-foreground"
                          : "bg-accent text-accent-foreground"
                        }`}
                    >
                      {message.role === "assistant" ? (
                        <Bot className="h-5 w-5 md:h-6 md:w-6" />
                      ) : (
                        <User className="h-5 w-5 md:h-6 md:w-6" />
                      )}
                    </div>
                    <div
                      className={`relative max-w-[85%] rounded-2xl p-4 md:p-5 text-sm md:text-[15px] leading-relaxed shadow-sm transition-all ${message.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-none hover:shadow-md"
                          : "bg-muted/50 border border-border rounded-tl-none hover:bg-muted/70"
                        }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-4 md:gap-6">
                    <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Bot className="h-5 w-5 md:h-6 md:w-6 animate-pulse" />
                    </div>
                    <div className="bg-muted/50 border border-border rounded-2xl rounded-tl-none p-4 md:p-5 flex items-center gap-3">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-duration:800ms]" />
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:200ms] [animation-duration:800ms]" />
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:400ms] [animation-duration:800ms]" />
                      </div>
                      <span className="text-xs md:text-sm text-muted-foreground font-semibold uppercase tracking-wider">Assistant is analyzing...</span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Bottom Interaction Zone */}
            <div className="p-4 md:p-8 pt-0 border-t border-border/50 bg-gradient-to-b from-transparent to-background/50">
              {/* Suggestion Chips */}
              {!isTyping && messages.length < 5 && (
                <div className="max-w-2xl mx-auto flex flex-wrap justify-center gap-2 mb-6">
                  {suggestions.map((topic) => (
                    <button
                      key={topic}
                      onClick={() => handleSend(topic)}
                      className="px-4 py-1.5 rounded-full bg-muted/50 hover:bg-primary/10 hover:text-primary border border-border text-xs font-semibold transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                      {topic}
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              )}

              {/* Input Area */}
              <div className="max-w-2xl mx-auto relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-[22px] blur opacity-30 group-focus-within:opacity-100 transition duration-1000 group-focus-within:duration-200" />
                <div className="relative flex items-center bg-background border border-border rounded-[20px] shadow-2xl overflow-hidden">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask anything about your crops..."
                    className="border-none focus-visible:ring-0 h-14 pl-6 pr-14 bg-transparent text-base md:text-lg"
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    disabled={isTyping}
                  />
                  <Button
                    onClick={() => handleSend()}
                    disabled={isTyping || !input.trim()}
                    className="absolute right-2.5 h-10 w-10 rounded-xl transition-all shadow-lg active:scale-95"
                    size="icon"
                  >
                    {isTyping ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </Button>
                </div>
              </div>

              {/* Status Footer */}
              <div className="mt-4 flex items-center justify-center gap-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-black">
                <div className="flex items-center gap-1">
                  <Languages className="h-3 w-3" />
                  <span>{language}</span>
                </div>
                <div className="w-1.5 h-1.5 bg-muted-foreground/20 rounded-full" />
                <div className="flex items-center gap-1">
                  <Bot className="h-3 w-3" />
                  <span>Verified Professional Advice</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
