import { useState, useEffect } from "react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Copy, ExternalLink, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

interface QRCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantSlug: string;
  restaurantName: string;
  isPublished?: boolean;
}

export const QRCodeModal = ({
  open,
  onOpenChange,
  restaurantSlug,
  restaurantName,
  isPublished = true,
}: QRCodeModalProps) => {
  const [size, setSize] = useState<number>(250);
  const [copied, setCopied] = useState(false);
  
  // Short link for everything: display, copy, open, QR
  const baseUrl = import.meta.env.VITE_PUBLIC_SITE_URL || window.location.origin;
  const [qrUrl, setQrUrl] = useState<string>("");

  // Ensure a short link exists: /m/{restaurant_hash}/{menu_id} - using backend for reliability
  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const ensureLink = async () => {
      try {
        // 1) Lookup restaurant by slug
        const { data: restaurant, error: rErr } = await supabase
          .from("restaurants")
          .select("id, slug, published")
          .eq("slug", restaurantSlug)
          .maybeSingle();

        if (rErr || !restaurant) {
          console.warn("[QRCodeModal] restaurant not found", rErr);
          toast.error("Restaurant not found");
          return;
        }

        if (!restaurant.published) {
          console.warn("[QRCodeModal] restaurant not published");
          toast.warning("Publish your restaurant first to make the QR code work");
        }

        // 2) Call backend function to ensure link exists AND is verified
        const { data: result, error: funcError } = await supabase.functions.invoke(
          'ensure-menu-link',
          {
            body: { restaurant_id: restaurant.id }
          }
        );

        if (funcError) {
          console.error("[QRCodeModal] ensure-menu-link failed:", funcError);
          toast.error("Failed to create menu link. Please try again.");
          return;
        }

        if (!result?.verified) {
          console.error("[QRCodeModal] Link not verified:", result);
          toast.error(result?.error || "Link created but not accessible. Ensure your menu is published.");
          return;
        }

        const url = result.url || `${baseUrl}/m/${result.restaurant_hash}/${result.menu_id}`;
        if (!cancelled) {
          setQrUrl(url);
          console.log("[QRCodeModal] Link verified and ready:", url);
        }
      } catch (e) {
        console.error("[QRCodeModal] ensureLink error:", e);
        toast.error("Failed to generate QR code link. Please try again.");
      }
    };

    ensureLink();
    return () => { cancelled = true; };
  }, [open, restaurantSlug, baseUrl]);
  const handleCopyLink = async () => {
    if (!qrUrl) {
      toast.error("Link is generating, please wait...");
      return;
    }
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleOpenLive = () => {
    if (!qrUrl) {
      toast.error("Link is generating, please wait...");
      return;
    }
    window.open(qrUrl, "_blank");
  };

  const handleDownloadPNG = () => {
    if (!isPublished) {
      toast.error("Publish your menu first to download QR code");
      return;
    }
    
    const canvas = document.getElementById("qr-canvas") as HTMLCanvasElement;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${restaurantSlug}-qr-code.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("QR Code downloaded as PNG");
    });
  };

  const handleDownloadSVG = () => {
    if (!isPublished) {
      toast.error("Publish your menu first to download QR code");
      return;
    }

    const svg = document.getElementById("qr-svg") as unknown as SVGElement;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${restaurantSlug}-qr-code.svg`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("QR Code downloaded as SVG");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code for {restaurantName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!isPublished && (
            <Alert variant="destructive">
              <AlertDescription>
                This menu isn't published yet. Publish it first to make the QR code work for customers.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Scan this QR code or share the link to view your menu:
            </div>
            <code className="text-xs bg-muted px-2 py-1 rounded block overflow-x-auto">
              {qrUrl || "Generating link..."}
            </code>
            <div className="flex gap-2">
              <Button
                onClick={handleCopyLink}
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                disabled={!qrUrl}
              >
                {copied ? (
                  <>
                    <CheckCheck className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Link
                  </>
                )}
              </Button>
              <Button
                onClick={handleOpenLive}
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                disabled={!qrUrl}
              >
                <ExternalLink className="h-4 w-4" />
                Open Live
              </Button>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-lg">
              <QRCodeCanvas
                id="qr-canvas"
                value={qrUrl}
                size={size}
                level="H"
                includeMargin
              />
            </div>
          </div>

          <div className="hidden">
            <QRCodeSVG
              id="qr-svg"
              value={qrUrl}
              size={size}
              level="H"
              includeMargin
            />
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Size</label>
              <div className="flex gap-2">
                <Button
                  variant={size === 150 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSize(150)}
                  className="flex-1"
                >
                  Small
                </Button>
                <Button
                  variant={size === 250 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSize(250)}
                  className="flex-1"
                >
                  Medium
                </Button>
                <Button
                  variant={size === 400 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSize(400)}
                  className="flex-1"
                >
                  Large
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleDownloadPNG} 
                variant="outline" 
                className="flex-1 gap-2"
                disabled={!isPublished}
              >
                <Download className="h-4 w-4" />
                Download PNG
              </Button>
              <Button 
                onClick={handleDownloadSVG} 
                variant="outline" 
                className="flex-1 gap-2"
                disabled={!isPublished}
              >
                <Download className="h-4 w-4" />
                Download SVG
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
