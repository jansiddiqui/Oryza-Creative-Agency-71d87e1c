import Script from "next/script";

/**
 * GA4 and Microsoft Clarity, each loaded only when its ID is set:
 * NEXT_PUBLIC_GA_ID (e.g. G-XXXXXXXXXX) and NEXT_PUBLIC_CLARITY_ID (the Clarity project ID).
 * Loaded once the browser is idle after load (lazyOnload), so they never compete with the page for bandwidth
 * or main-thread time. gtag queues calls in dataLayer, so load order does not matter.
 */
const GA_ID = process.env.NEXT_PUBLIC_GA_ID?.trim() ?? "";
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID?.trim() ?? "";
// IDs are interpolated into inline scripts, so only allow their documented character sets.
const safeGa = /^G-[A-Z0-9]+$/.test(GA_ID) ? GA_ID : "";
const safeClarity = /^[a-z0-9]+$/i.test(CLARITY_ID) ? CLARITY_ID : "";

export function Analytics() {
  return (
    <>
      {safeGa && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${safeGa}`} strategy="lazyOnload" />
          <Script id="ga4" strategy="lazyOnload">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${safeGa}');`}
          </Script>
        </>
      )}
      {safeClarity && (
        <Script id="clarity" strategy="lazyOnload">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${safeClarity}");`}
        </Script>
      )}
    </>
  );
}
