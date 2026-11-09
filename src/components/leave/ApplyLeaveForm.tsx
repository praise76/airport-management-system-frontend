import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { calculateWorkingDays } from "@/api/leave";
import { ColleaguePicker } from "@/components/staff/ColleaguePicker";
import { useMyLeaveBalances } from "@/hooks/leave";
import { useAuthStore } from "@/stores/auth";
import { CreateLeaveRequest } from "@/types/leave";

const formSchema = z.object({
  // Custom messages replace zod's generic "Invalid input" (QA finding LV-06).
  leaveType: z.enum(
    ["Annual", "Sick", "Compassionate", "Unpaid", "Maternity", "Paternity"] as const,
    { message: "Choose a leave type" },
  ),
  dateRange: z
    .object(
      {
        from: z.date({ message: "Pick the first day of leave" }),
        to: z.date({ message: "Pick the last day of leave" }),
      },
      { message: "Pick the dates you'll be away" },
    )
    .refine((r) => r.to >= r.from, { message: "The last day must be on or after the first day" }),
  reason: z.string().min(5, "Reason must be at least 5 characters"),
  handoverToUserId: z.string().optional(),
  handoverNotes: z.string().optional(),
  contactPhone: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
});

interface ApplyLeaveFormProps {
  onSubmit: (data: CreateLeaveRequest) => void;
  isSubmitting?: boolean;
  onCancel: () => void;
}

export function ApplyLeaveForm({
  onSubmit,
  isSubmitting,
  onCancel,
}: ApplyLeaveFormProps) {
  const [calculatingDays, setCalculatingDays] = useState(false);
  const [totalDays, setTotalDays] = useState<number | null>(null);

  const me = useAuthStore((st) => st.user);
  // QA NEW-01: the server refuses leave when no entitlement is set up, which was the case for
  // every user. Say so up front instead of only after Submit.
  const { data: balances, isSuccess: balancesLoaded } = useMyLeaveBalances();
  const noEntitlements = balancesLoaded && (balances?.length ?? 0) === 0;
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: "",
    },
  });

  const dateRange = form.watch("dateRange");

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      const fetchDays = async () => {
        setCalculatingDays(true);
        try {
          const res = await calculateWorkingDays({
            startDate: format(dateRange.from, "yyyy-MM-dd"),
            endDate: format(dateRange.to, "yyyy-MM-dd"),
          });
          setTotalDays(res.days);
        } catch (error) {
          // calculateWorkingDays already falls back to counting weekdays.
        } finally {
          setCalculatingDays(false);
        }
      };

      // Simple debounce or check if dates are valid
      if (dateRange.from <= dateRange.to) {
        fetchDays();
      }
    } else {
      setTotalDays(null);
    }
  }, [dateRange]);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    const payload: CreateLeaveRequest = {
      leaveType: values.leaveType,
      startDate: format(values.dateRange.from, "yyyy-MM-dd"),
      endDate: format(values.dateRange.to, "yyyy-MM-dd"),
      reason: values.reason,
      handoverToUserId: values.handoverToUserId,
      handoverNotes: values.handoverNotes,
      contactPhone: values.contactPhone,
      emergencyContactName: values.emergencyContactName,
      emergencyContactPhone: values.emergencyContactPhone,
    };
    onSubmit(payload);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {noEntitlements && (
          <div role="status" className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
            Your leave entitlements haven't been set up yet, so the system can't accept an application.
            Ask HR to set up your leave balance, then apply again.
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="leaveType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Leave Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Annual">Annual Leave</SelectItem>
                    <SelectItem value="Sick">Sick Leave</SelectItem>
                    <SelectItem value="Compassionate">
                      Compassionate Leave
                    </SelectItem>
                    <SelectItem value="Unpaid">Unpaid Leave</SelectItem>
                    <SelectItem value="Maternity">Maternity Leave</SelectItem>
                    <SelectItem value="Paternity">Paternity Leave</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dateRange"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Duration</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value?.from ? (
                          field.value.to ? (
                            <>
                              {format(field.value.from, "LLL dd, y")} -{" "}
                              {format(field.value.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(field.value.from, "LLL dd, y")
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {calculatingDays ? (
                  <FormDescription className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" /> Calculating
                    days...
                  </FormDescription>
                ) : totalDays !== null ? (
                  <FormDescription className="text-primary font-medium">
                    Total Working Days: {totalDays}
                  </FormDescription>
                ) : null}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Please provide a brief reason for your leave..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
          <h4 className="font-medium text-sm">Handover Details (Optional)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="handoverToUserId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Handover to</FormLabel>
                  {/* A colleague from the same department; the value sent is their staff ID. */}
                  <FormControl>
                    <ColleaguePicker
                      value={field.value}
                      onChange={(id) => field.onChange(id)}
                      departmentId={me?.departmentId}
                      excludeIds={[me?.id, me?.userId]}
                      placeholder="Choose a colleague"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="handoverNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes for Handover</FormLabel>
                  <Input placeholder="Key tasks, contact info..." {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Application
          </Button>
        </div>
      </form>
    </Form>
  );
}
