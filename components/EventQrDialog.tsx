"use client";

import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Check, Copy, Download, QrCode } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Rendered at high resolution so the downloaded PNG stays crisp when
// projected on a slide; CSS scales it down for on-screen display.
const QR_RENDER_SIZE = 1024;

export default function EventQrDialog({
  slug,
  eventName,
}: {
  slug: string;
  eventName: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Dialog content only mounts on the client (after the user opens it), so
  // reading window here can't cause a hydration mismatch.
  const claimUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${slug}`
      : `/${slug}`;

  function downloadPng() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${slug}-claim-qr.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(claimUrl);
      setCopied(true);
      toast.success("Claim link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy the link");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline">
            <QrCode data-icon="inline-start" />
            QR code
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Claim page QR code</DialogTitle>
          <DialogDescription>
            Attendees scan this to open the claim page for {eventName}. Project
            it on a slide or download it for print.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          <div className="rounded-xl bg-white p-4 ring-1 ring-foreground/10">
            <QRCodeCanvas
              ref={canvasRef}
              value={claimUrl}
              size={QR_RENDER_SIZE}
              marginSize={2}
              level="M"
              bgColor="#ffffff"
              fgColor="#000000"
              className="h-auto w-56 max-w-full"
            />
          </div>
          <span className="break-all text-center font-mono text-xs text-muted-foreground">
            {claimUrl}
          </span>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={copyLink}>
            {copied ? (
              <Check data-icon="inline-start" />
            ) : (
              <Copy data-icon="inline-start" />
            )}
            {copied ? "Copied" : "Copy link"}
          </Button>
          <Button variant="brand" onClick={downloadPng}>
            <Download data-icon="inline-start" />
            Download PNG
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
