import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { bsc } from "wagmi/chains";

export const wagmiConfig = getDefaultConfig({
  appName: "CultureCast",
  // Public WalletConnect Cloud demo project ID. Replace with your own for production.
  projectId: "3a8170812b534d0ff9d794f19a901d23",
  chains: [bsc],
  ssr: true,
});
