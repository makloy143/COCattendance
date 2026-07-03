import {
  buildMonitoringReportDocument,
  type MonitoringReportHtmlInput,
} from "@/lib/monitoring-report-html";

type CaptureOptions = {
  filename: string;
  scale?: number;
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function waitForIframeRender(iframe: HTMLIFrameElement) {
  return new Promise<void>((resolve) => {
    iframe.onload = () => resolve();
    window.setTimeout(resolve, 150);
  });
}

export async function downloadMonitoringReportAsPng(
  report: MonitoringReportHtmlInput,
  { filename, scale = 2 }: CaptureOptions
) {
  const html2canvas = (await import("html2canvas")).default;
  const html = buildMonitoringReportDocument(report);

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.left = "-100000px";
  iframe.style.top = "0";
  iframe.style.border = "0";
  iframe.style.width = "1200px";
  iframe.style.height = "1200px";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument;
  if (!iframeDoc) {
    iframe.remove();
    throw new Error("Unable to prepare image capture");
  }

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  await waitForIframeRender(iframe);

  try {
    const target = iframeDoc.getElementById("monitoring-report-export");
    if (!target) {
      throw new Error("Unable to find report capture area");
    }

    iframe.style.width = `${target.scrollWidth}px`;
    iframe.style.height = `${target.scrollHeight}px`;

    const canvas = await html2canvas(target, {
      backgroundColor: "#ffffff",
      scale,
      logging: false,
      scrollX: 0,
      scrollY: 0,
      width: target.scrollWidth,
      height: target.scrollHeight,
      windowWidth: target.scrollWidth,
      windowHeight: target.scrollHeight,
    });

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/png");
    });

    if (!blob) {
      throw new Error("Failed to create image");
    }

    downloadBlob(blob, filename);
  } finally {
    iframe.remove();
  }
}
