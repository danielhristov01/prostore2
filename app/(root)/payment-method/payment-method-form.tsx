"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldSet } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { updateUserPaymentMethod } from "@/lib/actions/user-actions";
import { DEFAULT_PAYMENT_METHOD, PAYMENT_METHODS } from "@/lib/constants";
import { paymentMethodSchema } from "@/lib/validators";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const PaymentMethodForm = ({
  preferredPaymentMethod,
}: {
  preferredPaymentMethod: string | null;
}) => {
  const router = useRouter();

  const form = useForm<z.infer<typeof paymentMethodSchema>>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: { type: preferredPaymentMethod || DEFAULT_PAYMENT_METHOD },
  });

  const [isPending, startTransition] = useTransition();
  const onSubmit = async (values: z.infer<typeof paymentMethodSchema>) => {
    startTransition(async () => {
      const res = await updateUserPaymentMethod(values);
      if (!res.success) {
        toast.error(res.message);
        return;
      }

      router.push("/place-order");
    });

    return;
  };

  return (
    <>
      <div className="max-w-md mx-auto space-y-5">
        <h1 className="h2-bold mt-4">Payment Method</h1>
        <p className="text-sm text-muted-foreground">
          Please select a payment method
        </p>

        <form
          method="post"
          className="space-y-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="flex flex-col md:flex-row ">
            <FieldSet className="w-full max-w-xs ">
              <Controller
                control={form.control}
                name="type"
                render={({ field }) => (
                  <RadioGroup
                    onValueChange={field.onChange}
                    className="flex flex-col space-y-2"
                    value={field.value}
                  >
                    {PAYMENT_METHODS.map((paymentMethod) => (
                      <Field orientation="horizontal" key={paymentMethod}>
                        <RadioGroupItem
                          value={paymentMethod}
                          id={paymentMethod}
                        />
                        <FieldLabel
                          htmlFor={paymentMethod}
                          className="font-normal"
                        >
                          {paymentMethod}
                        </FieldLabel>
                      </Field>
                    ))}
                  </RadioGroup>
                )}
              ></Controller>
            </FieldSet>
          </div>

          <div className=" flex gap-2">
            <Button className="mt-7" type="submit" disabled={isPending}>
              {isPending ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              Continue
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

export default PaymentMethodForm;
