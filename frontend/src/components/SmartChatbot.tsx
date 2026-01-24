import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { chatbotAPI } from "@/lib/api";
import { ScrollArea } from "@/components/ui/scroll-area";

export const SmartChatbot = () => {
    const [messages, setMessages] = useState<{ role: string, content: string }[]>([
        { role: "assistant", content: "Hi! I'm your farming assistant. How can I help you today?" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (viewport) viewport.scrollTop = viewport.scrollHeight;
        }
    }, [messages, loading]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg = { role: "user", content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const res = await chatbotAPI.sendMessage(input, "english");
            setMessages(prev => [...prev, { role: "assistant", content: res.data.response }]);
        } catch (error: any) {
            console.error('Chatbot error:', error);
            const errorMsg = error.message || "I encountered an error. Please try again.";
            setMessages(prev => [...prev, { role: "assistant", content: errorMsg }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full flex flex-col h-[500px] shadow-lg border-primary/10 overflow-hidden">
            <CardHeader className="py-4 bg-primary/5 border-b border-primary/10">
                <CardTitle className="flex items-center gap-2 text-primary text-lg font-bold">
                    <MessageSquare className="h-5 w-5" />
                    AI Assistant
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-4 bg-background/50">
                <ScrollArea className="flex-1 pr-4 mb-4" ref={scrollRef}>
                    <div className="space-y-4">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === "user" ? "bg-accent" : "bg-primary"}`}>
                                    {m.role === "user" ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-white" />}
                                </div>
                                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${m.role === "user" ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted rounded-tl-none"}`}>
                                    {m.content}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex gap-3">
                                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center animate-pulse">
                                    <Bot className="h-4 w-4 text-white" />
                                </div>
                                <div className="bg-muted p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                                    <span className="text-xs italic">Typing...</span>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <div className="flex gap-2 p-1 bg-muted rounded-xl border border-border">
                    <Input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSend()}
                        placeholder="Ask anything..."
                        className="border-none bg-transparent focus-visible:ring-0 h-9 text-sm"
                        disabled={loading}
                    />
                    <Button
                        size="sm"
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        className="rounded-lg h-9 w-9 p-0"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
