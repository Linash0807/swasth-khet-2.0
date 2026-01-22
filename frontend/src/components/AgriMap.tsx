import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

export const AgriMap = () => {
    return (
        <Card className="w-full h-[500px] shadow-lg border-primary/10 overflow-hidden">
            <CardHeader className="py-4 bg-primary/5 border-b border-primary/10">
                <CardTitle className="flex items-center gap-2 text-primary text-lg font-bold">
                    <MapPin className="h-5 w-5" />
                    Farmer Health Centers Near You
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0">
                <iframe
                    src="https://www.google.com/maps?q=farmer+health+centres+near+me&output=embed"
                    width="100%"
                    height="100%"
                    className="border-0"
                    allowFullScreen
                    loading="lazy"
                    title="Farming Locations Map"
                />
            </CardContent>
        </Card>
    );
};
