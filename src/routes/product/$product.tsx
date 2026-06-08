import { createFileRoute, notFound } from "@tanstack/react-router";
import ProductIntroPage from "@/features/product/ProductIntroPage";
import { getProductLandingConfig } from "@/features/product/productLandingData";

export const Route = createFileRoute("/product/$product")({
  component: ProductLandingRoute,
});

function ProductLandingRoute() {
  const { product } = Route.useParams();
  const config = getProductLandingConfig(product);

  if (!config) {
    throw notFound();
  }

  return <ProductIntroPage config={config} />;
}
