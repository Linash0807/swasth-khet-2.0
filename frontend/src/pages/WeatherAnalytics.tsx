import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Cloud, Droplets, Wind, Sun, CloudRain, Thermometer, Loader2, LineChart as LineChartIcon, History } from "lucide-react";
import { weatherAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

export default function WeatherAnalytics() {
  const [currentWeather, setCurrentWeather] = useState<any>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadWeatherData = async (lat?: number, lon?: number) => {
      try {
        setLoading(true);
        const [currentRes, forecastRes, recRes, historyRes] = await Promise.all([
          weatherAPI.getCurrentWeather(lat, lon),
          weatherAPI.getForecast(lat, lon),
          weatherAPI.getRecommendations(lat, lon),
          weatherAPI.getHistory()
        ]);

        setCurrentWeather(currentRes.data);
        setForecast(forecastRes.data.forecast || []);
        setRecommendations(recRes.data);
        setHistory(historyRes.data);
      } catch (error: any) {
        toast({
          title: "Failed to load weather data",
          description: error.message || "Please try again later",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          loadWeatherData(position.coords.latitude, position.coords.longitude);
        },
        () => {
          loadWeatherData(); // Fallback to server default
          toast({
            title: "Location denied",
            description: "Using default city weather data.",
          });
        }
      );
    } else {
      loadWeatherData();
    }
  }, [toast]);

  const getWeatherIcon = (condition: string) => {
    const c = condition?.toLowerCase() || "";
    if (c.includes("sun") || c.includes("clear")) return Sun;
    if (c.includes("rain") || c.includes("drizzle")) return CloudRain;
    if (c.includes("cloud")) return Cloud;
    return Sun; // Default
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container py-8">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!currentWeather) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container py-8">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center">
              <p>Failed to load weather data</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold">Weather Analytics</h1>
            <p className="text-muted-foreground">
              Real-time weather data and AI predictions for informed farming decisions
            </p>
          </div>

          <Card className="bg-gradient-card">
            <CardHeader>
              <CardTitle className="text-2xl">Current Weather</CardTitle>
              <CardDescription className="text-white/70">{currentWeather.location}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                <div className="col-span-2 space-y-2">
                  <div className="flex items-center gap-4">
                    <Cloud className="h-16 w-16 text-white" />
                    <div>
                      <div className="text-5xl font-bold">{currentWeather.temperature || currentWeather.temp}°C</div>
                      <div className="text-lg opacity-80">{currentWeather.condition}</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Droplets className="h-8 w-8 text-white/70" />
                  <div>
                    <div className="text-xl font-bold">{currentWeather.humidity}%</div>
                    <div className="text-xs opacity-70">Humidity</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Wind className="h-8 w-8 text-white/70" />
                  <div>
                    <div className="text-xl font-bold">{currentWeather.windSpeed} km/h</div>
                    <div className="text-xs opacity-70">Wind</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Sun className="h-8 w-8 text-white/70" />
                  <div>
                    <div className="text-xl font-bold">{currentWeather.uvIndex}</div>
                    <div className="text-xs opacity-70">UV Index</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChartIcon className="h-5 w-5 text-primary" />
                  Weather Trends
                </CardTitle>
                <CardDescription>7-day historical temperature and humidity analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history}>
                      <defs>
                        <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2e7d32" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#2e7d32" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis
                        dataKey="date"
                        fontSize={12}
                        tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { weekday: 'short' })}
                      />
                      <YAxis fontSize={12} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB' }}
                        labelFormatter={(label) => new Date(label).toLocaleDateString()}
                      />
                      <Area
                        type="monotone"
                        dataKey="temperature"
                        name="Temp (°C)"
                        stroke="#2e7d32"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorTemp)"
                      />
                      <Line
                        type="monotone"
                        dataKey="humidity"
                        name="Humidity (%)"
                        stroke="#0ea5e9"
                        strokeWidth={2}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Thermometer className="h-5 w-5 text-primary" />
                  AI Recommendations
                </CardTitle>
                <CardDescription>Generated for your specific conditions</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-smooth">
                      <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                      <span className="text-sm leading-relaxed">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                5-Day Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {forecast.map((day, index) => {
                  const Icon = day.icon || getWeatherIcon(day.condition);
                  const dayName = day.day || (day.date ? new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' }) : `Day ${index + 1}`);
                  return (
                    <div key={index} className="text-center space-y-2 p-4 rounded-lg bg-muted/30">
                      <div className="font-semibold">{dayName}</div>
                      <Icon className="h-12 w-12 mx-auto text-primary" />
                      <div className="text-sm text-muted-foreground">{day.condition}</div>
                      <div className="font-bold">
                        {day.high}° / {day.low}°
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
