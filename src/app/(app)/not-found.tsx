import Link from "next/link";
import { MissingMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

export default function NotFound() {
  return (
    <Empty className="flex-1">
      <EmptyHeader>
        <MissingMark className="mb-2 size-16" />
        <EmptyTitle>Nothing here</EmptyTitle>
        <EmptyDescription>
          This record may have been deleted, or the link may be wrong.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button nativeButton={false} render={<Link href="/doctors" />}>
          Back to doctors
        </Button>
      </EmptyContent>
    </Empty>
  );
}
