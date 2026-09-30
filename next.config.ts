import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Las fotos de recepción/inspección se suben como FormData a Server Actions;
      // el límite por defecto de 1mb es insuficiente para fotos de cámara de celular.
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
