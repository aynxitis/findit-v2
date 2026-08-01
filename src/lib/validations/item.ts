import { z } from "zod";
import { VALID_CATEGORIES, VALID_WHERE_LEFT } from "@/lib/taxonomy";

export const reportItemSchema = z.object({
  type: z.enum(["found", "lost"]),
  category: z.enum(VALID_CATEGORIES as [string, ...string[]], {
    message: "Please select a category",
  }),
  zone: z.string().max(40).nullable(),
  location: z.string().max(80, "Location is too long").nullable(),
  whereLeft: z
    .enum(VALID_WHERE_LEFT as [string, ...string[]])
    .nullable()
    .optional(),
  date: z.string().min(1, "Please select a date"),
  description: z.string().max(400, "Description is too long").nullable(),
  photoURL: z.string().url().nullable().optional(),
});

export type ReportItemData = z.infer<typeof reportItemSchema>;

export const itemSchema = reportItemSchema.extend({
  user_id: z.string(),
  user_email: z.string().email(),
  user_name: z.string().nullable(),
  status: z.enum(["open", "claimed"]),
  created_at: z.string().nullable(),
});

export type ItemSchema = z.infer<typeof itemSchema>;

export function validateReportItem(data: ReportItemData): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  const result = reportItemSchema.safeParse(data);
  if (!result.success) {
    result.error.issues.forEach((issue) => {
      if (issue.path[0]) {
        errors[issue.path[0] as string] = issue.message;
      }
    });
  }

  if (data.type === "found" && !data.whereLeft) {
    errors.whereLeft = "Please select where the item is now";
  }

  if (!data.location) {
    errors.location = "Please select a location";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
