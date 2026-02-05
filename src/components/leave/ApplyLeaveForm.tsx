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
import { CreateLeaveRequest } from "@/types/leave";

const formSchema = z.object({
  leaveType: z.enum([
    "Annual",
    "Sick",
    "Compassionate",
    "Unpaid",
    "Maternity",
    "Paternity",
  ] as const),
  dateRange: z.object({
    from: z.date(),
    to: z.date(),
  }),
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
          console.error("Failed to calculate days", error);
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
                  <FormLabel>Handover To</FormLabel>
                  {/* TODO: Replace with a proper User Combobox/Search later */}
                  <Input placeholder="Search colleague..." {...field} />
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
