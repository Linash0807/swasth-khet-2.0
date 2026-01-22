import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Calendar, Sprout, Loader2, MapPin } from "lucide-react";
import { farmAPI, cropAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function FarmRecords() {
  const [showForm, setShowForm] = useState(false);
  const [isFarmDialogOpen, setIsFarmDialogOpen] = useState(false);
  const [farms, setFarms] = useState<any[]>([]);
  const [crops, setCrops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [farmSubmitting, setFarmSubmitting] = useState(false);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [farmsRes, cropsRes] = await Promise.all([
        farmAPI.getFarms(),
        cropAPI.getCrops()
      ]);

      setFarms(farmsRes.data);
      setCrops(cropsRes.data);
    } catch (error: any) {
      toast({
        title: "Failed to load farm data",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddFarm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      setFarmSubmitting(true);
      const res = await farmAPI.createFarm({
        name: formData.get('name') as string,
        location: formData.get('location') as string,
        area: parseFloat(formData.get('area') as string),
      });

      if (res.success) {
        toast({
          title: "Farm created",
          description: "Your new farm has been registered",
        });
        setIsFarmDialogOpen(false);
        await loadData();
      }
    } catch (error: any) {
      console.error('Add farm error:', error);
      toast({
        title: "Failed to create farm",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setFarmSubmitting(false);
    }
  };

  const handleSubmitCrop = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const areaValue = parseFloat(formData.get('cropArea') as string);
      if (isNaN(areaValue)) throw new Error("Invalid area value");

      setSubmitting(true);
      const res = await cropAPI.createCrop({
        name: formData.get('cropType'),
        farm: formData.get('farmId'),
        sowingDate: formData.get('sowingDate'),
        expectedHarvestDate: formData.get('expectedHarvest'),
        area: areaValue,
        notes: formData.get('notes')
      });

      if (res.success) {
        toast({
          title: "Crop added successfully",
          description: "Your crop record has been saved",
        });
        setShowForm(false);
        await loadData();
      }
    } catch (error: any) {
      console.error('Add crop error:', error);
      toast({
        title: "Failed to add crop",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && farms.length === 0 && crops.length === 0) {
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold">Farm Records</h1>
              <p className="text-muted-foreground">
                Track your crops from seed to harvest
              </p>
            </div>
            <div className="flex gap-2">
              <Dialog open={isFarmDialogOpen} onOpenChange={setIsFarmDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="lg">
                    <MapPin className="mr-2 h-4 w-4" />
                    Add Farm
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Register New Farm</DialogTitle>
                    <DialogDescription>
                      Add a new farm location to start tracking your crops.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddFarm} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Farm Name</Label>
                      <Input id="name" name="name" placeholder="e.g. Sunny Valley" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input id="location" name="location" placeholder="e.g. Bhopal, MP" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="area">Total Area (acres)</Label>
                      <Input id="area" name="area" type="number" step="0.1" placeholder="e.g. 10.5" required />
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={farmSubmitting} className="w-full">
                        {farmSubmitting ? "Registering..." : "Register Farm"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <Button onClick={() => setShowForm(!showForm)} size="lg">
                <Plus className="mr-2 h-4 w-4" />
                Add Record
              </Button>
            </div>
          </div>

          {showForm && (
            <Card>
              <CardHeader>
                <CardTitle>New Crop Record</CardTitle>
                <CardDescription>Register a new crop for one of your farms</CardDescription>
              </CardHeader>
              <CardContent>
                {farms.length === 0 ? (
                  <div className="text-center py-8 bg-muted/20 rounded-lg border border-dashed">
                    <MapPin className="h-8 w-8 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">You need to add a farm first before you can register a crop.</p>
                    <Button onClick={() => setIsFarmDialogOpen(true)}>Add Your First Farm</Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitCrop} className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cropType">Crop Type</Label>
                      <Input id="cropType" name="cropType" placeholder="e.g., Wheat, Rice" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="farmId">Farm</Label>
                      <select
                        id="farmId"
                        name="farmId"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        required
                      >
                        <option value="">Select a farm</option>
                        {farms.map((farm) => (
                          <option key={farm._id} value={farm._id}>
                            {farm.name} - {farm.location}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cropArea">Area (acres)</Label>
                      <Input id="cropArea" name="cropArea" type="number" step="0.01" placeholder="e.g., 5.5" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sowingDate">Sowing Date</Label>
                      <Input id="sowingDate" name="sowingDate" type="date" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expectedHarvest">Expected Harvest</Label>
                      <Input id="expectedHarvest" name="expectedHarvest" type="date" required />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="notes">Additional Notes</Label>
                      <Textarea id="notes" name="notes" placeholder="Any special notes..." />
                    </div>
                    <div className="md:col-span-2 flex gap-4">
                      <Button type="submit" className="flex-1" disabled={submitting}>
                        {submitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Record"
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowForm(false)}
                        disabled={submitting}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {crops.map((crop) => (
              <Card key={crop._id} className="hover:shadow-lg transition-smooth">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sprout className="h-5 w-5 text-primary" />
                    {crop.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Area:</span>
                    <span className="font-medium">{crop.area} acres</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-medium text-primary capitalize">{crop.status?.replace('_', ' ') || 'Growing'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Farm:</span>
                    <span className="font-medium">{crop.farm?.name || 'Unknown'}</span>
                  </div>
                  <div className="pt-3 space-y-2 border-t border-border">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Sown: {new Date(crop.sowingDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Harvest: {new Date(crop.expectedHarvestDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
