import { Button } from "@/components/ui/button";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getAllCategories } from "@/lib/actions/product.actions";
import { MenuIcon } from "lucide-react";
import Link from "next/link";

const CategoryDrawer = async () => {
  const categories = await getAllCategories();
  return (
    <Sheet>
      <SheetTrigger className="border rounded p-2">
        <MenuIcon />
      </SheetTrigger>
      <SheetContent className="w-full max-y-sm" side="left">
        <SheetHeader>
          <SheetTitle>Select a category</SheetTitle>
          <div className="space-y-1 mt-4">
            {categories.map((x) => (
              <Button
                variant="ghost"
                className="w-full justify-start"
                key={x.category}
                asChild
              >
                <SheetClose asChild>
                  <Link href={`/search?category=${x.category}`}>
                    {x.category} ({x._count})
                  </Link>
                </SheetClose>
              </Button>
            ))}
          </div>
        </SheetHeader>
      </SheetContent>
    </Sheet> 
  );
};

export default CategoryDrawer;
