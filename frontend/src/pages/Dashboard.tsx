import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import {
  Leaf,
  CloudRain,
  FileText,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Calendar,
  MapPin,
  MessageSquare,
  ShoppingBag
} from "lucide-react";
import { farmAPI, cropAPI, weatherAPI, marketplaceAPI, carbonAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { SmartChatbot } from "@/components/SmartChatbot";
import { AgriMap } from "@/components/AgriMap";

const Dashboard = () => {
  const [farms, setFarms] = useState<any[]>([]);
  const [crops, setCrops] = useState<any[]>([]);
  const [weather, setWeather] = useState<any>(null);
  const [marketplace, setMarketplace] = useState<any[]>([]);
  const [carbon, setCarbon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [farmsRes, cropsRes, weatherRes, marketplaceRes, carbonRes] = await Promise.all([
          farmAPI.getFarms(),
          cropAPI.getCrops(),
          weatherAPI.getCurrentWeather(),
          marketplaceAPI.getListings(),
          carbonAPI.getHistory()
        ]);

        setFarms(farmsRes.data);
        setCrops(cropsRes.data);
        setWeather(weatherRes.data);
        setMarketplace(marketplaceRes.data.slice(0, 2));
        setCarbon(carbonRes.data);
      } catch (error: any) {
        toast({
          title: "Failed to load dashboard data",
          description: error.message || "Please try again later",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [toast]);

  const totalArea = farms.reduce((sum, farm) => sum + farm.area, 0);
  const healthStatus = crops.length > 0 ? "Healthy" : "No crops";
  const nextHarvest = crops.length > 0
    ? crops.reduce((earliest, crop) =>
      new Date(crop.expectedHarvestDate).getTime() < new Date(earliest.expectedHarvestDate).getTime() ? crop : earliest
    )
    : null;
  const daysToHarvest = nextHarvest
    ? Math.ceil((new Date(nextHarvest.expectedHarvestDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold">Welcome back, Farmer!</h1>
            <p className="text-muted-foreground">Here's what's happening with your farm today.</p>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-card border-border hover:shadow-md transition-smooth">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Farms</CardTitle>
                <MapPin className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{farms.length}</div>
                <p className="text-xs text-muted-foreground">Total area: {totalArea} acres</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border hover:shadow-md transition-smooth">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Health Status</CardTitle>
                <Leaf className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{healthStatus}</div>
                <p className="text-xs text-muted-foreground">{crops.length} crops monitored</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border hover:shadow-md transition-smooth">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Next Harvest</CardTitle>
                <Calendar className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{daysToHarvest !== null ? `${daysToHarvest} Days` : "No crops"}</div>
                <p className="text-xs text-muted-foreground">
                  {nextHarvest ? `${nextHarvest.name} - ${nextHarvest.farm?.name || 'Farm'}` : 'No upcoming harvests'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border hover:shadow-md transition-smooth">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sustainability</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{carbon?.score || "---"}</div>
                <p className="text-xs text-muted-foreground">Eco-score rating</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Actions */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="group hover:shadow-lg transition-smooth hover:-translate-y-1 bg-gradient-card">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-smooth mb-4">
                  <Leaf className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Disease Detection</CardTitle>
                <CardDescription>Upload crop images for AI-powered disease analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/disease-detection">
                  <Button variant="default" className="w-full">
                    Scan Crops
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-smooth hover:-translate-y-1 bg-gradient-card">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-smooth mb-4">
                  <CloudRain className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Weather Analytics</CardTitle>
                <CardDescription>View forecasts and farming recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/weather">
                  <Button variant="accent" className="w-full">
                    View Weather
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-smooth hover:-translate-y-1 bg-gradient-card">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10 group-hover:bg-secondary/20 transition-smooth mb-4">
                  <FileText className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle>Farm Records</CardTitle>
                <CardDescription>Manage your digital farm lifecycle data</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/records">
                  <Button variant="secondary" className="w-full">
                    View Records
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-smooth hover:-translate-y-1 bg-gradient-card">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-smooth mb-4">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Marketplace</CardTitle>
                <CardDescription>Connect with buyers and sell your produce</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/marketplace">
                  <Button variant="default" className="w-full">
                    Browse Market
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-smooth hover:-translate-y-1 bg-gradient-card">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-smooth mb-4">
                  <MessageSquare className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Farming Assistant</CardTitle>
                <CardDescription>Get instant AI advice in your language</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/chatbot">
                  <Button variant="accent" className="w-full">
                    Start Chat
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-smooth hover:-translate-y-1 bg-gradient-card">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10 group-hover:bg-secondary/20 transition-smooth mb-4">
                  <Leaf className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle>Carbon Footprint</CardTitle>
                <CardDescription>Track and improve your sustainability</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/carbon-footprint">
                  <Button variant="secondary" className="w-full">
                    View Metrics
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <SmartChatbot />
            <AgriMap />
          </div>

          {/* Alerts & Marketplace */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <span>Recent Alerts</span>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {weather && weather.precipitation > 50 && (
                    <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                      <CloudRain className="h-5 w-5 text-accent mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">Heavy Rain Expected</p>
                        <p className="text-xs text-muted-foreground">High precipitation chance</p>
                      </div>
                    </div>
                  )}
                  {crops.some(crop => {
                    const daysToHarvest = Math.ceil((new Date(crop.expectedHarvestDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    return daysToHarvest <= 7 && daysToHarvest > 0;
                  }) && (
                      <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                        <Leaf className="h-5 w-5 text-primary mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">Harvest Due Soon</p>
                          <p className="text-xs text-muted-foreground">Check crops ready for harvest</p>
                        </div>
                      </div>
                    )}
                  {!weather && !crops.length && (
                    <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                      <AlertTriangle className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">No alerts at this time</p>
                        <p className="text-xs text-muted-foreground">Add farms and crops to see alerts</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    <span>Marketplace</span>
                  </CardTitle>
                  <Link to="/marketplace">
                    <Button variant="ghost" size="sm">View All</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {marketplace.map((item) => (
                    <div key={item._id} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-primary/5 hover:bg-muted/50 transition-all group">
                      <div className="space-y-1">
                        <p className="font-bold text-sm text-foreground">{item.title || item.crop}</p>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-semibold uppercase">
                          <span>₹{item.price}/kg</span>
                          <span className="h-1 w-1 bg-muted-foreground rounded-full" />
                          <span>{item.quantity} {item.unit || 'kg'} available</span>
                        </div>
                      </div>
                      <Link to="/marketplace">
                        <Button size="sm" variant="outline" className="h-8 rounded-lg group-hover:bg-primary group-hover:text-white transition-all">
                          View
                        </Button>
                      </Link>
                    </div>
                  ))}
                  {marketplace.length === 0 && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium text-sm">No listings available</p>
                        <p className="text-xs text-muted-foreground">Check back later</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
