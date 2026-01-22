import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud, Droplets, Wind, Sun, CloudRain, Thermometer } from "lucide-react";
import { weatherAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function WeatherAnalytics() {
  const [currentWeather, setCurrentWeather] = useState<any>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        // Get user's location (in production, use geolocation API)
        const lat = 28.6139; // Delhi coordinates as default
        const lon = 77.2090;

        const [currentRes, forecastRes, recRes] = await Promise.all([
          weatherAPI.getCurrentWeather(lat, lon),
          weatherAPI.getForecast(),
          weatherAPI.getRecommendations()
        ]);

        setCurrentWeather(currentRes.data);
        setForecast(forecastRes.data.forecast || []);
        setRecommendations(recRes.data);
      } catch (error) {
        console.error('Error fetching weather data:', error);
        toast({
          title: "Error",
          description: "Failed to load weather data. Using demo data.",
          variant: "destructive",
        });
        // Fallback to demo data
        setCurrentWeather({
          temperature: 28,
          condition: "Partly Cloudy",
          humidity: 65,
          windSpeed: 12,
          precipitation: 20,
          uvIndex: 7,
        });
        setForecast([
          { day: "Mon", high: 30, low: 22, condition: "Sunny" },
          { day: "Tue", high: 29, low: 21, condition: "Cloudy" },
          { day: "Wed", high: 27, low: 20, condition: "Rainy" },
          { day: "Thu", high: 28, low: 21, condition: "Sunny" },
          { day: "Fri", high: 31, low: 23, condition: "Sunny" },
        ]);
        setRecommendations([
          "Ideal conditions for irrigation in the morning",
          "High UV index - protect crops from direct sunlight",
          "Rain expected Wednesday - delay pesticide application",
          "Good conditions for harvesting tomorrow",
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();
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
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold">Weather Analytics</h1>
              <p className="text-muted-foreground">
                Real-time weather data and AI predictions for informed farming decisions
              </p>
            </div>
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-6 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <Cloud className="h-16 w-16 text-primary" />
                  <div>
                    <div className="text-5xl font-bold">{currentWeather?.temperature}°C</div>
                    <div className="text-lg text-muted-foreground">{currentWeather?.condition}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Droplets className="h-8 w-8 text-accent" />
                  <div>
                    <div className="text-2xl font-bold">{currentWeather?.humidity}%</div>
                    <div className="text-sm text-muted-foreground">Humidity</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Wind className="h-8 w-8 text-accent" />
                  <div>
                    <div className="text-2xl font-bold">{currentWeather?.windSpeed} km/h</div>
                    <div className="text-sm text-muted-foreground">Wind</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CloudRain className="h-8 w-8 text-accent" />
                  <div>
                    <div className="text-2xl font-bold">{currentWeather?.precipitation}%</div>
                    <div className="text-sm text-muted-foreground">Rain Chance</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Sun className="h-8 w-8 text-accent" />
                  <div>
                    <div className="text-2xl font-bold">{currentWeather?.uvIndex}</div>
                    <div className="text-sm text-muted-foreground">UV Index</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5-Day Forecast</CardTitle>
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Thermometer className="h-5 w-5" />
                AI Farming Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
