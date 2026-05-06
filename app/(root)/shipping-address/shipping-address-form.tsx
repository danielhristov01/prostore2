"use client";

import { shippingAddressSchema } from "@/lib/validators";
import { ShippingAddress } from "@/types";
import { useRouter } from "next/navigation";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { shippingAddressDefaultValues } from "@/lib/constants";
import { useTransition } from "react";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader } from "lucide-react";
import { updateUserAddress } from "@/lib/actions/user-actions";
import { toast } from "sonner";

const ShippingAddressForm = ({ address }: { address?: ShippingAddress }) => {
  const router = useRouter();

  const form = useForm<z.infer<typeof shippingAddressSchema>>({
    resolver: zodResolver(shippingAddressSchema),
    defaultValues: address || shippingAddressDefaultValues,
  });

  const [isPending, startTransition] = useTransition();

  const onSubmit: SubmitHandler<z.infer<typeof shippingAddressSchema>> = async (
    values,
  ) => {
    startTransition(async () => {
      const res = await updateUserAddress(values);

      if (!res.success) {
        toast.error(res.message);
        return;
      }
      router.push("/payment-method");
    });
  };
  return (
    <>
      <div className="max-w-md mx-auto space-y-4">
        <h1 className="h2-bold mt-4">Shipping Address</h1>
        <p className="text-sm text-muted-foreground">
          Please enter address to ship to
        </p>

        <form
          method="post"
          className="space-y-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldSet className="w-full max-w-sm ">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="fullName">Full Name</FieldLabel>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  {...form.register("fullName")}
                />
                <FieldError
                  errors={
                    form.formState.errors.fullName
                      ? [form.formState.errors.fullName]
                      : undefined
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="streetAddress">Street Address</FieldLabel>
                <Input
                  id="streetAddress"
                  type="text"
                  placeholder="123 Main St"
                  {...form.register("streetAddress")}
                />
                <FieldError
                  errors={
                    form.formState.errors.streetAddress
                      ? [form.formState.errors.streetAddress]
                      : undefined
                  }
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="city">City</FieldLabel>
                  <Input
                    id="city"
                    type="text"
                    placeholder="New York"
                    {...form.register("city")}
                  />
                  <FieldError
                    errors={
                      form.formState.errors.city
                        ? [form.formState.errors.city]
                        : undefined
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="postalCode">Postal Code</FieldLabel>
                  <Input
                    id="postalCode"
                    type="text"
                    placeholder="90502"
                    {...form.register("postalCode")}
                  />
                  <FieldError
                    errors={
                      form.formState.errors.postalCode
                        ? [form.formState.errors.postalCode]
                        : undefined
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="country">Country</FieldLabel>
                  <Input
                    id="country"
                    type="text"
                    placeholder="USA"
                    {...form.register("country")}
                  />
                  <FieldError
                    errors={
                      form.formState.errors.country
                        ? [form.formState.errors.country]
                        : undefined
                    }
                  />
                </Field>
                <Button className="mt-7" type="submit" disabled={isPending}>
                  {isPending ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  Continue
                </Button>
              </div>
            </FieldGroup>
          </FieldSet>
        </form>
      </div>
    </>
  );
};
export default ShippingAddressForm;
