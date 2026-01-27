import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import logoDark from "@/assets/logo-dark.png";

const BusinessCard = () => {
  const demoUrl = `${window.location.origin}/demo`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4">
      {/* Controls - hidden when printing */}
      <div className="max-w-4xl mx-auto mb-8 flex justify-center gap-4 print:hidden">
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          Print Card
        </Button>
      </div>

      {/* Business Card - Front */}
      <div className="max-w-4xl mx-auto mb-8">
        <p className="text-sm text-muted-foreground mb-2 text-center print:hidden">Front</p>
        <div 
          className="mx-auto bg-white rounded-xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none"
          style={{ width: '3.5in', height: '2in' }}
        >
          <div className="h-full flex">
            {/* Left side - Black with logo */}
            <div className="w-2/5 bg-foreground flex flex-col items-center justify-center p-4">
              <img 
                src={logoDark} 
                alt="Menu Logo" 
                className="h-12 w-auto mb-2"
              />
              <p className="text-background/80 text-[8px] text-center leading-tight">
                Digital Menus for<br />Modern Restaurants
              </p>
            </div>
            
            {/* Right side - White with content */}
            <div className="w-3/5 flex flex-col items-center justify-center p-4 text-center">
              <h2 className="text-foreground font-bold text-sm mb-1">
                Photos + Details
              </h2>
              <p className="text-foreground/60 text-[9px] mb-3">
                = Happy Customers
              </p>
              
              <div className="bg-white p-1.5 rounded-md shadow-sm border">
                <QRCodeSVG
                  value={demoUrl}
                  size={56}
                  level="H"
                  includeMargin={false}
                />
              </div>
              
              <p className="text-foreground/50 text-[7px] mt-2">
                Scan to see a live demo
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Business Card - Back */}
      <div className="max-w-4xl mx-auto">
        <p className="text-sm text-muted-foreground mb-2 text-center print:hidden">Back</p>
        <div 
          className="mx-auto bg-foreground rounded-xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none"
          style={{ width: '3.5in', height: '2in' }}
        >
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <p className="text-background/60 text-[10px] mb-3 tracking-wide uppercase">
              It's 2026
            </p>
            
            <h2 className="text-background font-bold text-lg leading-tight mb-2">
              Your menu shouldn't<br />
              <span className="inline-block bg-background text-foreground px-2 py-0.5 mt-1">
                be a PDF.
              </span>
            </h2>
            
            <p className="text-background/70 text-[9px] mt-3 max-w-[2.5in]">
              Make sure your customers know what they're ordering. No more guessing games.
            </p>
            
            <div className="mt-auto pt-3">
              <p className="text-background/40 text-[8px]">
                exact-clone-guardian.lovable.app
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          @page {
            size: 3.5in 2in;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default BusinessCard;
