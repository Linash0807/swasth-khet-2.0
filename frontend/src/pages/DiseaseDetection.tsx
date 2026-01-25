import { useState, useRef } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Camera, Loader2, AlertTriangle, CheckCircle2, Info, ArrowRight } from "lucide-react";
import { diseaseAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function DiseaseDetection() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      toast({
        title: "No image selected",
        description: "Please upload or take a photo of the crop leaf",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAnalyzing(true);
      const response = await diseaseAPI.analyzeImage(selectedImage);
      // Combine report and imageUrl into the result state
      setResult({
        ...response.data.report,
        imageUrl: response.data.imageUrl
      });
      toast({
        title: "Analysis complete",
        description: "AI has successfully analyzed the crop health",
      });
    } catch (error: any) {
      toast({
        title: "Analysis failed",
        description: error.message || "Failed to analyze image. Please try again.",
        variant: "destructive",
      });
      setResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setResult(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="space-y-4 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">
              AI Disease Detection
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Scan your crops with our advanced AI to detect diseases instantly and get expert treatment recommendations.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Upload Section */}
            <div className="space-y-6">
              <Card className="border-2 border-dashed border-muted-foreground/20 bg-muted/5 overflow-hidden">
                <CardContent className="p-0">
                  {previewUrl ? (
                    <div className="relative aspect-square md:aspect-video bg-black flex items-center justify-center group">
                      <img
                        src={previewUrl}
                        alt="Crop preview"
                        className="max-h-full object-contain"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                          Change Image
                        </Button>
                        <Button variant="destructive" onClick={reset}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="aspect-square md:aspect-video flex flex-col items-center justify-center cursor-pointer hover:bg-muted/10 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Upload className="h-8 w-8 text-primary" />
                      </div>
                      <p className="text-lg font-semibold">Click to upload or drag and drop</p>
                      <p className="text-sm text-muted-foreground mt-2">PNG, JPG or WebP (max. 10MB)</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                className="hidden"
                accept="image/*"
              />

              <div className="flex gap-4">
                <Button
                  className="flex-1 h-14 text-lg"
                  size="lg"
                  onClick={handleAnalyze}
                  disabled={!selectedImage || isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Analyzing Health...
                    </>
                  ) : (
                    <>
                      <Camera className="mr-2 h-5 w-5" />
                      Analyze Crop Health
                    </>
                  )}
                </Button>
              </div>

              <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Info className="h-4 w-4 text-primary" />
                    How to get best results?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-2 text-muted-foreground list-disc pl-4">
                    <li>Ensure the leaf is clearly visible and in focus</li>
                    <li>Avoid shadows and use good natural lighting</li>
                    <li>Capture the affected area closely</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Results Section */}
            <div className="space-y-6">
              {result ? (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <Card className="border-t-4 border-t-primary shadow-lg">
                    <CardHeader>
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-2xl">{result.disease}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${result.severity === 'high' ? 'bg-destructive/10 text-destructive' :
                              result.severity === 'medium' ? 'bg-orange-500/10 text-orange-500' :
                                'bg-green-500/10 text-green-500'
                              }`}>
                              {result.severity.toUpperCase()} SEVERITY
                            </span>
                            <span className="text-sm">
                              {result.confidence}% Confidence
                            </span>
                          </CardDescription>
                        </div>
                        {result.imageUrl && (
                          <div className="w-24 h-24 rounded-lg overflow-hidden border border-border shadow-sm shrink-0">
                            <img
                              src={result.imageUrl.startsWith('http') ? result.imageUrl : `${window.location.origin}${result.imageUrl}`}
                              alt="Analyzed crop"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                          Key Symptoms
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {result.symptoms.map((symptom: string, i: number) => (
                            <span key={i} className="bg-muted px-3 py-1 rounded-full text-sm">
                              {symptom}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-4">
                        <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/10">
                          <h4 className="font-semibold text-green-600 mb-2 flex items-center gap-2">
                            <Info className="h-4 w-4" />
                            Immediate Actions
                          </h4>
                          <ul className="text-sm space-y-1">
                            {result.treatment.immediate.map((action: string, i: number) => (
                              <li key={i} className="flex items-start gap-2">
                                <ArrowRight className="h-3 w-3 mt-1 text-green-500 shrink-0" />
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                          <h4 className="font-semibold text-primary mb-2">Treatment Recommendations</h4>
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Organic</p>
                              <p className="text-sm">{result.treatment.organic.join(", ")}</p>
                            </div>
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Chemical</p>
                              <p className="text-sm">{result.treatment.chemical.join(", ")}</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 rounded-lg bg-muted/50 border border-muted-foreground/10">
                          <h4 className="font-semibold mb-2">Preventive Measures</h4>
                          <ul className="text-sm space-y-1">
                            {result.treatment.preventive.map((measure: string, i: number) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 mt-1.5 shrink-0" />
                                <span>{measure}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {result.notes && (
                        <p className="text-sm text-muted-foreground italic bg-muted/30 p-3 rounded">
                          <strong>Note:</strong> {result.notes}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-muted/5 border-2 border-dashed rounded-lg">
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                    <Camera className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No Analysis Yet</h3>
                  <p className="text-muted-foreground">
                    Upload a photo of your crop to see the AI diagnosis and treatment plan here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
