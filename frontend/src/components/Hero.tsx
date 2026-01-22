import { Button } from "@/components/ui/button";
import { ArrowRight, Leaf, TrendingUp, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-farm.jpg";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Modern farming with technology"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
      </div>

      {/* Content */}
      <div className="container relative z-10 py-20 md:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center space-x-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary border border-primary/20">
              <Leaf className="h-4 w-4" />
              <span>AI-Powered Farm Management</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Welcome to <span className="text-primary">SwasthKeth</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
              From disease detection to weather analytics, manage your entire farm lifecycle with
              AI-powered insights. Make data-driven decisions and maximize your yield.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="xl" asChild>
                <Link to="/register">
                  Register Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link to="/login">Login</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-8">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <p className="text-2xl font-bold text-foreground">95%</p>
                </div>
                <p className="text-sm text-muted-foreground">Disease Detection Accuracy</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <p className="text-2xl font-bold text-foreground">10K+</p>
                </div>
                <p className="text-sm text-muted-foreground">Active Farmers</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Leaf className="h-5 w-5 text-primary" />
                  <p className="text-2xl font-bold text-foreground">30%</p>
                </div>
                <p className="text-sm text-muted-foreground">Avg. Yield Increase</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
