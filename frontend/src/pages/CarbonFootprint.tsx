import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Leaf, TrendingDown, Droplets, Zap, Truck, Loader2, Info } from "lucide-react";
import { carbonAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function CarbonFootprint() {
  const [history, setHistory] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const loadCarbonData = useCallback(async () => {
    try {
      setLoading(true);
      const [historyRes, recRes] = await Promise.all([
        carbonAPI.getHistory(),
        carbonAPI.getRecommendations()
      ]);

      // Using the latest history entry
      const latest = historyRes.data[historyRes.data.length - 1];
      setHistory(latest || null);
      setRecommendations(recRes.data);
    } catch (error: any) {
      toast({
        title: "Failed to load carbon data",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadCarbonData();
  }, [loadCarbonData]);

  const handleCalculate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      setSubmitting(true);
      const data = {
        fertilizerUse: parseFloat(formData.get('fertilizer') as string),
        pesticideUse: parseFloat(formData.get('pesticide') as string),
        fuelUse: parseFloat(formData.get('fuel') as string),
        energyUse: parseFloat(formData.get('energy') as string),
      };

      const response = await carbonAPI.calculateFootprint(data);

      setHistory(response.data);
      toast({
        title: "Footprint calculated",
        description: "Your sustainability metrics have been updated",
      });
      setIsDialogOpen(false);
      // We don't need to reload data if the response gives us the new state
    } catch (error: any) {
      toast({
        title: "Calculation failed",
        description: error.message || "Failed to calculate footprint",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const sustainabilityScore = history?.score || 0;
  const totalFootprint = history?.totalFootprint || 0;

  const chartData = [
    { name: 'Fertilizer', value: history?.metrics?.fertilizer || 0, color: '#10b981' },
    { name: 'Pesticides', value: history?.metrics?.pesticides || 0, color: '#0ea5e9' },
    { name: 'Fuel', value: history?.metrics?.fuel || 0, color: '#f59e0b' },
    { name: 'Energy', value: history?.metrics?.energy || 0, color: '#8b5cf6' },
  ].filter(item => item.value > 0);

  const metricCards = [
    {
      category: "Fertilizer Usage",
      value: history?.metrics?.fertilizer || 0,
      unit: "kg CO₂e",
      icon: Leaf,
      percentage: history?.percentageBreakdown?.fertilizer || 0,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      category: "Pesticide Impact",
      value: history?.metrics?.pesticides || 0,
      unit: "kg CO₂e",
      icon: Droplets,
      percentage: history?.percentageBreakdown?.pesticides || 0,
      color: "text-sky-500",
      bgColor: "bg-sky-500/10",
    },
    {
      category: "Energy Usage",
      value: history?.metrics?.energy || 0,
      unit: "kg CO₂e",
      icon: Zap,
      percentage: history?.percentageBreakdown?.energy || 0,
      color: "text-violet-500",
      bgColor: "bg-violet-500/10",
    },
    {
      category: "Fuel Consumption",
      value: history?.metrics?.fuel || 0,
      unit: "kg CO₂e",
      icon: Truck,
      percentage: history?.percentageBreakdown?.fuel || 0,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
  ];

  if (loading && !history) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background/50">
      <Header />
      <main className="flex-1 container py-8 max-w-7xl">
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold tracking-tight">Carbon Footprint Tracker</h1>
              <p className="text-xl text-muted-foreground">
                Monitor and optimize your farm's environmental sustainability
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="h-12 px-6 text-lg font-semibold shadow-lg shadow-primary/20">
                  <Leaf className="mr-2 h-5 w-5" />
                  Update Metrics
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="text-2xl">Update Farming Practices</DialogTitle>
                  <DialogDescription>
                    Enter your resource usage to calculate updated sustainability metrics.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCalculate} className="space-y-6 pt-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="fertilizer">Fertilizer (kg)</Label>
                      <Input id="fertilizer" name="fertilizer" type="number" step="0.1" placeholder="50" required className="h-12" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pesticide">Pesticides (liters)</Label>
                      <Input id="pesticide" name="pesticide" type="number" step="0.1" placeholder="5" required className="h-12" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="fuel">Fuel (liters)</Label>
                      <Input id="fuel" name="fuel" type="number" step="0.1" placeholder="20" required className="h-12" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="energy">Energy (kWh)</Label>
                      <Input id="energy" name="energy" type="number" step="0.1" placeholder="100" required className="h-12" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={submitting} className="w-full h-12 text-lg">
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Calculating Impact...
                        </>
                      ) : (
                        "Generate Report"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 overflow-hidden border-none shadow-xl bg-gradient-to-br from-card to-muted/50">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <TrendingDown className="h-6 w-6 text-primary" />
                      Sustainability Overview
                    </CardTitle>
                    <CardDescription>Comprehensive breakdown of your farm's carbon emissions</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-lg font-medium text-muted-foreground">Total Footprint</span>
                        <span className="text-4xl font-black text-primary">{totalFootprint.toFixed(1)} <span className="text-base font-normal">kg CO₂e</span></span>
                      </div>
                      <Progress value={sustainabilityScore} className="h-3 rounded-full" />
                      <p className="text-sm text-muted-foreground">
                        Your farm is performing <span className="font-bold text-foreground">{sustainabilityScore}% better</span> than conventional methods.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                      {metricCards.map((metric) => (
                        <div key={metric.category} className="p-4 rounded-xl border bg-card/50">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{metric.category}</p>
                          <p className="text-xl font-bold">{metric.value.toFixed(1)}</p>
                          <p className="text-xs text-muted-foreground">{metric.unit}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-none bg-primary text-primary-foreground overflow-hidden flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-3xl font-black">Score: {sustainabilityScore}</CardTitle>
                <CardDescription className="text-primary-foreground/80">Current Sustainability Rating</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-center text-center p-8 space-y-6">
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-48 h-48">
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      className="text-primary-foreground/20"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${sustainabilityScore * 5.52} 552`}
                      strokeLinecap="round"
                      className="text-white transform -rotate-90 origin-center transition-all duration-1000 ease-in-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-black">{sustainabilityScore}</span>
                    <span className="text-sm font-medium opacity-80 uppercase tracking-tighter">Points</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">
                    {sustainabilityScore > 80 ? "Eco-Warrior Status!" : sustainabilityScore > 60 ? "Great Progress!" : "Work in Progress"}
                  </h3>
                  <p className="text-primary-foreground/80 leading-relaxed">
                    {sustainabilityScore > 80
                      ? "Your farm is among the top 5% in sustainable practices. Keep setting the standard!"
                      : "You're on the right track! Implement the suggestions below to boost your score to 85+."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-emerald-500" />
                  Eco-Recommendations
                </CardTitle>
                <CardDescription>Tailored suggestions to reduce your footprint</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recommendations.length > 0 ? (
                  recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-muted/40 hover:bg-muted/70 transition-all border border-transparent hover:border-primary/10 group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{rec.title}</h3>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-bold ${rec.impact === "High"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-sky-500/10 text-sky-600"
                            }`}
                        >
                          {rec.impact} Impact
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
                      <div className="flex items-center gap-2 text-sm font-bold text-emerald-600">
                        <TrendingDown className="h-4 w-4" />
                        Potential savings: {rec.reduction}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center">
                      <Info className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground italic max-w-[250px] mx-auto">
                      Update your metrics to receive personalized eco-friendly recommendations.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-8">
              <Card className="border-none shadow-lg bg-gradient-to-br from-sky-500 to-blue-600 text-white overflow-hidden">
                <CardContent className="p-8 space-y-4">
                  <h3 className="text-2xl font-bold">Carbon Credit Potential</h3>
                  <p className="text-sky-100">By reducing your footprint, you become eligible for carbon credits which can be traded for financial rewards.</p>
                  <div className="pt-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-80 font-medium">Estimated Annual Value</p>
                      <p className="text-4xl font-black">₹ 1,200 - 4,500</p>
                    </div>
                    <Button variant="secondary" className="bg-white text-blue-600 hover:bg-sky-50 font-bold">Learn More</Button>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                {metricCards.map((metric) => {
                  const Icon = metric.icon;
                  return (
                    <Card key={metric.category} className="border-none shadow-md hover:shadow-lg transition-shadow">
                      <CardContent className="p-6 space-y-4">
                        <div className={`w-10 h-10 rounded-lg ${metric.bgColor} flex items-center justify-center`}>
                          <Icon className={`h-6 w-6 ${metric.color}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">{metric.category}</p>
                          <p className="text-2xl font-bold">{metric.percentage.toFixed(0)}% <span className="text-xs font-normal text-muted-foreground">share</span></p>
                        </div>
                        <Progress value={metric.percentage} className={`h-1.5 ${metric.bgColor}`} />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
