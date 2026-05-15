import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type {
  Cart as PrismaCart,
  OrderItem as PrismaOrderItem,
  Product as PrismaProduct,
  Prisma,
} from "@/lib/generated/prisma/client";
import type { CartItem } from "@/types";
import qs from "query-string";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function converToPlainObject<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function formatNumberWithDecimal(num: number): string {
  const [int, decimal] = num.toString().split(".");
  return decimal ? `${int}.${decimal.padEnd(2, "0")}` : `${int}.00`;
}

//Format errors
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatError(error: any) {
  if (error.name === "ZodError") {
    //Handle Zod error
    const fieldErrors = error.issues.map(
      (issue: { message: string }) => issue.message,
    );

    return fieldErrors.join(". ");
  } else if (
    error.name === "PrismaClientKnownRequestError" &&
    error.code === "P2002"
  ) {
    const field = error.meta?.target ? error.meta.target[0] : "Field";
    return `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  } else {
    return typeof error.message === "string"
      ? error.message
      : JSON.stringify(error.message);
  }
}

//Round number to 2 decimal places

export function round2(value: number | string) {
  if (typeof value === "number") {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  } else if (typeof value === "string") {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  } else {
    throw new Error("Value is not a number or string");
  }
}

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  currency: "USD",
  style: "currency",
  minimumFractionDigits: 2,
});

//Format currency using the formatter above

export function formatCurrency(amount: number | string | null) {
  if (typeof amount === "number") {
    return CURRENCY_FORMATTER.format(amount);
  } else if (typeof amount === "string") {
    return CURRENCY_FORMATTER.format(Number(amount));
  } else {
    return "NaN";
  }
}
// Format Number
const NUMBER_FORMATER = new Intl.NumberFormat("en-Us");
export function formatNumber(number: number) {
  return NUMBER_FORMATER.format(number);
}

//Shorten the Uuid

export function formatId(id: string) {
  return `..${id.substring(id.length - 6)}`;
}

// Format date and times

export const formatDateTime = (dateString: Date) => {
  const dateTimeOptions: Intl.DateTimeFormatOptions = {
    month: "short", // abbreviated month name (e.g., 'Oct')
    year: "numeric", // abbreviated month name (e.g., 'Oct')
    day: "numeric", // numeric day of the month (e.g., '25')
    hour: "numeric", // numeric hour (e.g., '8')
    minute: "numeric", // numeric minute (e.g., '30')
    hour12: true, // use 12-hour clock (true) or 24-hour clock (false)
  };
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: "short", // abbreviated weekday name (e.g., 'Mon')
    month: "short", // abbreviated month name (e.g., 'Oct')
    year: "numeric", // numeric year (e.g., '2023')
    day: "numeric", // numeric day of the month (e.g., '25')
  };
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "numeric", // numeric hour (e.g., '8')
    minute: "numeric", // numeric minute (e.g., '30')
    hour12: true, // use 12-hour clock (true) or 24-hour clock (false)
  };
  const formattedDateTime: string = new Date(dateString).toLocaleString(
    "en-US",
    dateTimeOptions,
  );
  const formattedDate: string = new Date(dateString).toLocaleString(
    "en-US",
    dateOptions,
  );
  const formattedTime: string = new Date(dateString).toLocaleString(
    "en-US",
    timeOptions,
  );
  return {
    dateTime: formattedDateTime,
    dateOnly: formattedDate,
    timeOnly: formattedTime,
  };
};

// ---------------------------------------------------------------------------
// Prisma row mappers
// ---------------------------------------------------------------------------
// Prisma returns `Decimal` columns as `runtime.Decimal` (Decimal.js) instances.
// Those classes don't survive the RSC serialization boundary cleanly and our
// Zod `currency` schema expects strings. Each mapper takes the raw Prisma row
// and returns a plain object with the Decimal fields coerced to string.
//
// Why per-model mappers instead of a generic recursive helper:
//   - Type-safe: TypeScript knows exactly which fields are strings now.
//   - Explicit: the conversion is visible at the call site in each action.
//   - Extensible: easy to add field-specific transforms later (formatting,
//     redaction, computed properties) without growing a magic helper.

export function mapProduct(product: PrismaProduct) {
  return {
    ...product,
    price: product.price.toString(),
    rating: product.rating.toString(),
  };
}

export function mapCart(cart: PrismaCart) {
  return {
    ...cart,
    // `items` is a `Json[]` column in the schema, so Prisma types it as
    // `JsonValue[]`. We know its actual shape because we wrote it with
    // `cartItemSchema`, so the cast is safe.
    items: cart.items as CartItem[],
    itemsPrice: cart.itemsPrice.toString(),
    shippingPrice: cart.shippingPrice.toString(),
    taxPrice: cart.taxPrice.toString(),
    totalPrice: cart.totalPrice.toString(),
  };
}

export function mapOrderItem(item: PrismaOrderItem) {
  return {
    ...item,
    price: item.price.toString(),
  };
}

// `OrderGetPayload` is Prisma's helper that derives the row shape from an
// `include` (or `select`) clause. Use it instead of hand-writing the type so
// the mapper stays in sync with the actual query in `getOrderById`.
type OrderWithDetails = Prisma.OrderGetPayload<{
  include: {
    orderitems: true;
    user: { select: { name: true; email: true } };
  };
}>;

export function mapOrder(order: OrderWithDetails) {
  return {
    ...order,
    itemsPrice: order.itemsPrice.toString(),
    shippingPrice: order.shippingPrice.toString(),
    taxPrice: order.taxPrice.toString(),
    totalPrice: order.totalPrice.toString(),
    orderitems: order.orderitems.map(mapOrderItem),
  };
}

export function formUrlQuery({
  params,
  key,
  value,
}: {
  params: string;
  key: string;
  value: string | null;
}) {
  const query = qs.parse(params);
  query[key] = value;
  return qs.stringifyUrl(
    {
      url: window.location.pathname,
      query,
    },
    {
      skipNull: true,
    },
  );
}
