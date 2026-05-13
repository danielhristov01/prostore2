import { getOrderById } from "@/lib/actions/order.action";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import OrderDetailsTable from "./order-details-table";
import { ShippingAddress } from "@/types";

export const metadata: Metadata = {
  title: "Order details",
};

const OrderDetailsPage = async (props: {
  params: Promise<{
    id: string;
  }>;
}) => {
  const { id } = await props.params;

  const order = await getOrderById(id);
  if (!order) notFound();

  console.log("paypal id present?", !!process.env.PAYPAL_CLIENT_ID);
  console.log("paypal id value:", process.env.PAYPAL_CLIENT_ID?.slice(0, 8));
  return (
    <>
      <OrderDetailsTable
        order={{
          ...order,
          shippingAddress: order.shippingAddress as ShippingAddress,
        }}
        paypalClientId={process.env.PAYPAL_CLIENT_ID || "sb"}
      />
    </>
  );
};

export default OrderDetailsPage;
