import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShoppingBag, Search, MapPin, Loader2, Plus, Filter, Tag, Calendar, Package } from "lucide-react";
import { marketplaceAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

export default function Marketplace() {
  const [listings, setListings] = useState<any[]>([]);
  const [userListings, setUserListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [allRes, userRes] = await Promise.all([
        marketplaceAPI.getListings(),
        marketplaceAPI.getUserListings()
      ]);
      setListings(allRes.data);
      setUserListings(userRes.data);
    } catch (error: any) {
      toast({
        title: "Failed to load marketplace",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      setSubmitting(true);
      await marketplaceAPI.createListing({
        title: formData.get('title'),
        crop: formData.get('crop'),
        quantity: parseFloat(formData.get('quantity') as string),
        unit: formData.get('unit') || 'kg',
        price: parseFloat(formData.get('price') as string),
        priceUnit: 'per_kg',
        quality: formData.get('quality'),
        location: formData.get('location'),
        description: formData.get('description'),
        harvestDate: formData.get('harvestDate'),
        organic: formData.get('organic') === 'on',
      });

      toast({
        title: "Product listed",
        description: "Your product is now visible on the marketplace",
      });
      setIsDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast({
        title: "Listing failed",
        description: error.message || "Failed to list product",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleContact = async (id: string) => {
    try {
      await marketplaceAPI.sendInquiry(id, "I am interested in your produce. Please contact me.");
      toast({
        title: "Inquiry sent",
        description: "The seller has been notified of your interest",
      });
    } catch (error: any) {
      toast({
        title: "Inquiry failed",
        description: error.message || "Failed to send inquiry",
        variant: "destructive",
      });
    }
  };

  const currentListings = activeTab === "all" ? listings : userListings;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold">Marketplace</h1>
              <p className="text-muted-foreground">
                Connect directly with buyers and maximize your profits
              </p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="rounded-full shadow-lg">
                  <Plus className="mr-2 h-5 w-5" />
                  List Product
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>List Your Produce</DialogTitle>
                  <DialogDescription>
                    Fill in the details to list your crop on the marketplace.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Listing Title</Label>
                    <Input id="title" name="title" placeholder="e.g. Fresh Organic Sona Masuri Rice" required />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="crop">Crop Name</Label>
                      <Input id="crop" name="crop" placeholder="e.g. Rice" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="harvestDate">Harvest Date</Label>
                      <Input id="harvestDate" name="harvestDate" type="date" required />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input id="quantity" name="quantity" type="number" step="0.1" placeholder="100" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit">Unit</Label>
                      <Select name="unit" defaultValue="kg">
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">Kilograms (kg)</SelectItem>
                          <SelectItem value="quintal">Quintal</SelectItem>
                          <SelectItem value="ton">Ton</SelectItem>
                          <SelectItem value="pieces">Pieces</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (₹ per kg)</Label>
                      <Input id="price" name="price" type="number" placeholder="25" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quality">Quality</Label>
                      <Select name="quality" defaultValue="standard">
                        <SelectTrigger>
                          <SelectValue placeholder="Select quality" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="grade_a">Grade A</SelectItem>
                          <SelectItem value="grade_b">Grade B</SelectItem>
                          <SelectItem value="standard">Standard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="location" name="location" className="pl-10" placeholder="City, State" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" placeholder="Short description about your produce..." required />
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox id="organic" name="organic" />
                    <Label htmlFor="organic" className="text-sm font-medium leading-none cursor-pointer">
                      Organic Produce
                    </Label>
                  </div>

                  <DialogFooter className="pt-4">
                    <Button type="submit" disabled={submitting} className="w-full h-12">
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Listing...
                        </>
                      ) : (
                        "Confirm & List Product"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <TabsList className="bg-muted/50 p-1">
                <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-white px-6">
                  All Products
                </TabsTrigger>
                <TabsTrigger value="my" className="data-[state=active]:bg-primary data-[state=active]:text-white px-6">
                  My Products
                </TabsTrigger>
              </TabsList>

              <div className="flex gap-2">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search crops..." className="pl-9 h-10 border-muted" />
                </div>
                <Button variant="outline" size="icon" className="h-10 w-10">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <TabsContent value="all" className="mt-0">
              <ListingGrid
                listings={listings}
                loading={loading}
                onContact={handleContact}
                emptyTitle="No listings found"
                emptyDesc="Be the first to list your produce and connect with buyers!"
              />
            </TabsContent>

            <TabsContent value="my" className="mt-0">
              <ListingGrid
                listings={userListings}
                loading={loading}
                onContact={handleContact}
                isOwnerView
                emptyTitle="You haven't listed anything yet"
                emptyDesc="Put your produce on the market and find buyers today."
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function ListingGrid({ listings, loading, onContact, isOwnerView, emptyTitle, emptyDesc }: any) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed border-muted">
        <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
        <p className="text-2xl font-bold text-foreground/80">{emptyTitle}</p>
        <p className="text-muted-foreground max-w-sm mx-auto mt-2">{emptyDesc}</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {listings.map((listing: any) => (
        <Card key={listing._id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-border bg-gradient-card">
          <div className="p-1">
            <div className="relative aspect-video rounded-t-xl overflow-hidden bg-muted flex items-center justify-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground/20" />
              <div className="absolute top-3 right-3 flex flex-col gap-2">
                <span className="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  ₹{listing.price} / {listing.unit || 'kg'}
                </span>
                {listing.organic && (
                  <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded-full text-center uppercase tracking-wider">
                    Organic
                  </span>
                )}
              </div>
            </div>
          </div>
          <CardHeader className="pb-3 pt-4">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <CardTitle className="text-xl line-clamp-1">{listing.title}</CardTitle>
                <div className="flex items-center gap-1.5 text-xs text-primary font-semibold uppercase tracking-wide">
                  <Tag className="h-3 w-3" />
                  {listing.crop}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 bg-muted/30 p-3 rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase">
                  <Package className="h-3 w-3" /> Quantity
                </div>
                <div className="font-bold text-sm">{listing.quantity} {listing.unit}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase">
                  <Filter className="h-3 w-3" /> Quality
                </div>
                <div className="text-sm">
                  <span className="font-bold capitalize">{listing.quality?.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
              {listing.description}
            </p>

            <div className="pt-4 border-t border-border space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-medium">{listing.location}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                Harvested on: <span className="text-foreground font-semibold">{new Date(listing.harvestDate).toLocaleDateString()}</span>
              </div>

              {!isOwnerView && (
                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    Seller: <span className="text-foreground font-bold">{listing.seller?.name || "Farmer"}</span>
                  </span>
                  <span className="text-muted-foreground">{new Date(listing.createdAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              {isOwnerView ? (
                <Button variant="outline" className="w-full">
                  Edit Listing
                </Button>
              ) : (
                <>
                  <Button
                    variant="default"
                    className="flex-1 shadow-md hover:shadow-lg transition-all"
                    onClick={() => onContact(listing._id)}
                  >
                    Contact Seller
                  </Button>
                  <Button variant="outline" className="px-3">
                    Details
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
