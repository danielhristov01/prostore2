"use client";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateUser } from "@/lib/actions/user-actions";
import { USER_ROLES } from "@/lib/constants";
import { updateUserSchema } from "@/lib/validators";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const UpdateUserForm = ({
  user,
}: {
  user: z.infer<typeof updateUserSchema>;
}) => {
  const router = useRouter();

  const form = useForm<z.infer<typeof updateUserSchema>>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: user,
  });

  const onSubmit = async (values: z.infer<typeof updateUserSchema>) => {
    try {
      const res = await updateUser({
        ...values,
        id: user.id,
      });

      if (!res.success) {
        return toast.error(res.message);
      } else {
        toast.message(res.message);
      }
      form.reset();
      router.push("/admin/users");
    } catch (error) {
      return toast.error((error as Error).message);
    }
  };

  return (
    <>
      <FieldGroup>
        <FieldSet>
          <form method="POST" onSubmit={form.handleSubmit(onSubmit)}>
            {/* Email */}
            <div>
              {" "}
              <Controller
                control={form.control}
                name="email"
                render={({ field, fieldState }) => (
                  <Field className="w-full">
                    <FieldLabel>Email</FieldLabel>
                    <FieldContent>
                      <Input
                        placeholder="Enter user email"
                        {...field}
                        disabled={true}
                      />
                    </FieldContent>
                    <FieldError
                      errors={fieldState.error ? [fieldState.error] : []}
                    />
                  </Field>
                )}
              />
            </div>
            {/* Name */}
            <div>
              {" "}
              <Controller
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Name</FieldLabel>
                    <FieldContent>
                      <Input placeholder="Enter user name" {...field} />
                    </FieldContent>
                    <FieldError
                      errors={fieldState.error ? [fieldState.error] : []}
                    />
                  </Field>
                )}
              />
            </div>
            {/* Role */}
            <div className=" my-4">
              <Controller
                control={form.control}
                name="role"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Role</FieldLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value.toString()}
                    >
                      <FieldContent>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FieldContent>
                      <SelectContent>
                        {USER_ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError
                      errors={fieldState.error ? [fieldState.error] : []}
                    />
                  </Field>
                )}
              />
            </div>

            <div className="flex-between">
              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Submitting..." : "Update User"}
              </Button>
            </div>
          </form>
        </FieldSet>
      </FieldGroup>
    </>
  );
};

export default UpdateUserForm;
