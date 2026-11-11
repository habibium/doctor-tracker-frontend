"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon, HospitalIcon, MailIcon, PhoneIcon } from "lucide-react";
import { LoadError } from "@/components/data-table/list-states";
import { LocalDate } from "@/components/local-date";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCanEdit } from "@/components/user-provider";
import { AddPatientButton } from "@/features/patients/patient-actions";
import { PatientsView } from "@/features/patients/patients-view";
import { formatNumber, initials } from "@/lib/format";
import { DoctorProfileActions } from "./doctor-actions";
import { DoctorAnalyticsBoard } from "./doctor-analytics";
import { doctorQueries } from "./queries";

export function DoctorProfile({ id }: { id: string }) {
  const { data: doctor, error, isPending, refetch } = useQuery(doctorQueries.detail(id));
  const canEdit = useCanEdit();

  if (isPending) return <DoctorProfileSkeleton />;
  if (!doctor) return <LoadError error={error} onRetry={() => void refetch()} />;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 self-start text-muted-foreground"
          nativeButton={false}
          render={<Link href="/doctors" />}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          All doctors
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar size="lg" className="size-14 text-lg">
              <AvatarFallback>{initials(doctor.name)}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col gap-1.5">
              <h1 className="truncate text-2xl font-semibold tracking-tight">{doctor.name}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <Badge variant="secondary">{doctor.specialization}</Badge>
                <span>
                  On the roster since <LocalDate value={doctor.createdAt} />
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DoctorProfileActions doctor={doctor} />
          </div>
        </div>

        <dl className="grid overflow-hidden rounded-2xl border sm:grid-cols-2 lg:grid-cols-4 [&>div]:border-b [&>div]:p-4 sm:[&>div]:border-r lg:[&>div]:border-b-0">
          <div>
            <dt className="text-sm text-muted-foreground">Patients in care</dt>
            <dd className="mt-1 text-2xl font-semibold">{formatNumber(doctor.patientCount)}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <HospitalIcon className="size-3.5" />
              Hospital
            </dt>
            <dd className="mt-1.5">{doctor.hospital}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <PhoneIcon className="size-3.5" />
              Phone
            </dt>
            <dd className="mt-1.5">
              <a href={`tel:${doctor.phone}`} className="tabular underline-offset-4 hover:underline">
                {doctor.phone}
              </a>
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MailIcon className="size-3.5" />
              Email
            </dt>
            <dd className="mt-1.5 truncate">
              <a href={`mailto:${doctor.email}`} className="underline-offset-4 hover:underline">
                {doctor.email}
              </a>
            </dd>
          </div>
        </dl>
      </div>

      <DoctorAnalyticsBoard doctor={doctor} />

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Patients</h2>
          {canEdit && <AddPatientButton doctor={doctor} />}
        </div>
        <PatientsView doctorId={doctor.id} />
      </section>
    </div>
  );
}

export function DoctorProfileSkeleton() {
  return (
    <div className="flex flex-col gap-5" role="status" aria-label="Loading doctor">
      <Skeleton className="h-8 w-28 rounded-full" />
      <div className="flex items-center gap-4">
        <Skeleton className="size-14 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
      <Skeleton className="h-24 rounded-2xl" />
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  );
}
