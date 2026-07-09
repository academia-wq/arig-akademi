/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "image.mux.com" },
    ],
  },
  experimental: {
    // PDF байршуулах server action-д зориулж default 1MB хязгаарыг нэмэгдүүлэв.
    serverActions: { bodySizeLimit: "15mb" },
  },
};

export default nextConfig;
