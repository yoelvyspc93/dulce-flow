import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

const baseUrl = "/dulce-flow";

const serviceWorkerRegistration = `
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("${baseUrl}/sw.js", { scope: "${baseUrl}/" }).catch(function (error) {
      console.error("Service worker registration failed:", error);
    });
  });
}
`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#07111F" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="DulceFlow" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href={`${baseUrl}/manifest.json`} />
        <link rel="icon" href={`${baseUrl}/favicon.png`} />
        <link rel="apple-touch-icon" href={`${baseUrl}/apple-touch-icon.png`} />
        <script dangerouslySetInnerHTML={{ __html: serviceWorkerRegistration }} />
        <title>DulceFlow</title>
        <meta name="description" content="Gestiona pedidos, productos, insumos y gastos de tu negocio de dulces." />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
