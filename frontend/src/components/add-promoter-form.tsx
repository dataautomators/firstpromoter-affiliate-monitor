"use client";

import { addPromoter } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { type PromoterSchema, promoterSchema } from "@/lib/schema";
import { convertCronToUTC, validateCronSchedule } from "@/lib/validateCron";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { CronExpressionInput } from "./cron-expression-input";

export default function AddPromoterForm() {
  const { toast } = useToast();
  const [isManual, setIsManual] = useState(false);
  const router = useRouter();

  const form = useForm<PromoterSchema>({
    resolver: zodResolver(promoterSchema),
    defaultValues: {
      source: "",
      email: "",
      password: "",
      isEnabled: true,
      manualRun: false,
      schedule: "*/15 * * * *", // Default to every 15 minutes
    },
  });

  async function onSubmit(values: PromoterSchema) {
    if (values.manualRun) {
      values.schedule = ""; // Disable schedule
    }

    // Convert cron to UTC
    if (values.schedule) {
      const utcCron = convertCronToUTC(values.schedule);
      if (validateCronSchedule(utcCron)) {
        values.schedule = utcCron;
      }
    }

    const result = await addPromoter(values);
    if (result.success) {
      form.reset();
      toast({
        title: "Success",
        description: "Promoter added successfully",
      });

      router.push("/");
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Add New Promoter</CardTitle>
        <CardDescription>
          Enter the details for the new promoter
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="********" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Enable</FormLabel>
                    <FormDescription>
                      Enable or disable this promoter
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="manualRun"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Manual</FormLabel>
                    <FormDescription>
                      Set to manual or scheduled operation
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        setIsManual(checked);
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            {!isManual && (
              <FormField
                control={form.control}
                name="schedule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Schedule</FormLabel>
                    <FormControl>
                      <CronExpressionInput
                        value={field.value ?? ""}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormDescription>
                      Set the schedule for automatic operation
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <Button type="submit">Add Promoter</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
