import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Microscope, Cloud, FileText, ShoppingBag, MessageSquare, Leaf } from "lucide-react";
import diseaseIcon from "@/assets/disease-icon.png";
import weatherIcon from "@/assets/weather-icon.png";
import recordsIcon from "@/assets/records-icon.png";

const features = [
  {
    title: "AI Disease Detection",
    description: "Upload crop images and get instant AI-powered disease diagnosis with treatment recommendations.",
    icon: Microscope,
    image: diseaseIcon,
    color: "text-primary",
  },
  {
    title: "Weather Analytics",
    description: "Real-time weather data and AI predictions to make informed farming decisions.",
    icon: Cloud,
    image: weatherIcon,
    color: "text-accent",
  },
  {
    title: "Digital Farm Records",
    description: "Complete lifecycle tracking from seed to harvest with comprehensive data management.",
    icon: FileText,
    image: recordsIcon,
    color: "text-secondary",
  },
  {
    title: "Direct Marketplace",
    description: "Connect directly with buyers, eliminating middlemen and maximizing your profits.",
    icon: ShoppingBag,
    color: "text-primary",
  },
  {
    title: "Multilingual Chatbot",
    description: "Get instant farming advice in your language - Hindi, Telugu, Tamil, and English.",
    icon: MessageSquare,
    color: "text-accent",
  },
  {
    title: "Carbon Footprint Tracker",
    description: "Track and improve your farm's sustainability with actionable recommendations.",
    icon: Leaf,
    color: "text-primary",
  },
];

export const Features = () => {
  return (
    <section id="features" className="py-20 md:py-32 bg-muted/30">
      <div className="container">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
            Everything You Need for{" "}
            <span className="text-primary">Smart Farming</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comprehensive tools powered by AI to help you manage, analyze, and optimize your farm operations.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="group hover:shadow-lg transition-smooth hover:-translate-y-1 bg-gradient-card border-border"
              >
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    {feature.image ? (
                      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-background shadow-md">
                        <img src={feature.image} alt={feature.title} className="h-10 w-10 object-contain" />
                      </div>
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-smooth">
                        <Icon className={`h-7 w-7 ${feature.color}`} />
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-xl mt-4">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
