"use client";

import { productDefaultValues } from "@/lib/constants";
import { insertProductSchema, updateProductSchema } from "@/lib/validators";
import { Product } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  Controller,
  Resolver,
  SubmitHandler,
  useForm,
  useWatch,
} from "react-hook-form";
import z from "zod";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
  FieldSet,
} from "../ui/field";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import slugify from "slugify";
import { Textarea } from "../ui/textarea";
import { createProduct, updateProduct } from "@/lib/actions/product.actions";
import { toast } from "sonner";
import { Card, CardContent } from "../ui/card";
import Image from "next/image";
import { UploadButton } from "@/lib/uploadthing";
import { Checkbox } from "@/components/ui/checkbox";
const ProductForm = ({
  type,
  product,
  productId,
}: {
  type: "Create" | "Update";
  product?: Product;
  productId?: string;
}) => {
  const router = useRouter();
  const form = useForm<z.infer<typeof insertProductSchema>>({
    resolver:
      type === "Update"
        ? (zodResolver(updateProductSchema) as unknown as Resolver<
            z.infer<typeof insertProductSchema>
          >)
        : zodResolver(insertProductSchema),
    defaultValues:
      product && type === "Update" ? product : productDefaultValues,
  });

  const onSubmit: SubmitHandler<z.infer<typeof insertProductSchema>> = async (
    values,
  ) => {
    if (type === "Create") {
      const res = await createProduct(values);

      if (!res.success) {
        toast.error(res.message);
      } else {
        toast.success(res.message);
      }
      router.push("/admin/products");
    }

    if (type === "Update") {
      if (!productId) {
        router.push("/admin/products");
        return;
      }

      const res = await updateProduct({ ...values, id: productId });

      if (!res.success) {
        toast.error(res.message);
      } else {
        toast.success(res.message);
      }
      router.push("/admin/products");
    }
  };
  const images = useWatch({ control: form.control, name: "images" });
  const IsFeatured = useWatch({ control: form.control, name: "isFeatured" });
  const banner = useWatch({ control: form.control, name: "banner" });

  return (
    <FieldSet>
      <form
        method="POST"
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8"
      >
        <div className="flex flex-col md:flex-row gap-5">
          {/* Name */}
          <Controller
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Name</FieldLabel>
                <FieldContent>
                  <Input placeholder="Enter product name" {...field} />
                </FieldContent>
                <FieldError
                  errors={fieldState.error ? [fieldState.error] : []}
                />
              </Field>
            )}
          />
          {/* Slug */}
          <Controller
            control={form.control}
            name="slug"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Slug</FieldLabel>
                <FieldContent>
                  <div className=" relative">
                    <Input placeholder="Enter slug" {...field} />
                    <Button
                      type="button"
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-1 mt-2"
                      onClick={() => {
                        form.setValue(
                          "slug",
                          slugify(form.getValues("name"), { lower: true }),
                        );
                      }}
                    >
                      Generate
                    </Button>
                  </div>
                </FieldContent>
                <FieldError
                  errors={fieldState.error ? [fieldState.error] : []}
                />
              </Field>
            )}
          />
        </div>
        <div className="flex flex-col md:flex-row gap-5">
          {/* Category */}
          <Controller
            control={form.control}
            name="category"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Category</FieldLabel>
                <FieldContent>
                  <Input placeholder="Enter category" {...field} />
                </FieldContent>
                <FieldError
                  errors={fieldState.error ? [fieldState.error] : []}
                />
              </Field>
            )}
          />

          {/* Brand */}
          <Controller
            control={form.control}
            name="brand"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Brand</FieldLabel>
                <FieldContent>
                  <Input placeholder="Enter product brand" {...field} />
                </FieldContent>
                <FieldError
                  errors={fieldState.error ? [fieldState.error] : []}
                />
              </Field>
            )}
          />
        </div>
        <div className="flex flex-col md:flex-row gap-5">
          {/* Price */}
          <Controller
            control={form.control}
            name="price"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Price</FieldLabel>
                <FieldContent>
                  <Input placeholder="0" {...field} />
                  <FieldError
                    errors={fieldState.error ? [fieldState.error] : []}
                  />
                </FieldContent>
              </Field>
            )}
          />
          {/* Stock */}
          <Controller
            control={form.control}
            name="stock"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Stock</FieldLabel>
                <FieldContent>
                  <Input
                    placeholder="Enter product stock"
                    type="number"
                    {...field}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? "" : e.target.valueAsNumber,
                      )
                    }
                  />
                </FieldContent>
                <FieldError
                  errors={fieldState.error ? [fieldState.error] : []}
                />
              </Field>
            )}
          />
        </div>{" "}
        <div className="upload-field flex flex-col md:flex-row gap-5">
          {/* Images */}
          <Controller
            control={form.control}
            name="images"
            render={() => (
              <Field>
                <FieldLabel>Images</FieldLabel>
                <Card>
                  <CardContent className="space-y-2 mt-2 min-h-48">
                    <div className="flex-start space-x-2">
                      {images.map((image: string) => (
                        <Image
                          key={image}
                          src={image}
                          alt="Product image"
                          className="w-20 h-20 object-cover object-center rounded-sm"
                          width={100}
                          height={100}
                        />
                      ))}
                      <FieldContent>
                        <UploadButton
                          endpoint="imageUploader"
                          onClientUploadComplete={(res: { url: string }[]) => {
                            form.setValue("images", [...images, res[0].url]);
                          }}
                          onUploadError={(error: Error) => {
                            toast.error(`ERROR! ${error.message}`);
                          }}
                        />
                      </FieldContent>
                    </div>
                  </CardContent>
                </Card>
                <FieldError />
              </Field>
            )}
          />
        </div>
        <div className="upload-field">
          {/* IsFeatured */}
          Featured Product
          <Card>
            <CardContent className="space-y-2 mt-2">
              <Controller
                control={form.control}
                name="isFeatured"
                render={({ field }) => (
                  <Field className="space-x-2 items-center flex flex-row">
                    <FieldContent>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FieldContent>
                    <FieldLabel>Is Featured?</FieldLabel>
                  </Field>
                )}
              />
              {IsFeatured && banner && (
                <Image
                  src={banner}
                  alt="banner image"
                  className="w-full object-cover object-center rounded-sm"
                  width={1920}
                  height={680}
                />
              )}

              {IsFeatured && !banner && (
                <UploadButton
                  endpoint="imageUploader"
                  onClientUploadComplete={(res: { url: string }[]) => {
                    form.setValue("banner", res[0].url);
                  }}
                  onUploadError={(error: Error) => {
                    toast.error(`ERROR! ${error.message}`);
                  }}
                />
              )}
            </CardContent>
          </Card>
        </div>
        <div>
          {/* Description */}

          <Controller
            control={form.control}
            name="description"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Description</FieldLabel>
                <FieldContent>
                  <Textarea
                    placeholder="Enter product description"
                    className="resize-none"
                    {...field}
                  />
                </FieldContent>
                <FieldError
                  errors={fieldState.error ? [fieldState.error] : []}
                />
              </Field>
            )}
          />
        </div>
        <div>
          {/* Submit */}
          <Button
            type="submit"
            size="lg"
            disabled={form.formState.isSubmitting}
            className="button col-span-2 w-full"
          >
            {form.formState.isSubmitting ? "Submitting" : `${type} Product`}
          </Button>
        </div>
      </form>
    </FieldSet>
  );
};

export default ProductForm;
