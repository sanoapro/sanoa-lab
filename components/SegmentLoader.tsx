// /workspaces/sanoa-lab/components/SegmentLoader.tsx
"use client";

import { useEffect } from "react";

export default function SegmentLoader() {
  const writeKey = process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY;
  useEffect(() => {
    if (!writeKey) return;

    // Evita doble carga
    if ((window as any).analytics) return;

    // Snippet Analytics.js (Segment)
    const initSegment = () => {
      const analytics: any = ((window as any).analytics = (window as any).analytics || []);
      if (!analytics.initialize)
        if (analytics.invoked) {
          if (window.console && console.error) {
            console.error("Segment snippet included twice.");
          }
        } else {
          analytics.invoked = true;
          analytics.methods = [
            "trackSubmit",
            "trackClick",
            "trackLink",
            "trackForm",
            "pageview",
            "identify",
            "reset",
            "group",
            "track",
            "ready",
            "alias",
            "debug",
            "page",
            "once",
            "off",
            "on",
            "addSourceMiddleware",
            "addIntegrationMiddleware",
            "setAnonymousId",
            "addDestinationMiddleware",
          ];
          analytics.factory = function (e: string) {
            return function () {
              const t = Array.prototype.slice.call(arguments);
              t.unshift(e);
              analytics.push(t);
              return analytics;
            };
          };
          for (let e = 0; e < analytics.methods.length; e++) {
            const key = analytics.methods[e];
            analytics[key] = analytics.factory(key);
          }
          analytics.load = function (key: string) {
            const script = document.createElement("script");
            script.type = "text/javascript";
            script.async = true;
            script.src = "https://cdn.segment.com/analytics.js/v1/" + key + "/analytics.min.js";
            const first = document.getElementsByTagName("script")[0];
            first?.parentNode?.insertBefore(script, first);
          };
          analytics.SNIPPET_VERSION = "4.15.3";
          analytics.load(writeKey!);
          analytics.page();
        }
    };

    initSegment();
  }, [writeKey]);

  return null;
}
