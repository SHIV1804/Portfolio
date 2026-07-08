"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactSchema, type ContactFormData } from "../model/schema";
import { Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export const ContactForm: React.FC = () => {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send message");
      }

      setStatus("success");
      reset();
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-4 animate-in fade-in zoom-in duration-300">
        <CheckCircle2 className="w-16 h-16 text-accent" />
        <h3 className="text-2xl font-bold text-foreground">Message sent</h3>
        <p className="text-foreground-muted max-w-md">
          I&apos;ll get back to you soon. Thanks for reaching out.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-4 text-sm font-mono text-accent hover:underline uppercase tracking-widest"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-full max-w-2xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name Field */}
        <div className="space-y-2">
          <label htmlFor="name" className="text-xs font-mono text-accent uppercase tracking-widest">
            Name
          </label>
          <input
            {...register("name")}
            id="name"
            type="text"
            placeholder="Your name"
            className={`w-full bg-surface border ${
              errors.name ? "border-red-500" : "border-border"
            } rounded-lg px-4 py-3 text-foreground placeholder:text-foreground-faint focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all`}
          />
          {errors.name && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.name.message}
            </p>
          )}
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <label htmlFor="email" className="text-xs font-mono text-accent uppercase tracking-widest">
            Email
          </label>
          <input
            {...register("email")}
            id="email"
            type="email"
            placeholder="your@email.com"
            className={`w-full bg-surface border ${
              errors.email ? "border-red-500" : "border-border"
            } rounded-lg px-4 py-3 text-foreground placeholder:text-foreground-faint focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all`}
          />
          {errors.email && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.email.message}
            </p>
          )}
        </div>
      </div>

      {/* Honeypot Field (Hidden) */}
      <div className="hidden">
        <label htmlFor="website">Website</label>
        <input {...register("website")} id="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {/* Message Field */}
      <div className="space-y-2">
        <label htmlFor="message" className="text-xs font-mono text-accent uppercase tracking-widest">
          Message
        </label>
        <textarea
          {...register("message")}
          id="message"
          rows={5}
          placeholder="What's on your mind?"
          className={`w-full bg-surface border ${
            errors.message ? "border-red-500" : "border-border"
          } rounded-lg px-4 py-3 text-foreground placeholder:text-foreground-faint focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all resize-none`}
        />
        {errors.message && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {errors.message.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full md:w-auto px-8 py-4 bg-accent text-background font-bold rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            Send Message
          </>
        )}
      </button>

      {status === "error" && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4" />
          {errorMessage}
        </div>
      )}
    </form>
  );
};
