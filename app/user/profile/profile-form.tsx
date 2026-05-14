"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { updateProfile } from "@/lib/actions/user-actions";
import { updateProfileSchema } from "@/lib/validators";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const ProfileForm = () => {
  const { data: session, update } = useSession();
  const form = useForm<z.infer<typeof updateProfileSchema>>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: session?.user?.name ?? "",
      email: session?.user?.email ?? "",
    },
  });

  const onSubmit = async (values: z.infer<typeof updateProfileSchema>) => {
    console.log(values);

    const res = await updateProfile(values);

    if (!res.success) {
      toast.error(res.message);
    } else {
      toast.message(res.message);
    }
    const newSession = {
      ...session,
      user: {
        ...session?.user,
        name: values.name,
      },
    };

    await update(newSession);
  };
  return (
    <>
      <form
        className="flex flex-col gap-5"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="flex flex-col gap-5">
          <FieldSet>
            <Controller
              control={form.control}
              name="email"
              render={({ field }) => (
                <FieldGroup className="w-full">
                  <Field>
                    <Input
                      disabled
                      placeholder="Email"
                      className="input-field "
                      {...field}
                    />
                  </Field>
                </FieldGroup>
              )}
            ></Controller>
          </FieldSet>
          <FieldSet>
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <FieldGroup className="w-full">
                  <Field>
                    <Input
                      placeholder="Name"
                      className="input-field "
                      {...field}
                    />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </Field>
                </FieldGroup>
              )}
            ></Controller>
          </FieldSet>
        </div>
        <Button
          type="submit"
          size="lg"
          className="button col-span-2 w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Submitting..." : "Update Profile"}
        </Button>
      </form>
    </>
  );
};

export default ProfileForm;
