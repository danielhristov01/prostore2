import { auth } from "@/auth";
import { getMyCart } from "@/lib/actions/cart.action";
import { getUserById } from "@/lib/actions/user-actions";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import ShippingAddressForm from "./shipping-address-form";
import CheckoutSteps from "@/components/shared/product/checkout-steps";

export const metadata: Metadata = {
  title: "Shipping Address",
};

const ShippingAddressPage = async () => {
  const cart = await getMyCart();

  if (!cart || cart.items.length === 0) redirect("/cart");

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("No user ID");
  const user = await getUserById(userId);
  if (!user) throw new Error("No user found");

  return (
    <>
      <CheckoutSteps current={2} />
      <ShippingAddressForm />
    </>
  );
};

export default ShippingAddressPage;
