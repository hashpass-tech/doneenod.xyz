import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";

import { Footer, Header } from "@/components/Chrome.tsx";
import { wagmiConfig } from "@/lib/chain.ts";
import { ScrollTrigger, initSmoothScroll } from "@/lib/motion.ts";
import { useLinkInterceptor, useRoute } from "@/lib/router.ts";
import { Gallery } from "@/pages/Gallery.tsx";
import { Landing } from "@/pages/Landing.tsx";
import { Mint } from "@/pages/Mint.tsx";
import { Token } from "@/pages/Token.tsx";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 10_000 } },
});

const TITLES: Record<string, string> = {
  home: "PINGUS² — nace en hielo",
  mint: "PINGUS² — nacer",
  gallery: "PINGUS² — la colección",
  token: "PINGUS²",
};

export function App() {
  const [route, navigate] = useRoute();
  useLinkInterceptor(navigate);

  useEffect(() => initSmoothScroll(), []);

  useEffect(() => {
    document.title =
      route.name === "token" ? `PINGU #${route.id} — PINGUS²` : TITLES[route.name] ?? TITLES.home!;
    // Pins and scrubs measured against the previous page are meaningless now.
    ScrollTrigger.refresh();
  }, [route]);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <Header route={route} />
        {route.name === "home" ? (
          <Landing />
        ) : route.name === "mint" ? (
          <Mint />
        ) : route.name === "gallery" ? (
          <Gallery />
        ) : (
          <Token id={route.id} />
        )}
        <Footer />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
