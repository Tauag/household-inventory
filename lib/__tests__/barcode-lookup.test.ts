import assert from "node:assert/strict";
import { test } from "node:test";
import { parseProduct } from "../barcode-lookup.ts";

test("parseProduct", () => {
  assert.equal(parseProduct({ status: 0 }), null, "a miss (status 0) is not a hit");
  assert.equal(
    parseProduct({ status: 1, product: {} }),
    null,
    "status 1 with neither brand nor name is not a usable hit"
  );

  const hit = parseProduct({
    status: 1,
    product: {
      brands: " Aestura , Amorepacific ",
      product_name: " Atobarrier Cream ",
      image_front_url: "https://example.com/front.jpg",
      image_url: "https://example.com/full.jpg",
    },
  });
  assert.deepEqual(hit, {
    brand: "Aestura",
    name: "Atobarrier Cream",
    image: "https://example.com/front.jpg",
  });

  assert.deepEqual(
    parseProduct({ status: 1, product: { product_name: "Loose leaf tea" } }),
    { brand: null, name: "Loose leaf tea", image: null },
    "a brandless product is still a hit"
  );
});
