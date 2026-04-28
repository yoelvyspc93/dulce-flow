import { useEffect, useState } from "react";

import { listProductsAsync } from "@/features/products/services/product.service";
import { Screen, SelectField, TextField } from "@/shared/ui";
import type { Product } from "@/shared/types";

export function NewOrderScreen() {
  const [activeProducts, setActiveProducts] = useState<Product[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadProductsAsync() {
      const products = await listProductsAsync();

      if (isMounted) {
        setActiveProducts(products.filter((product) => product.isActive));
      }
    }

    void loadProductsAsync();

    return () => {
      isMounted = false;
    };
  }, []);

  const productLabel =
    activeProducts.length > 0
      ? `${activeProducts[0].name}${activeProducts.length > 1 ? ` +${activeProducts.length - 1}` : ""}`
      : "No tienes productos activos";

  return (
    <Screen title="Nueva orden" subtitle="Base de formulario para la fase de ordenes.">
      <TextField label="Cliente" placeholder="Nombre del cliente" />
      <TextField label="Telefono" placeholder="Telefono" />
      <SelectField label="Productos" value={productLabel} />
      <TextField label="Nota" placeholder="Detalles de entrega o decoracion" multiline />
    </Screen>
  );
}
