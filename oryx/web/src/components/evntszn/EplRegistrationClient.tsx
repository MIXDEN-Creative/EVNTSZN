"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const CITY_OPTIONS = ["Baltimore", "Ocean City", "Rehoboth", "Bethany", "Dewey", "Fenwick"];

export default function EplRegistrationClient() {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    age: "21",
    city: "Baltimore",
    state: "MD",
    positionPrimary: "WR/DB",
    positionSecondary: "",
    experienceLevel: "Competitive",
    jerseyNameRequested: "",
    preferredJerseyNumber1: "1",
    preferredJerseyNumber2: "11",
  });

  async function submit() {
    setSubmitting(true);
    setMessage("");
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.set(key, value));
      formData.set("jerseyNamePolicyAccepted", "true");
      const response = await fetch("/api/epl/registrations", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as { error?: string; checkoutUrl?: string; message?: string };
      if (!response.ok) throw new Error(payload.error || "Could not register.");
      setMessage(payload.message || "Registration submitted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not register.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="space-y-4">
      <div>
        <CardTitle className="text-3xl">Register without local infrastructure.</CardTitle>
        <CardDescription className="mt-3">
          EPL accepts city-based registrations immediately. Payment is not required in this phase.
        </CardDescription>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input placeholder="First name" value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} />
        <Input placeholder="Last name" value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} />
        <Input placeholder="Email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
        <Input placeholder="Phone" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
        <Input type="number" placeholder="Age" value={form.age} onChange={(event) => setForm((current) => ({ ...current, age: event.target.value }))} />
        <Select value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}>
          {CITY_OPTIONS.map((city) => <option key={city} value={city}>{city}</option>)}
        </Select>
        <Input placeholder="State" value={form.state} onChange={(event) => setForm((current) => ({ ...current, state: event.target.value }))} />
        <Input placeholder="Primary position" value={form.positionPrimary} onChange={(event) => setForm((current) => ({ ...current, positionPrimary: event.target.value }))} />
        <Input placeholder="Secondary position" value={form.positionSecondary} onChange={(event) => setForm((current) => ({ ...current, positionSecondary: event.target.value }))} />
        <Input placeholder="Experience" value={form.experienceLevel} onChange={(event) => setForm((current) => ({ ...current, experienceLevel: event.target.value }))} />
        <Input placeholder="Jersey name" value={form.jerseyNameRequested} onChange={(event) => setForm((current) => ({ ...current, jerseyNameRequested: event.target.value }))} />
        <div className="grid grid-cols-2 gap-4">
          <Input placeholder="No. 1" value={form.preferredJerseyNumber1} onChange={(event) => setForm((current) => ({ ...current, preferredJerseyNumber1: event.target.value }))} />
          <Input placeholder="No. 2" value={form.preferredJerseyNumber2} onChange={(event) => setForm((current) => ({ ...current, preferredJerseyNumber2: event.target.value }))} />
        </div>
      </div>

      {message ? <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/72">{message}</div> : null}

      <Button onClick={submit} disabled={submitting || !form.firstName || !form.email} className="w-full sm:w-auto">
        {submitting ? "Submitting..." : "Join EPL"}
      </Button>
    </Card>
  );
}
