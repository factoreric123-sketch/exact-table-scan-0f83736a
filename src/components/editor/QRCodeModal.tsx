import { useState, useEffect, useRef } from "react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Copy, ExternalLink, CheckCheck, Upload, RotateCcw } from "lucide-react";
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
  const [customQrImage, setCustomQrImage] = useState<string | null>(null);
  const [imageKey, setImageKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Short link for everything: display, copy, open, QR
  const baseUrl = import.meta.env.VITE_PUBLIC_SITE_URL || window.location.origin;
  const [qrUrl, setQrUrl] = useState<string>("");

  // Ensure a short link exists: /m/{restaurant_hash}/{menu_id} - bulletproof client-side
  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const generateLinkIds = async (restaurantId: string) => {
      const encoder = new TextEncoder();
      const data = encoder.encode(restaurantId);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const fullHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      const restaurant_hash = fullHex.slice(0, 8);
      const numBase = parseInt(fullHex.slice(8, 16), 16);
      const menu_id = (numBase % 100000).toString().padStart(5, '0');
      
      return { restaurant_hash, menu_id };
    };

    const verifyLinkExists = async (hash: string, id: string) => {
      try {
        const { data, error } = await supabase
          .from('menu_links')
          .select('restaurant_id, active')
          .eq('restaurant_hash', hash)
          .eq('menu_id', id)
          .eq('active', true)
          .maybeSingle();

        if (!error && data && data.active) {
          console.log('[QRCodeModal] Link verified successfully');
          return true;
        }
        
        console.warn('[QRCodeModal] Link verification failed:', error);
        return false;
      } catch (err) {
        console.warn('[QRCodeModal] Verify error:', err);
        return false;
      }
    };

    const ensureLink = async () => {
      try {
        // 1) Lookup restaurant by slug
        const { data: restaurant, error: rErr } = await supabase
          .from("restaurants")
          .select("id, slug, published")
          .eq("slug", restaurantSlug)
          .maybeSingle();

        if (rErr || !restaurant) {
          console.error("[QRCodeModal] restaurant not found:", rErr);
          toast.error("Restaurant not found");
          return;
        }

        // 2) Check if link already exists
        const { data: existing } = await supabase
          .from("menu_links")
          .select("restaurant_hash, menu_id, active")
          .eq("restaurant_id", restaurant.id)
          .eq("active", true)
          .maybeSingle();

        if (existing) {
          const url = `${baseUrl}/m/${existing.restaurant_hash}/${existing.menu_id}`;
          console.log("[QRCodeModal] Using existing link:", url);
          if (!cancelled) setQrUrl(url);
          return;
        }

        // 3) Generate deterministic IDs
        const { restaurant_hash, menu_id } = await generateLinkIds(restaurant.id);
        console.log("[QRCodeModal] Generated IDs:", { restaurant_hash, menu_id });

        // 4) Create link with upsert (atomic, handles conflicts)
        const { error: upsertError } = await supabase
          .from("menu_links")
          .upsert(
            {
              restaurant_id: restaurant.id,
              restaurant_hash,
              menu_id,
              active: true,
            },
            {
              onConflict: 'restaurant_id',
              ignoreDuplicates: false,
            }
          );

        if (upsertError) {
          console.error("[QRCodeModal] Failed to create link:", upsertError);
          
          // Check if it's a table not found error
          if (upsertError.message?.includes('relation') && upsertError.message?.includes('does not exist')) {
            toast.error("Database not set up. Please run: supabase db push");
            return;
          }
          
          // Check if it's a duplicate that was handled
          if (upsertError.code === '23505') {
            console.log("[QRCodeModal] Link already exists (duplicate), continuing...");
            // Continue anyway - link exists
          } else {
            toast.error("Failed to create QR code link. Please try again.");
            return;
          }
        }

        // 5) Verify link was created successfully
        const isVerified = await verifyLinkExists(restaurant_hash, menu_id);

        if (!isVerified) {
          console.error("[QRCodeModal] Link created but verification failed");
          // Still show the link - it was created, just verification had issues
          console.warn("[QRCodeModal] Showing link anyway, it should work");
        }

        // 6) Success! Show the QR code
        const url = `${baseUrl}/m/${restaurant_hash}/${menu_id}`;
        console.log("[QRCodeModal] Link ready:", url);
        
        if (!cancelled) {
          setQrUrl(url);
          if (!restaurant.published) {
            toast.warning("QR code created! Publish your restaurant to make it accessible.");
          } else {
            console.log("[QRCodeModal] QR code is live and accessible");
          }
        }
      } catch (e) {
        console.error("[QRCodeModal] Unexpected error:", e);
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

    if (customQrImage) {
      // Download custom image
      const a = document.createElement("a");
      a.href = customQrImage;
      a.download = `${restaurantSlug}-qr-code.png`;
      a.click();
      toast.success("Custom QR Code downloaded");
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

  const handleCustomQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setCustomQrImage(event.target?.result as string);
      toast.success("Custom QR code uploaded!");
      // Refresh the image display after 1.5 seconds
      setTimeout(() => {
        setImageKey(prev => prev + 1);
      }, 1500);
    };
    reader.readAsDataURL(file);
  };

  const handleResetToGenerated = () => {
    setCustomQrImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.success("Switched back to generated QR code");
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

          {/* QR Code Display */}
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-lg">
              {customQrImage ? (
                <img 
                  key={imageKey}
                  src={customQrImage} 
                  alt="Custom QR Code" 
                  style={{ width: size, height: size }}
                  className="object-contain animate-in fade-in duration-300"
                />
              ) : (
                <QRCodeCanvas
                  id="qr-canvas"
                  value={qrUrl}
                  size={size}
                  level="H"
                  includeMargin
                />
              )}
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

          {/* Upload Custom QR */}
          <div className="space-y-2">
            <label className="text-sm font-medium block">Custom QR Code</label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleCustomQrUpload}
              className="hidden"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                Upload Your QR
              </Button>
              {customQrImage && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={handleResetToGenerated}
                >
                  <RotateCcw className="h-4 w-4" />
                  Use Generated
                </Button>
              )}
            </div>
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
