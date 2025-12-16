import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Copy, ExternalLink, CheckCheck, QrCode } from "lucide-react";
import { toast } from "sonner";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantSlug: string;
  restaurantName: string;
  isPublished: boolean;
}

export const ShareDialog = ({
  open,
  onOpenChange,
  restaurantSlug,
  restaurantName,
  isPublished,
}: ShareDialogProps) => {
  const [size, setSize] = useState<number>(250);
  const [copied, setCopied] = useState(false);
  
  // Short link for everything: display, copy, open, QR
  const baseUrl = import.meta.env.VITE_PUBLIC_SITE_URL || window.location.origin;
  const [shortUrl, setShortUrl] = useState<string>("");

  // Generate short link when dialog opens - bulletproof client-side approach
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
          console.log('[ShareDialog] Link verified successfully');
          return true;
        }
        
        console.warn('[ShareDialog] Link verification failed:', error);
        return false;
      } catch (err) {
        console.warn('[ShareDialog] Verify error:', err);
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
          console.error("[ShareDialog] restaurant not found:", rErr);
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
          console.log("[ShareDialog] Using existing link:", url);
          if (!cancelled) setShortUrl(url);
          return;
        }

        // 3) Generate deterministic IDs
        const { restaurant_hash, menu_id } = await generateLinkIds(restaurant.id);
        console.log("[ShareDialog] Generated IDs:", { restaurant_hash, menu_id });

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
          console.error("[ShareDialog] Failed to create link:", upsertError);
          
          // Check if it's a table not found error
          if (upsertError.message?.includes('relation') && upsertError.message?.includes('does not exist')) {
            toast.error("Database not set up. Please run: supabase db push");
            return;
          }
          
          // Check if it's a duplicate that was handled
          if (upsertError.code === '23505') {
            console.log("[ShareDialog] Link already exists (duplicate), continuing...");
            // Continue anyway - link exists
          } else {
            toast.error("Failed to create menu link. Please try again.");
            return;
          }
        }

        // 5) Verify link was created successfully
        const isVerified = await verifyLinkExists(restaurant_hash, menu_id);

        if (!isVerified) {
          console.error("[ShareDialog] Link created but verification failed");
          // Still show the link - it was created, just verification had issues
          console.warn("[ShareDialog] Showing link anyway, it should work");
        }

        // 6) Success! Show the link
        const url = `${baseUrl}/m/${restaurant_hash}/${menu_id}`;
        console.log("[ShareDialog] Link ready:", url);
        
        if (!cancelled) {
          setShortUrl(url);
          if (!restaurant.published) {
            toast.warning("Link created! Publish your restaurant to make it accessible.");
          } else {
            console.log("[ShareDialog] Link is live and accessible");
          }
        }
      } catch (e) {
        console.error("[ShareDialog] Unexpected error:", e);
        toast.error("Failed to generate link. Please try again.");
      }
    };

    ensureLink();
    return () => { cancelled = true; };
  }, [open, restaurantSlug, baseUrl]);

  const handleCopyLink = async () => {
    if (!shortUrl) {
      toast.error("Link is generating, please wait...");
      return;
    }
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleOpenLive = () => {
    if (!shortUrl) {
      toast.error("Link is generating, please wait...");
      return;
    }
    window.open(shortUrl, "_blank");
  };

  const handleDownloadPNG = () => {
    if (!isPublished) {
      toast.error("Publish your menu first to download QR code");
      return;
    }
    
    const canvas = document.getElementById("share-qr-canvas") as HTMLCanvasElement;
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

    const svg = document.getElementById("share-qr-svg") as unknown as SVGElement;
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
          <DialogTitle>Share {restaurantName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!isPublished && (
            <Alert variant="destructive">
              <AlertDescription>
                This menu isn't published yet. Publish it to make the QR code and link work for customers.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <label className="text-sm font-medium block">Live Menu Link</label>
            <div className="flex gap-2">
              <code className="flex-1 text-xs bg-muted px-3 py-2 rounded border border-border overflow-x-auto">
                {shortUrl || "Generating link..."}
              </code>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="flex-1 gap-2"
                disabled={!shortUrl || !isPublished}
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
                className="flex-1 gap-2"
                disabled={!shortUrl}
              >
                <ExternalLink className="h-4 w-4" />
                Open Live
              </Button>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <label className="text-sm font-medium mb-3 flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              QR Code
            </label>
            
            <div className="flex justify-center mb-4">
              <div className="bg-white p-4 rounded-lg">
                {shortUrl ? (
                  <QRCodeCanvas
                    id="share-qr-canvas"
                    value={shortUrl}
                    size={size}
                    level="H"
                    includeMargin
                  />
                ) : (
                  <div className="flex items-center justify-center" style={{ width: size, height: size }}>
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                )}
              </div>
            </div>

            {/* Hidden SVG for download */}
            <div className="hidden">
              {shortUrl && (
                <QRCodeSVG
                  id="share-qr-svg"
                  value={shortUrl}
                  size={size}
                  level="H"
                  includeMargin
                />
              )}
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
                    onClick={() => setSize(300)}
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
                  disabled={!isPublished || !shortUrl}
                >
                  <Download className="h-4 w-4" />
                  Download PNG
                </Button>
                <Button 
                  onClick={handleDownloadSVG} 
                  variant="outline" 
                  className="flex-1 gap-2"
                  disabled={!isPublished || !shortUrl}
                >
                  <Download className="h-4 w-4" />
                  Download SVG
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};