import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000, "Message is too long"),
  // Honeypot field - must be empty
  website: z.string().max(0).optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;
